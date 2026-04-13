package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CryptoHandler struct {
	cryptoSvc  *service.CryptoService
	reservaSvc *service.ReservaDisponibilidad
	pool       *pgxpool.Pool
}

func NewCryptoHandler(cryptoSvc *service.CryptoService, reservaSvc *service.ReservaDisponibilidad, pool *pgxpool.Pool) *CryptoHandler {
	return &CryptoHandler{
		cryptoSvc:  cryptoSvc,
		reservaSvc: reservaSvc,
		pool:       pool,
	}
}

type CryptoCreateRequest struct {
	ReservaID        string  `json:"reservaId"`
	Monto            float64 `json:"monto"`
	PropiedadID      string  `json:"propiedadId"`
	FechaEntrada     string  `json:"fechaEntrada"`
	FechaSalida      string  `json:"fechaSalida"`
	CantidadHuespedes int    `json:"cantidadHuespedes"`
}

func (h *CryptoHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req CryptoCreateRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Monto <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_AMOUNT", "Monto invalido")
		return
	}

	if h.cryptoSvc.config.WalletAddress == "" {
		slog.Error("[crypto/create] CRYPTAPI_WALLET_ADDRESS not configured")
		ErrorJSON(w, http.StatusInternalServerError, "WALLET_NOT_CONFIGURED", "Wallet no configurada")
		return
	}

	needCreateReserva := req.ReservaID == ""
	if needCreateReserva && (req.PropiedadID == "" || req.FechaEntrada == "" || req.FechaSalida == "" || req.CantidadHuespedes == 0) {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_DATA", "Faltan datos: propiedadId, fechaEntrada, fechaSalida, cantidadHuespedes")
		return
	}

	reservaIDFinal := req.ReservaID

	if needCreateReserva {
		fechaEntrada, err := time.Parse("2006-01-02", req.FechaEntrada)
		fechaSalida, err2 := time.Parse("2006-01-02", req.FechaSalida)
		if err != nil || err2 != nil {
			ErrorJSON(w, http.StatusBadRequest, "INVALID_DATES", "Fechas invalidas")
			return
		}

		disp, err := h.reservaSvc.Verificar(r.Context(), req.PropiedadID, fechaEntrada, fechaSalida)
		if err != nil {
			slog.Error("[crypto/create] availability check error", "error", err)
			ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error verificando disponibilidad")
			return
		}

		if !disp.Disponible {
			msg := "Las fechas seleccionadas ya no estan disponibles"
			if disp.Conflicto != nil && disp.Conflicto.Tipo == "FECHA_BLOQUEADA" {
				msg = "Las fechas seleccionadas estan bloqueadas"
			}
			ErrorJSON(w, http.StatusBadRequest, "RESERVA_NOT_AVAILABLE", msg)
			return
		}

		_, titulo, precioPorNoche, moneda, propietarioID, err := h.reservaSvc.ObtenerPropiedad(r.Context(), req.PropiedadID)
		if err != nil {
			slog.Error("[crypto/create] propiedad not found", "error", err)
			ErrorJSON(w, http.StatusNotFound, "PROPIEDAD_NOT_FOUND", "Propiedad no encontrada")
			return
		}

		calculo := service.CalcularPrecioReserva(precioPorNoche, fechaEntrada, fechaSalida, enums.Moneda(moneda))
		codigoReserva := service.GenerarCodigoReserva()
		newReservaID := fmt.Sprintf("%016x", rand.Int63())

		_, err = h.pool.Exec(r.Context(), `
			INSERT INTO reservas (id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida,
				noches, precio_por_noche, subtotal, comision_plataforma, comision_anfitrion, total,
				moneda, cantidad_huespedes, estado, fecha_creacion)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE', NOW())
		`, newReservaID, codigoReserva, req.PropiedadID, userID, fechaEntrada, fechaSalida,
			calculo.Noches, calculo.PrecioPorNoche, calculo.Subtotal, calculo.ComisionHuesped,
			calculo.ComisionAnfitrion, calculo.Total, string(calculo.Moneda), req.CantidadHuespedes,
		)
		if err != nil {
			slog.Error("[crypto/create] reserva insert error", "error", err)
			ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error al crear la reserva")
			return
		}

		reservaIDFinal = newReservaID

		_, _ = h.pool.Exec(r.Context(), `
			INSERT INTO notificaciones (tipo, titulo, mensaje, usuario_id, url_accion, created_at)
			VALUES ('NUEVA_RESERVA', 'Nueva reserva recibida', $1, $2, '/dashboard/reservas-recibidas', NOW())
		`, fmt.Sprintf("Tienes una nueva reserva cripto para \"%s\"", titulo), propietarioID)
	}

	callbackURL := h.cryptoSvc.BuildCallbackURL(map[string]string{
		"reservaId":     reservaIDFinal,
		"propiedadId":   req.PropiedadID,
		"fechaEntrada":  req.FechaEntrada,
		"fechaSalida":   req.FechaSalida,
		"secret":        h.cryptoSvc.config.CallbackSecret,
	})

	cryptoResult, err := h.cryptoSvc.CreateAddress(callbackURL)
	if err != nil {
		slog.Error("[crypto/create] cryptapi error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "CRYPTAPI_ERROR", err.Error())
		return
	}

	if reservaIDFinal != "" {
		pagoID := fmt.Sprintf("%016x", rand.Int63())
		_, err = h.pool.Exec(r.Context(), `
			INSERT INTO pagos (id, monto, moneda, metodo_pago, estado, referencia, fecha_creacion,
				reserva_id, usuario_id, crypto_address)
			VALUES ($1, $2, 'USD', 'CRIPTO', 'PENDIENTE', 'Crypto - pendiente TX', NOW(), $3, $4, $5)
		`, pagoID, req.Monto, reservaIDFinal, userID, cryptoResult.AddressIn)
		if err != nil {
			slog.Error("[crypto/create] pago insert error", "error", err)
		}
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"address":   cryptoResult.AddressIn,
		"reservaId": reservaIDFinal,
		"ticker":    service.CryptapiTicker,
		"network":   service.CryptapiNetwork,
		"currency":  service.CryptapiCurrency,
		"amount":    req.Monto,
	})
}

func (h *CryptoHandler) Callback(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	secret := q.Get("secret")
	if !h.cryptoSvc.VerifyCallbackSecret(secret) {
		ErrorJSON(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
		return
	}

	txHash := q.Get("tx_hash")
	if txHash == "" {
		txHash = q.Get("tx_in")
	}
	if txHash == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_TX_HASH", "Missing tx_hash")
		return
	}

	valueCoin := q.Get("value_coin")
	if valueCoin == "" {
		valueCoin = q.Get("value")
	}

	confirmations, _ := strconv.Atoi(q.Get("confirmations"))

	reservaID := q.Get("reservaId")
	propiedadID := q.Get("propiedadId")
	fechaEntrada := q.Get("fechaEntrada")
	fechaSalida := q.Get("fechaSalida")

	var pagoID, pagoEstado string
	var pagoReservaID string

	if reservaID != "" {
		err := h.pool.QueryRow(r.Context(), `
			SELECT id, estado, reserva_id FROM pagos
			WHERE metodo_pago = 'CRIPTO' AND reserva_id = $1
			ORDER BY fecha_creacion DESC LIMIT 1
		`, reservaID).Scan(&pagoID, &pagoEstado, &pagoReservaID)
		if err != nil {
			ErrorJSON(w, http.StatusNotFound, "PAGO_NOT_FOUND", "Pago no encontrado")
			return
		}
	} else if propiedadID != "" {
		err := h.pool.QueryRow(r.Context(), `
			SELECT p.id, p.estado, p.reserva_id FROM pagos p
			JOIN reservas r ON p.reserva_id = r.id
			WHERE p.metodo_pago = 'CRIPTO'
			  AND r.propiedad_id = $1
			  AND r.fecha_entrada >= $2
			  AND r.fecha_salida <= $3
			ORDER BY p.fecha_creacion DESC LIMIT 1
		`, propiedadID, fechaEntrada, fechaSalida).Scan(&pagoID, &pagoEstado, &pagoReservaID)
		if err != nil {
			ErrorJSON(w, http.StatusNotFound, "PAGO_NOT_FOUND", "Pago no encontrado")
			return
		}
	} else {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "Missing reservaId or propiedadId")
		return
	}

	if pagoEstado == "VERIFICADO" || pagoEstado == "ACREDITADO" {
		JSON(w, http.StatusOK, map[string]interface{}{"ok": true, "message": "Ya verificado"})
		return
	}

	isConfirmed := confirmations >= service.CryptapiMinConfirmations
	ref := fmt.Sprintf("TX: %s...", txHash[:min(16, len(txHash))])

	newEstado := "EN_VERIFICACION"
	var verifiedAt *string
	if isConfirmed {
		newEstado = "VERIFICADO"
		now := time.Now().Format(time.RFC3339)
		verifiedAt = &now
	}

	_, err := h.pool.Exec(r.Context(), `
		UPDATE pagos SET crypto_tx_hash = $1, crypto_confirmations = $2, crypto_value_coin = $3,
			referencia = $4, estado = $5, fecha_verificacion = $6 WHERE id = $7
	`, txHash, confirmations, valueCoin, ref, newEstado, verifiedAt, pagoID)
	if err != nil {
		slog.Error("[crypto/callback] pago update error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error updating pago")
		return
	}

	if isConfirmed && pagoReservaID != "" {
		_, _ = h.pool.Exec(r.Context(), `
			UPDATE reservas SET estado = 'CONFIRMADA', fecha_confirmacion = NOW()
			WHERE id = $1 AND estado = 'PENDIENTE'
		`, pagoReservaID)
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (h *CryptoHandler) CallbackPost(w http.ResponseWriter, r *http.Request) {
	h.Callback(w, r)
}

var _ = json.Marshal
