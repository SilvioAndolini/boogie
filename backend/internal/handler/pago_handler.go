package handler

import (
	"log/slog"
	"net/http"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type PagoHandler struct {
	svc *service.PagoService
}

func NewPagoHandler(svc *service.PagoService) *PagoHandler {
	return &PagoHandler{svc: svc}
}

type registrarPagoSimpleRequest struct {
	ReservaID  string  `json:"reservaId"`
	Monto      float64 `json:"monto"`
	Moneda     string  `json:"moneda"`
	MetodoPago string  `json:"metodoPago"`
	Referencia string  `json:"referencia"`
}

func (h *PagoHandler) RegistrarSimple(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req registrarPagoSimpleRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_RESERVA_ID", "reservaId es requerido")
		return
	}
	if req.Monto <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_MONTO", "monto debe ser mayor a 0")
		return
	}
	if req.MetodoPago == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_METODO", "metodoPago es requerido")
		return
	}

	validMetodos := map[string]bool{
		"TRANSFERENCIA_BANCARIA": true, "PAGO_MOVIL": true, "ZELLE": true,
		"EFECTIVO_FARMATODO": true, "EFECTIVO": true,
	}
	if !validMetodos[req.MetodoPago] {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_METODO", "metodo de pago invalido")
		return
	}

	moneda := enums.Moneda(req.Moneda)
	if moneda != enums.MonedaUSD && moneda != enums.MonedaVES {
		moneda = enums.MonedaUSD
	}

	pagoID, err := h.svc.RegistrarPagoSimple(r.Context(), req.ReservaID, userID, req.Monto, moneda, enums.MetodoPagoEnum(req.MetodoPago), req.Referencia)
	if err != nil {
		slog.Error("[pagos/registrar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "PAGO_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      pagoID,
		"mensaje": "Pago registrado exitosamente",
	})
}

type registrarPagoComprobanteRequest struct {
	ReservaID      string  `json:"reservaId"`
	Monto          float64 `json:"monto"`
	Moneda         string  `json:"moneda"`
	MetodoPago     string  `json:"metodoPago"`
	Referencia     string  `json:"referencia"`
	ComprobanteURL *string `json:"comprobanteUrl"`
	BancoEmisor    *string `json:"bancoEmisor"`
	TelefonoEmisor *string `json:"telefonoEmisor"`
}

func (h *PagoHandler) RegistrarConComprobante(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req registrarPagoComprobanteRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_RESERVA_ID", "reservaId es requerido")
		return
	}
	if req.Monto <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_MONTO", "monto debe ser mayor a 0")
		return
	}
	if req.MetodoPago == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_METODO", "metodoPago es requerido")
		return
	}

	moneda := enums.Moneda(req.Moneda)
	if moneda != enums.MonedaUSD && moneda != enums.MonedaVES {
		moneda = enums.MonedaUSD
	}

	pagoID, err := h.svc.RegistrarPagoConComprobante(r.Context(), req.ReservaID, userID, req.Monto, moneda, enums.MetodoPagoEnum(req.MetodoPago), req.Referencia, req.ComprobanteURL, req.BancoEmisor, req.TelefonoEmisor)
	if err != nil {
		slog.Error("[pagos/registrar-comprobante] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "PAGO_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      pagoID,
		"mensaje": "Pago registrado exitosamente",
	})
}

type verificarPagoRequest struct {
	Aprobado bool     `json:"aprobado"`
	Notas    *string  `json:"notas"`
}

func (h *PagoHandler) Verificar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	pagoID := chi.URLParam(r, "id")
	if pagoID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de pago requerido")
		return
	}

	var req verificarPagoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.Verificar(r.Context(), pagoID, userID, req.Aprobado, req.Notas); err != nil {
		slog.Error("[pagos/verificar] error", "error", err, "pagoId", pagoID)
		ErrorJSON(w, http.StatusBadRequest, "VERIFY_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"mensaje": "Pago verificado exitosamente",
	})
}

func (h *PagoHandler) MisPagos(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	pagos, err := h.svc.GetMisPagos(r.Context(), userID)
	if err != nil {
		slog.Error("[pagos/mis-pagos] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener pagos")
		return
	}

	JSON(w, http.StatusOK, pagos)
}
