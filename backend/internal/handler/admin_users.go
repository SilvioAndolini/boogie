package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *AdminHandler) GetUsuarios(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	busqueda := r.URL.Query().Get("busqueda")
	rol := r.URL.Query().Get("rol")
	pagina := intQueryParam(r, "pagina", 1)
	limite := intQueryParam(r, "limite", 20)

	result, err := h.svc.GetUsuarios(r.Context(), busqueda, rol, pagina, limite)
	if err != nil {
		mapError(w, err, "[admin/usuarios]")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) CrearUsuario(w http.ResponseWriter, r *http.Request) {
	ok, adminID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req struct {
		Email    string  `json:"email"`
		Password string  `json:"password"`
		Nombre   string  `json:"nombre"`
		Apellido string  `json:"apellido"`
		Telefono *string `json:"telefono"`
		Rol      string  `json:"rol"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" || req.Password == "" || req.Nombre == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "email, password y nombre son requeridos")
		return
	}
	result, err := h.svc.CrearUsuario(r.Context(), req.Email, req.Password, req.Nombre, req.Apellido, req.Telefono, req.Rol, adminID)
	if err != nil {
		mapError(w, err, "[admin/usuarios/crear]")
		return
	}
	h.auditLog(r, adminID, "crear_usuario", "usuario", nil, map[string]interface{}{"email": req.Email, "rol": req.Rol})
	JSON(w, http.StatusCreated, result)
}

func (h *AdminHandler) UpdateUsuario(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	var req struct {
		Rol              *string  `json:"rol"`
		Plan             *string  `json:"plan"`
		PlanSuscripcion  *string  `json:"plan_suscripcion"`
		Reputacion       *float64 `json:"reputacion"`
		ReputacionManual *string  `json:"reputacion_manual"`
		Activo           *bool    `json:"activo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	plan := req.PlanSuscripcion
	if plan == nil && req.Plan != nil {
		plan = req.Plan
	}
	if err := h.svc.UpdateUsuario(r.Context(), id, req.Rol, plan, req.Reputacion, req.Activo); err != nil {
		mapError(w, err, "[admin/usuarios/update]")
		return
	}
	if req.Rol != nil && h.authClient != nil {
		if err := h.authClient.UpdateAppMetadata(r.Context(), h.serviceKey, id, map[string]interface{}{
			"rol": *req.Rol,
		}); err != nil {
			slog.Warn("[admin/usuarios/update] app_metadata sync failed", "error", err)
		}
	}
	h.auditLog(r, "", "update_usuario", "usuario", &id, map[string]interface{}{"rol": req.Rol, "activo": req.Activo})
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) DeleteUsuario(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteUsuario(r.Context(), id); err != nil {
		mapError(w, err, "[admin/usuarios/delete]")
		return
	}
	h.auditLog(r, "", "delete_usuario", "usuario", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}
