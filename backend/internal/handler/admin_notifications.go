package handler

import (
	"net/http"
)

func (h *AdminHandler) GetNotificaciones(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	pagina := intQueryParam(r, "pagina", 1)
	result, err := h.svc.GetNotificaciones(r.Context(), pagina)
	if err != nil {
		mapError(w, err, "[admin/notificaciones]")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) EnviarNotificacion(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req enviarNotificacionRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Titulo == "" || req.Mensaje == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "titulo y mensaje son requeridos")
		return
	}

	var usuarioID string
	if req.UsuarioID != nil {
		usuarioID = *req.UsuarioID
	}
	if err := h.svc.EnviarNotificacion(r.Context(), usuarioID, req.Titulo, req.Mensaje, req.URLAccion); err != nil {
		mapError(w, err, "[admin/notificaciones/enviar]")
		return
	}
	h.auditLog(r, "", "enviar_notificacion", "notificacion", nil, map[string]interface{}{"titulo": req.Titulo, "usuarioId": usuarioID})
	JSON(w, http.StatusCreated, OKResponse{Ok: true})
}
