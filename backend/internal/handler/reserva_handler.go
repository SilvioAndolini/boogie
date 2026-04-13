package handler

import (
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ReservaHandler struct {
	svc        *service.ReservaService
	disponSvc  *service.ReservaDisponibilidad
}

func NewReservaHandler(svc *service.ReservaService, disponSvc *service.ReservaDisponibilidad) *ReservaHandler {
	return &ReservaHandler{svc: svc, disponSvc: disponSvc}
}

type crearReservaRequest struct {
	PropiedadID       string  `json:"propiedadId"`
	FechaEntrada      string  `json:"fechaEntrada"`
	FechaSalida       string  `json:"fechaSalida"`
	CantidadHuespedes int     `json:"cantidadHuespedes"`
	NotasHuesped      *string `json:"notasHuesped"`
}

func (h *ReservaHandler) Crear(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearReservaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.PropiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PROP_ID", "propiedadId es requerido")
		return
	}

	fechaEntrada, err := time.Parse("2006-01-02", req.FechaEntrada)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_ENTRADA", "fechaEntrada invalida (formato: YYYY-MM-DD)")
		return
	}

	fechaSalida, err := time.Parse("2006-01-02", req.FechaSalida)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_SALIDA", "fechaSalida invalida (formato: YYYY-MM-DD)")
		return
	}

	if req.CantidadHuespedes < 1 || req.CantidadHuespedes > 20 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_HUESPEDES", "cantidadHuespedes debe ser entre 1 y 20")
		return
	}

	result, err := h.svc.Crear(r.Context(), &service.CrearReservaInput{
		PropiedadID:       req.PropiedadID,
		HuespedID:         userID,
		FechaEntrada:      fechaEntrada,
		FechaSalida:       fechaSalida,
		CantidadHuespedes: req.CantidadHuespedes,
		NotasHuesped:      req.NotasHuesped,
	})
	if err != nil {
		slog.Error("[reservas/crear] error", "error", err, "userId", userID, "propId", req.PropiedadID)
		if isBusinessError(err) {
			ErrorJSON(w, http.StatusBadRequest, "RESERVA_ERROR", err.Error())
			return
		}
		ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error al crear reserva")
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":               result.Reserva.ID,
		"codigo":           result.Reserva.Codigo,
		"propiedadId":      result.Reserva.PropiedadID,
		"fechaEntrada":     result.Reserva.FechaEntrada,
		"fechaSalida":      result.Reserva.FechaSalida,
		"noches":           result.Reserva.Noches,
		"precioPorNoche":   result.Reserva.PrecioPorNoche,
		"subtotal":         result.Reserva.Subtotal,
		"comisionPlataforma": result.Reserva.ComisionPlataforma,
		"comisionAnfitrion": result.Reserva.ComisionAnfitrion,
		"total":            result.Reserva.Total,
		"moneda":           result.Reserva.Moneda,
		"cantidadHuespedes": result.Reserva.CantidadHuespedes,
		"estado":           result.Reserva.Estado,
	})
}

func (h *ReservaHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	detalle, err := h.svc.GetByID(r.Context(), reservaID, userID)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	JSON(w, http.StatusOK, detalle)
}

func (h *ReservaHandler) MisReservas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	page, perPage := getPagination(r)

	reservas, total, err := h.svc.ListByHuesped(r.Context(), userID, page, perPage)
	if err != nil {
		slog.Error("[reservas/mis] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener reservas")
		return
	}

	if reservas == nil {
		reservas = []repository.ReservaConPropiedad{}
	}

	JSONWithMeta(w, http.StatusOK, reservas, Meta{
		Page:    page,
		PerPage: perPage,
		Total:   total,
	})
}

func (h *ReservaHandler) ReservasRecibidas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	page, perPage := getPagination(r)
	estado := r.URL.Query().Get("estado")

	reservas, total, err := h.svc.ListByPropietario(r.Context(), userID, estado, page, perPage)
	if err != nil {
		slog.Error("[reservas/recibidas] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener reservas")
		return
	}

	if reservas == nil {
		reservas = []repository.ReservaConHuesped{}
	}

	JSONWithMeta(w, http.StatusOK, reservas, Meta{
		Page:    page,
		PerPage: perPage,
		Total:   total,
	})
}

type confirmarRechazarRequest struct {
	Accion string  `json:"accion"`
	Motivo *string `json:"motivo"`
}

func (h *ReservaHandler) ConfirmarORechazar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	var req confirmarRechazarRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Accion != "confirmar" && req.Accion != "rechazar" {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_ACCION", "accion debe ser 'confirmar' o 'rechazar'")
		return
	}

	err := h.svc.ConfirmarORechazar(r.Context(), reservaID, userID, service.TransicionEstado(req.Accion), req.Motivo)
	if err != nil {
		slog.Error("[reservas/confirmar-rechazar] error", "error", err, "reservaId", reservaID)
		if isBusinessError(err) {
			ErrorJSON(w, http.StatusBadRequest, "ACCION_ERROR", err.Error())
			return
		}
		ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error al procesar accion")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"mensaje": fmt.Sprintf("Reserva %s exitosamente", req.Accion),
	})
}

type cancelarRequest struct {
	Motivo *string `json:"motivo"`
}

func (h *ReservaHandler) Cancelar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	var req cancelarRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	reembolso, err := h.svc.Cancelar(r.Context(), &service.CancelarInput{
		ReservaID: reservaID,
		UserID:    userID,
		Motivo:    req.Motivo,
	})
	if err != nil {
		slog.Error("[reservas/cancelar] error", "error", err, "reservaId", reservaID)
		if isBusinessError(err) {
			ErrorJSON(w, http.StatusBadRequest, "CANCEL_ERROR", err.Error())
			return
		}
		ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error al cancelar reserva")
		return
	}

	resp := map[string]interface{}{
		"ok":      true,
		"mensaje": "Reserva cancelada exitosamente",
	}
	if reembolso != nil {
		resp["reembolso"] = reembolso
	}

	JSON(w, http.StatusOK, resp)
}

func (h *ReservaHandler) Stats(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	rol := r.URL.Query().Get("rol")
	esPropietario := rol == "anfitrion"

	stats, err := h.svc.GetStats(r.Context(), userID, esPropietario)
	if err != nil {
		slog.Error("[reservas/stats] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "STATS_ERROR", "Error al obtener estadisticas")
		return
	}

	JSON(w, http.StatusOK, stats)
}

func (h *ReservaHandler) Pagos(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	pagos, err := h.svc.GetPagos(r.Context(), reservaID, userID)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	if pagos == nil {
		pagos = []repository.PagoResumen{}
	}

	JSON(w, http.StatusOK, pagos)
}

type registrarPagoRequest struct {
	ReservaID      string  `json:"reservaId"`
	Monto          float64 `json:"monto"`
	Moneda         string  `json:"moneda"`
	MetodoPago     string  `json:"metodoPago"`
	Referencia     string  `json:"referencia"`
	ComprobanteURL *string `json:"comprobanteUrl"`
	BancoEmisor    *string `json:"bancoEmisor"`
	TelefonoEmisor *string `json:"telefonoEmisor"`
	Notas          *string `json:"notas"`
}

func (h *ReservaHandler) RegistrarPago(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req registrarPagoRequest
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

	pagoID, err := h.svc.RegistrarPago(r.Context(), &repository.NuevoPago{
		ReservaID:      req.ReservaID,
		UsuarioID:      userID,
		Monto:          req.Monto,
		Moneda:         moneda,
		MetodoPago:     enums.MetodoPagoEnum(req.MetodoPago),
		Referencia:     req.Referencia,
		ComprobanteURL: req.ComprobanteURL,
		BancoEmisor:    req.BancoEmisor,
		TelefonoEmisor: req.TelefonoEmisor,
		Notas:          req.Notas,
	}, userID)
	if err != nil {
		slog.Error("[reservas/registrar-pago] error", "error", err)
		if isBusinessError(err) {
			ErrorJSON(w, http.StatusBadRequest, "PAGO_ERROR", err.Error())
			return
		}
		ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error al registrar pago")
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      pagoID,
		"mensaje": "Pago registrado exitosamente",
	})
}

type disponibilidadRequest struct {
	PropiedadID  string `json:"propiedadId"`
	FechaEntrada string `json:"fechaEntrada"`
	FechaSalida  string `json:"fechaSalida"`
}

func (h *ReservaHandler) Disponibilidad(w http.ResponseWriter, r *http.Request) {
	propID := r.URL.Query().Get("propiedadId")
	fe := r.URL.Query().Get("fechaEntrada")
	fs := r.URL.Query().Get("fechaSalida")

	if propID == "" || fe == "" || fs == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "propiedadId, fechaEntrada y fechaSalida son requeridos")
		return
	}

	fechaEntrada, err := time.Parse("2006-01-02", fe)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaEntrada invalida")
		return
	}
	fechaSalida, err := time.Parse("2006-01-02", fs)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaSalida invalida")
		return
	}

	result, err := h.disponSvc.Verificar(r.Context(), propID, fechaEntrada, fechaSalida)
	if err != nil {
		slog.Error("[reservas/disponibilidad] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "CHECK_ERROR", "Error al verificar disponibilidad")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"disponible": result.Disponible,
	})
}

func getPagination(r *http.Request) (page, perPage int) {
	page = 1
	perPage = 20

	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && p > 0 {
		page = p
	}
	if pp, err := strconv.Atoi(r.URL.Query().Get("perPage")); err == nil && pp > 0 && pp <= 50 {
		perPage = pp
	}
	return
}

func isBusinessError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	businessErrors := []string{
		"no encontrada", "no publicada", "tu propia propiedad",
		"capacidad maxima", "estancia minima", "estancia maxima",
		"pasado", "posterior", "entre 1 y 365",
		"disponib", "bloqueada", "permisos", "no se puede",
		"no esta en estado", "solo el huesped",
	}
	for _, be := range businessErrors {
		if contains(msg, be) {
			return true
		}
	}
	return false
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstr(s, substr))
}

func containsSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
