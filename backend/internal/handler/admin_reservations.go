package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *AdminHandler) GetReservas(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	estado := r.URL.Query().Get("estado")
	busqueda := r.URL.Query().Get("busqueda")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetReservas(r.Context(), estado, busqueda, pagina)
	if err != nil {
		mapError(w, r, err, "[admin/reservas]")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetReservasStats(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	stats, err := h.svc.GetReservasStats(r.Context())
	if err != nil {
		mapError(w, r, err, "[admin/reservas/stats]")
		return
	}
	JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) AccionReserva(w http.ResponseWriter, r *http.Request) {
	ok, adminID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req accionReservaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.ReservaID == "" || req.Accion == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "reservaId y accion son requeridos")
		return
	}
	if err := h.svc.AccionReserva(r.Context(), req.ReservaID, req.Accion, adminID); err != nil {
		mapError(w, r, err, "[admin/reservas/accion]")
		return
	}
	h.auditLog(r, adminID, "accion_reserva", "reserva", &req.ReservaID, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) GetReservaByID(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	result, err := h.svc.GetReservaByID(r.Context(), id)
	if err != nil {
		mapError(w, r, err, "[admin/reservas/by-id]", "id", id)
		return
	}
	JSON(w, http.StatusOK, result)
}
