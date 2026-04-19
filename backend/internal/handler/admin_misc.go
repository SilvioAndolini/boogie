package handler

import (
	"net/http"
)

func (h *AdminHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	stats, err := h.svc.GetDashboardStats(r.Context())
	if err != nil {
		mapError(w, err, "[admin/dashboard]")
		return
	}
	JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) GetComisiones(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	comisiones, err := h.svc.GetComisiones(r.Context())
	if err != nil {
		mapError(w, err, "[admin/comisiones]")
		return
	}
	JSON(w, http.StatusOK, comisiones)
}

func (h *AdminHandler) UpdateComisiones(w http.ResponseWriter, r *http.Request) {
	ok, userID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req updateComisionesRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if err := h.svc.UpdateComisiones(r.Context(), req.ComisionHuesped, req.ComisionAnfitrion, userID); err != nil {
		mapError(w, err, "[admin/comisiones]")
		return
	}
	h.auditLog(r, userID, "update_comisiones", "comisiones", nil, map[string]interface{}{"comisionHuesped": req.ComisionHuesped, "comisionAnfitrion": req.ComisionAnfitrion})
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) GetAuditLog(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	entidad := r.URL.Query().Get("entidad")
	adminID := r.URL.Query().Get("adminId")
	fechaInicio := r.URL.Query().Get("fechaInicio")
	fechaFin := r.URL.Query().Get("fechaFin")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetAuditLog(r.Context(), entidad, adminID, fechaInicio, fechaFin, pagina)
	if err != nil {
		mapError(w, err, "[admin/auditoria]")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetCiudades(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	ciudades, err := h.svc.GetCiudades(r.Context())
	if err != nil {
		mapError(w, err, "[admin/propiedades/ciudades]")
		return
	}
	JSON(w, http.StatusOK, ciudades)
}
