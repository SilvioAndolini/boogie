package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *AdminHandler) GetPropiedades(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	estado := r.URL.Query().Get("estado")
	ciudad := r.URL.Query().Get("ciudad")
	busqueda := r.URL.Query().Get("busqueda")
	categoria := r.URL.Query().Get("categoria")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetPropiedades(r.Context(), estado, ciudad, busqueda, categoria, pagina)
	if err != nil {
		mapError(w, r, err, "[admin/propiedades]")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) UpdatePropiedad(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req updatePropiedadRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.PropiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "propiedadId es requerido")
		return
	}

	var estado string
	if req.EstadoPublicacion != nil {
		estado = *req.EstadoPublicacion
	}
	if err := h.svc.UpdatePropiedad(r.Context(), req.PropiedadID, estado, req.Destacada); err != nil {
		mapError(w, r, err, "[admin/propiedades/update]")
		return
	}
	h.auditLog(r, "", "update_propiedad", "propiedad", &req.PropiedadID, map[string]interface{}{"estado": estado, "destacada": req.Destacada})
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) DeletePropiedad(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}
	if err := h.svc.DeletePropiedad(r.Context(), id); err != nil {
		mapError(w, r, err, "[admin/propiedades/delete]")
		return
	}
	h.auditLog(r, "", "delete_propiedad", "propiedad", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) GetPropiedadByID(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	result, err := h.svc.GetPropiedadByID(r.Context(), id)
	if err != nil {
		mapError(w, r, err, "[admin/propiedades/by-id]", "id", id)
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetPropiedadIngresos(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	result, err := h.svc.GetPropiedadIngresos(r.Context(), id)
	if err != nil {
		mapError(w, r, err, "[admin/propiedades/ingresos]")
		return
	}
	JSON(w, http.StatusOK, result)
}
