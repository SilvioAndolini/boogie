package handler

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
)

type DashboardHandler struct {
	svc            *service.DashboardService
	propiedadesSvc *service.PropiedadesService
}

func NewDashboardHandler(svc *service.DashboardService, propiedadesSvc *service.PropiedadesService) *DashboardHandler {
	return &DashboardHandler{svc: svc, propiedadesSvc: propiedadesSvc}
}

func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	propiedadID := chi.URLParam(r, "id")
	if propiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de propiedad requerido")
		return
	}

	dashboardData, err := h.svc.GetDashboard(r.Context(), propiedadID, userID)
	if err != nil {
		slog.Error("[dashboard] error", "error", err, "propiedadID", propiedadID)
		ErrorJSON(w, http.StatusForbidden, "DASHBOARD_ERROR", err.Error())
		return
	}

	propiedad, err := h.propiedadesSvc.GetByID(r.Context(), propiedadID)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", "Propiedad no encontrada")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"propiedad":         propiedad,
		"gastos":            dashboardData.Gastos,
		"fechasBloqueadas":  dashboardData.FechasBloqueadas,
		"preciosEspeciales": dashboardData.PreciosEspeciales,
		"reservas":          dashboardData.Reservas,
		"amenidades":        dashboardData.Amenidades,
		"kpis":              dashboardData.KPIs,
		"ingresosByMonth":   dashboardData.IngresosByMonth,
		"gastosByMonth":     dashboardData.GastosByMonth,
		"ocupadas":          dashboardData.Ocupadas,
	})
}

type crearGastoRequest struct {
	Descripcion string  `json:"descripcion"`
	Monto       float64 `json:"monto"`
	Moneda      string  `json:"moneda"`
	Categoria   string  `json:"categoria"`
	Fecha       string  `json:"fecha"`
}

func (h *DashboardHandler) CrearGasto(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	propiedadID := chi.URLParam(r, "id")
	if propiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de propiedad requerido")
		return
	}

	var req crearGastoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	gasto, err := h.svc.CrearGasto(r.Context(), propiedadID, userID, req.Descripcion, req.Monto, req.Moneda, req.Categoria, req.Fecha)
	if err != nil {
		slog.Error("[dashboard/gastos] crear error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CREAR_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, gasto)
}

func (h *DashboardHandler) EliminarGasto(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	propiedadID := chi.URLParam(r, "id")
	gastoID := chi.URLParam(r, "gastoId")
	if propiedadID == "" || gastoID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "IDs requeridos")
		return
	}

	if err := h.svc.EliminarGasto(r.Context(), gastoID, propiedadID, userID); err != nil {
		slog.Error("[dashboard/gastos] eliminar error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true, "mensaje": "Gasto eliminado"})
}
