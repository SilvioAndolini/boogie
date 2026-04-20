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
	"github.com/jackc/pgx/v5"
)

var errFechasNoDisponibles = fmt.Errorf("fechas no disponibles")

type CryptoHandler struct {
	cryptoSvc   *service.CryptoService
	reservaSvc  *service.ReservaDisponibilidad
	cryptoRepo  *repository.CryptoRepo
	reservaRepo *repository.ReservaRepo
}

func NewCryptoHandler(cryptoSvc *service.CryptoService, reservaSvc *service.ReservaDisponibilidad, cryptoRepo *repository.CryptoRepo, reservaRepo *repository.ReservaRepo) *CryptoHandler {
	return &CryptoHandler{
		cryptoSvc:   cryptoSvc,
		reservaSvc:  reservaSvc,
		cryptoRepo:  cryptoRepo,
		reservaRepo: reservaRepo,
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
		CaptureError(w, r, http.StatusInternalServerError, "WALLET_NOT_CONFIGURED", "Wallet no configurada", fmt.Errorf("CRYPTAPI_WALLET_ADDRESS not configured"))
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

		_, titulo, precioPorNoche, moneda, propietarioID, err := h.reservaSvc.ObtenerPropiedad(r.Context(), req.PropiedadID)
		if err != nil {
			mapError(w, r, err, "[crypto/create] propiedad", "propId", req.PropiedadID)
			return
		}

		callbackURL := h.cryptoSvc.BuildCallbackURL(map[string]string{
			"propiedadId":  req.PropiedadID,
			"fechaEntrada": req.FechaEntrada,
			"fechaSalida":  req.FechaSalida,
			"secret":       h.cryptoSvc.Config.CallbackSecret,
		})

		cryptoResult, err := h.cryptoSvc.CreateAddress(callbackURL)
		if err != nil {
			mapError(w, r, err, "[crypto/create]")
			return
		}

		var newReservaID string
		comisionH, comisionA := h.cryptoSvc.Comisiones()
		txErr := repository.WithTx(r.Context(), h.cryptoRepo.Pool(), func(tx pgx.Tx) error {
			solapado, dispErr := h.reservaRepo.ExistsSolapamientoWithDB(r.Context(), tx, req.PropiedadID, fechaEntrada, fechaSalida)
			if dispErr != nil {
				return fmt.Errorf("error al verificar disponibilidad: %w", dispErr)
			}
			if solapado {
				return errFechasNoDisponibles
			}

			rid, insertErr := h.cryptoRepo.InsertReservaCryptoWithDB(
				r.Context(), tx, req.PropiedadID, userID, precioPorNoche, enums.Moneda(moneda),
				req.FechaEntrada, req.FechaSalida, req.CantidadHuespedes,
				comisionH, comisionA,
			)
			if insertErr != nil {
				return fmt.Errorf("error al crear reserva: %w", insertErr)
			}
			newReservaID = rid

			if nerr := h.cryptoRepo.InsertNotificacionWithDB(r.Context(), tx,
				"NUEVA_RESERVA", "Nueva reserva recibida",
				fmt.Sprintf("Tienes una nueva reserva cripto para \"%s\"", titulo),
				propietarioID, "/dashboard/reservas-recibidas",
			); nerr != nil {
				slog.Error("[crypto/create] notificacion error", "error", nerr)
			}

			if pErr := h.cryptoRepo.InsertCryptoPagoWithDB(r.Context(), tx, newReservaID, userID, req.Monto, cryptoResult.AddressIn); pErr != nil {
				slog.Error("[crypto/create] pago insert error", "error", pErr)
			}

			return nil
		})
		if txErr != nil {
			if txErr == errFechasNoDisponibles {
				ErrorJSON(w, http.StatusBadRequest, "RESERVA_NOT_AVAILABLE", "Las fechas seleccionadas ya no estan disponibles")
				return
			}
			mapError(w, r, txErr, "[crypto/create] tx", "propId", req.PropiedadID)
			return
		}

		reservaIDFinal = newReservaID

		JSON(w, http.StatusOK, CryptoAddressResponse{
			Address:   cryptoResult.AddressIn,
			ReservaID: reservaIDFinal,
			Ticker:    service.CryptapiTicker,
			Network:   service.CryptapiNetwork,
			Currency:  service.CryptapiCurrency,
			Amount:    req.Monto,
		})
		return
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
		mapError(w, r, err, "[crypto/create]")
		return
	}

	if reservaIDFinal != "" {
		if err := h.cryptoRepo.InsertCryptoPago(r.Context(), reservaIDFinal, userID, req.Monto, cryptoResult.AddressIn); err != nil {
			slog.Error("[crypto/create] pago insert error", "error", err)
		}
	}

	JSON(w, http.StatusOK, CryptoAddressResponse{
		Address:   cryptoResult.AddressIn,
		ReservaID: reservaIDFinal,
		Ticker:    service.CryptapiTicker,
		Network:   service.CryptapiNetwork,
		Currency:  service.CryptapiCurrency,
		Amount:    req.Monto,
	})
}

func (h *CryptoHandler) Callback(w http.ResponseWriter, r *http.Request) {
	secret := r.Header.Get("X-Callback-Secret")
	if secret == "" {
		secret = r.URL.Query().Get("secret")
	}
	if !h.cryptoSvc.VerifyCallbackSecret(secret) {
		ErrorJSON(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
		return
	}

	q := r.URL.Query()
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
		JSON(w, http.StatusOK, CallbackOKResponse{Ok: true, Message: "Ya verificado"})
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
		CaptureError(w, r, http.StatusInternalServerError, "DB_ERROR", "Error updating pago", err)
		return
	}

	if isConfirmed && pagoReservaID != "" {
		if err := h.cryptoRepo.ConfirmarReservaFromCrypto(r.Context(), pagoReservaID); err != nil {
			slog.Error("[crypto/callback] confirmar reserva error", "error", err, "reservaID", pagoReservaID)
		}
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *CryptoHandler) CallbackPost(w http.ResponseWriter, r *http.Request) {
	h.Callback(w, r)
}

func (h *CryptoHandler) Verificar(w http.ResponseWriter, r *http.Request) {
	reservaID := r.URL.Query().Get("reservaId")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "reservaId requerido")
		return
	}

	estado, txHash, _, err := h.cryptoRepo.GetCryptoPagoStatus(r.Context(), reservaID)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "PAGO_NOT_FOUND", "Pago no encontrado")
		return
	}

	JSON(w, http.StatusOK, CryptoVerifyResponse{
		Estado:     estado,
		TxHash:     txHash,
		Confirmado: estado == "VERIFICADO" || estado == "ACREDITADO",
	})
}

func (h *CryptoHandler) SolicitarVerificacionManual(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req struct {
		ReservaID string `json:"reservaId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "reservaId requerido")
		return
	}

	err := h.cryptoRepo.SolicitarVerificacionManual(r.Context(), req.ReservaID)
	if err != nil {
		mapError(w, r, err, "[crypto/manual]", "reservaId", req.ReservaID)
		return
	}

	if nerr := h.cryptoRepo.InsertNotificacion(r.Context(),
		"VERIFICACION_MANUAL", "Verificacion manual de pago cripto",
		fmt.Sprintf("El huesped solicita verificacion manual de pago cripto para reserva %s", req.ReservaID[:8]),
		"", "/admin/reservas",
	); nerr != nil {
		slog.Error("[crypto/manual] notificacion error", "error", nerr)
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *CryptoHandler) CancelarFallida(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req struct {
		ReservaID string `json:"reservaId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "reservaId requerido")
		return
	}

	err := repository.WithTx(r.Context(), h.cryptoRepo.Pool(), func(tx pgx.Tx) error {
		return h.cryptoRepo.CancelarCryptoFallidaWithDB(r.Context(), tx, req.ReservaID, userID)
	})
	if err != nil {
		mapError(w, r, err, "[crypto/cancel-fallida]", "reservaId", req.ReservaID)
		return
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *CryptoHandler) ExpirarAbandonados(w http.ResponseWriter, r *http.Request) {
	var n int
	err := repository.WithTx(r.Context(), h.cryptoRepo.Pool(), func(tx pgx.Tx) error {
		var txErr error
		n, txErr = h.cryptoRepo.ExpirarCryptoAbandonadosWithDB(r.Context(), tx)
		return txErr
	})
	if err != nil {
		mapError(w, r, err, "[crypto/expirar]")
		return
	}
	JSON(w, http.StatusOK, OKExpiradosResponse{Ok: true, Expirados: n})
}
