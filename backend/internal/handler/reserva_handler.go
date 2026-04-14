package handler

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/boogie/backend/internal/auth"
	bizerrors "github.com/boogie/backend/internal/domain/errors"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ReservaHandler struct {
	svc       *service.ReservaService
	disponSvc *service.ReservaDisponibilidad
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

	fechaEntrada, err := parseFlexibleDate(req.FechaEntrada)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_ENTRADA", "fechaEntrada invalida (formato: YYYY-MM-DD)")
		return
	}

	fechaSalida, err := parseFlexibleDate(req.FechaSalida)
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
		handleBusinessError(w, err, "[reservas/crear]", userID, req.PropiedadID)
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":                 result.Reserva.ID,
		"codigo":             result.Reserva.Codigo,
		"propiedadId":        result.Reserva.PropiedadID,
		"fechaEntrada":       result.Reserva.FechaEntrada,
		"fechaSalida":        result.Reserva.FechaSalida,
		"noches":             result.Reserva.Noches,
		"precioPorNoche":     result.Reserva.PrecioPorNoche,
		"subtotal":           result.Reserva.Subtotal,
		"comisionPlataforma": result.Reserva.ComisionPlataforma,
		"comisionAnfitrion":  result.Reserva.ComisionAnfitrion,
		"total":              result.Reserva.Total,
		"moneda":             result.Reserva.Moneda,
		"cantidadHuespedes":  result.Reserva.CantidadHuespedes,
		"estado":             result.Reserva.Estado,
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
		status, code := mapBizErrorToHTTP(err)
		ErrorJSON(w, status, code, err.Error())
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
		status, code := mapBizErrorToHTTP(err)
		ErrorJSON(w, status, code, err.Error())
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
		status, code := mapBizErrorToHTTP(err)
		ErrorJSON(w, status, code, err.Error())
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

	fechaEntrada, err := parseFlexibleDate(fe)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaEntrada invalida")
		return
	}
	fechaSalida, err := parseFlexibleDate(fs)
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

func (h *ReservaHandler) FechasOcupadas(w http.ResponseWriter, r *http.Request) {
	propID := r.URL.Query().Get("propiedadId")
	if propID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "propiedadId es requerido")
		return
	}

	fechas, err := h.disponSvc.ObtenerFechasOcupadas(r.Context(), propID)
	if err != nil {
		slog.Error("[reservas/fechas-ocupadas] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "FETCH_ERROR", "Error al obtener fechas ocupadas")
		return
	}

	JSON(w, http.StatusOK, fechas)
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

// parseFlexibleDate tries YYYY-MM-DD first, then RFC3339.
func parseFlexibleDate(s string) (time.Time, error) {
	t, err := time.Parse("2006-01-02", s)
	if err == nil {
		return t, nil
	}
	return time.Parse(time.RFC3339, s)
}

// mapBizErrorToHTTP maps a BusinessError code to an HTTP status.
func mapBizErrorToHTTP(err error) (int, string) {
	var bizErr *bizerrors.BusinessError
	if errors.As(err, &bizErr) {
		switch bizErr.Code {
		case bizerrors.CodeNotFound:
			return http.StatusNotFound, "NOT_FOUND"
		case bizerrors.CodeForbidden:
			return http.StatusForbidden, "FORBIDDEN"
		case bizerrors.CodeValidation, bizerrors.CodeBadRequest:
			return http.StatusBadRequest, "RESERVA_ERROR"
		case bizerrors.CodeConflict:
			return http.StatusConflict, "CONFLICT"
		case bizerrors.CodeStateConflict:
			return http.StatusBadRequest, "STATE_ERROR"
		default:
			return http.StatusBadRequest, "RESERVA_ERROR"
		}
	}
	return http.StatusInternalServerError, "INTERNAL_ERROR"
}

// handleBusinessError logs and responds for reserva operations.
func handleBusinessError(w http.ResponseWriter, err error, logPrefix, userID, propID string) {
	var bizErr *bizerrors.BusinessError
	if errors.As(err, &bizErr) {
		status, code := mapBizErrorToHTTP(err)
		slog.Error(logPrefix, "error", err, "code", bizErr.Code)
		ErrorJSON(w, status, code, err.Error())
		return
	}
	slog.Error(logPrefix, "error", err, "userId", userID, "propId", propID)
	ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error al procesar reserva")
}

// isBusinessError provides backward-compatible error classification for
// errors that haven't been migrated to typed BusinessError yet.
func isBusinessError(err error) bool {
	if err == nil {
		return false
	}
	var bizErr *bizerrors.BusinessError
	if errors.As(err, &bizErr) {
		return true
	}
	msg := strings.ToLower(err.Error())
	businessSubstrings := []string{
		"no encontrada", "no publicada", "tu propia propiedad",
		"capacidad maxima", "estancia minima", "estancia maxima",
		"pasado", "posterior", "entre 1 y 365",
		"disponib", "bloqueada", "permisos", "no se puede",
		"no esta en estado", "solo el huesped",
	}
	for _, sub := range businessSubstrings {
		if strings.Contains(msg, sub) {
			return true
		}
	}
	return false
}

func (h *ReservaHandler) AutoConfirmarExpiradas(w http.ResponseWriter, r *http.Request) {
	confirmadas, err := h.svc.AutoConfirmarExpiradas(r.Context())
	if err != nil {
		slog.Error("[reserva/auto-confirmar] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "AUTO_CONFIRM_ERROR", "Error al auto-confirmar")
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{
		"ok":          true,
		"confirmadas": confirmadas,
	})
}
