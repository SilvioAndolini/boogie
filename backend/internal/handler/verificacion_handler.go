package handler

import (
	"log/slog"
	"net/http"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type VerificacionHandler struct {
	svc *service.VerificacionService
}

func NewVerificacionHandler(svc *service.VerificacionService) *VerificacionHandler {
	return &VerificacionHandler{svc: svc}
}

func (h *VerificacionHandler) GetByUser(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	v, err := h.svc.GetByUser(r.Context(), userID)
	if err != nil {
		JSON(w, http.StatusOK, nil)
		return
	}

	JSON(w, http.StatusOK, v)
}

func (h *VerificacionHandler) IniciarMetaMap(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	id, err := h.svc.IniciarMetaMap(r.Context(), userID)
	if err != nil {
		slog.Error("[verificacion/iniciar-metamap] error", "error", err, "userId", userID)
		ErrorJSON(w, http.StatusBadRequest, "VERIF_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      id,
		"metodo":  "METAMAP",
		"estado":  "PENDIENTE",
		"mensaje": "Verificación iniciada exitosamente",
	})
}

type subirDocumentoRequest struct {
	FotoFrontal string `json:"fotoFrontalUrl"`
	FotoTrasera string `json:"fotoTraseraUrl"`
	FotoSelfie  string `json:"fotoSelfieUrl"`
}

func (h *VerificacionHandler) SubirDocumento(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req subirDocumentoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.FotoFrontal == "" || req.FotoTrasera == "" || req.FotoSelfie == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_FOTOS", "Debes proporcionar las 3 URLs de fotos")
		return
	}

	id, err := h.svc.SubirDocumento(r.Context(), userID, req.FotoFrontal, req.FotoTrasera, req.FotoSelfie)
	if err != nil {
		slog.Error("[verificacion/subir-documento] error", "error", err, "userId", userID)
		ErrorJSON(w, http.StatusBadRequest, "VERIF_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      id,
		"metodo":  "MANUAL",
		"estado":  "PENDIENTE",
		"mensaje": "Documento registrado exitosamente",
	})
}

func (h *VerificacionHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	role := auth.GetUserRole(r.Context())
	if role != "ADMIN" {
		ErrorJSON(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Acceso de administrador requerido")
		return
	}

	verifs, err := h.svc.ListAll(r.Context())
	if err != nil {
		slog.Error("[admin/verificaciones] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al cargar verificaciones")
		return
	}

	JSON(w, http.StatusOK, verifs)
}

type revisarRequest struct {
	Accion        string  `json:"accion"`
	MotivoRechazo *string `json:"motivoRechazo"`
}

func (h *VerificacionHandler) Revisar(w http.ResponseWriter, r *http.Request) {
	adminID := auth.GetUserID(r.Context())
	role := auth.GetUserRole(r.Context())
	if role != "ADMIN" {
		ErrorJSON(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Acceso de administrador requerido")
		return
	}

	verifID := chi.URLParam(r, "id")
	if verifID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de verificación requerido")
		return
	}

	var req revisarRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.Revisar(r.Context(), &service.RevisarInput{
		VerificacionID: verifID,
		AdminID:        adminID,
		Accion:         req.Accion,
		MotivoRechazo:  req.MotivoRechazo,
	}); err != nil {
		slog.Error("[admin/verificaciones/revisar] error", "error", err, "verifId", verifID)
		ErrorJSON(w, http.StatusBadRequest, "REVISAR_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"mensaje": "Verificación actualizada exitosamente",
	})
}

func (h *VerificacionHandler) AdminCounts(w http.ResponseWriter, r *http.Request) {
	role := auth.GetUserRole(r.Context())
	if role != "ADMIN" {
		ErrorJSON(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Acceso de administrador requerido")
		return
	}

	counts, err := h.svc.GetAdminCounts(r.Context())
	if err != nil {
		slog.Error("[admin/counts] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "COUNTS_ERROR", "Error al obtener conteos")
		return
	}

	JSON(w, http.StatusOK, counts)
}
