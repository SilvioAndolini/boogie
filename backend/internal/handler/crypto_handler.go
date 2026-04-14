package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
)

type CryptoHandler struct {
	cryptoSvc  *service.CryptoService
	reservaSvc *service.ReservaDisponibilidad
	cryptoRepo *repository.CryptoRepo
}

func NewCryptoHandler(cryptoSvc *service.CryptoService, reservaSvc *service.ReservaDisponibilidad, cryptoRepo *repository.CryptoRepo) *CryptoHandler {
	return &CryptoHandler{
		cryptoSvc:  cryptoSvc,
		reservaSvc: reservaSvc,
		cryptoRepo: cryptoRepo,
	}
}

type CryptoCreateRequest struct {
	ReservaID         string  `json:"reservaId"`
	Monto             float64 `json:"monto"`
	PropiedadID       string  `json:"propiedadId"`
	FechaEntrada      string  `json:"fechaEntrada"`
	FechaSalida       string  `json:"fechaSalida"`
	CantidadHuespedes int     `json:"cantidadHuespedes"`
}

func (h *CryptoHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req CryptoCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("[crypto/create] decode error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Monto <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_AMOUNT", "Monto invalido")
		return
	}

	if h.cryptoSvc.Config.WalletAddress == "" {
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
		fechaEntrada, err := parseFlexibleDate(req.FechaEntrada)
		if err != nil {
			ErrorJSON(w, http.StatusBadRequest, "INVALID_DATES", "Fechas invalidas")
			return
		}
		fechaSalida, err := parseFlexibleDate(req.FechaSalida)
		if err != nil {
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

		newReservaID, err := h.cryptoRepo.InsertReservaCrypto(
			r.Context(), req.PropiedadID, userID, precioPorNoche, enums.Moneda(moneda),
			req.FechaEntrada, req.FechaSalida, req.CantidadHuespedes,
		)
		if err != nil {
			slog.Error("[crypto/create] reserva insert error", "error", err)
			ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error al crear la reserva")
			return
		}

		reservaIDFinal = newReservaID

		if nerr := h.cryptoRepo.InsertNotificacion(r.Context(),
			"NUEVA_RESERVA", "Nueva reserva recibida",
			fmt.Sprintf("Tienes una nueva reserva cripto para \"%s\"", titulo),
			propietarioID, "/dashboard/reservas-recibidas",
		); nerr != nil {
			slog.Error("[crypto/create] notificacion error", "error", nerr)
		}
	}

	callbackURL := h.cryptoSvc.BuildCallbackURL(map[string]string{
		"reservaId":    reservaIDFinal,
		"propiedadId":  req.PropiedadID,
		"fechaEntrada": req.FechaEntrada,
		"fechaSalida":  req.FechaSalida,
		"secret":       h.cryptoSvc.Config.CallbackSecret,
	})

	cryptoResult, err := h.cryptoSvc.CreateAddress(callbackURL)
	if err != nil {
		slog.Error("[crypto/create] cryptapi error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "CRYPTAPI_ERROR", err.Error())
		return
	}

	if reservaIDFinal != "" {
		if err := h.cryptoRepo.InsertCryptoPago(r.Context(), reservaIDFinal, userID, req.Monto, cryptoResult.AddressIn); err != nil {
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
	var err error

	if reservaID != "" {
		pagoID, pagoEstado, pagoReservaID, err = h.cryptoRepo.GetCryptoPagoByReserva(r.Context(), reservaID)
		if err != nil {
			ErrorJSON(w, http.StatusNotFound, "PAGO_NOT_FOUND", "Pago no encontrado")
			return
		}
	} else if propiedadID != "" {
		pagoID, pagoEstado, pagoReservaID, err = h.cryptoRepo.GetCryptoPagoByPropiedad(r.Context(), propiedadID, fechaEntrada, fechaSalida)
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

	if err := h.cryptoRepo.UpdateCryptoPago(r.Context(), pagoID, txHash, ref, newEstado, confirmations, valueCoin, verifiedAt); err != nil {
		slog.Error("[crypto/callback] pago update error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error updating pago")
		return
	}

	if isConfirmed && pagoReservaID != "" {
		if err := h.cryptoRepo.ConfirmarReservaFromCrypto(r.Context(), pagoReservaID); err != nil {
			slog.Error("[crypto/callback] confirmar reserva error", "error", err, "reservaID", pagoReservaID)
		}
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *CryptoHandler) CallbackPost(w http.ResponseWriter, r *http.Request) {
	h.Callback(w, r)
}
