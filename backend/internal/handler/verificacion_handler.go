package handler

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

const verifDocMaxSize = 10 << 20

type verifAllowedType map[string]bool

var verifAllowedImageTypes = verifAllowedType{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

type VerificacionHandler struct {
	svc         *service.VerificacionService
	storage     StorageUploader
	supabaseURL string
	serviceKey  string
}

func NewVerificacionHandler(svc *service.VerificacionService) *VerificacionHandler {
	return &VerificacionHandler{svc: svc}
}

func (h *VerificacionHandler) WithStorage(uploader StorageUploader, supabaseURL, serviceKey string) *VerificacionHandler {
	h.storage = uploader
	h.supabaseURL = supabaseURL
	h.serviceKey = serviceKey
	return h
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

func (h *VerificacionHandler) SubirDocumento(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	if h.storage == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Storage no configurado")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, verifDocMaxSize+1024)
	if err := r.ParseMultipartForm(verifDocMaxSize); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "FILE_TOO_LARGE", "Archivos muy grandes (max 10MB total)")
		return
	}

	timestamp := time.Now().UnixMilli()

	uploadOne := func(fieldName, suffix string) (string, error) {
		file, header, err := r.FormFile(fieldName)
		if err != nil {
			return "", fmt.Errorf("falta %s", fieldName)
		}
		defer file.Close()

		contentType := header.Header.Get("Content-Type")
		if !verifAllowedImageTypes[contentType] {
			return "", fmt.Errorf("formato no permitido en %s. Usa JPG, PNG o WebP", fieldName)
		}

		ext := filepath.Ext(header.Filename)
		if ext == "" {
			ext = ".webp"
		}
		storagePath := fmt.Sprintf("verificaciones/%s/%d_%s%s", userID, timestamp, suffix, ext)

		fileBytes, err := io.ReadAll(file)
		if err != nil {
			return "", fmt.Errorf("error al leer %s", fieldName)
		}

		publicURL, err := h.storage.UploadStorage(r.Context(), h.supabaseURL, h.serviceKey, "imagenes", storagePath, fileBytes, contentType)
		if err != nil {
			return "", fmt.Errorf("error al subir %s", fieldName)
		}
		return publicURL, nil
	}

	fotoFrontalURL, err := uploadOne("fotoFrontal", "frontal")
	if err != nil {
		slog.Error("[verificacion/subir-documento] frontal upload error", "error", err, "userId", userID)
		ErrorJSON(w, http.StatusBadRequest, "UPLOAD_FRONTAL", err.Error())
		return
	}

	fotoTraseraURL, err := uploadOne("fotoTrasera", "trasera")
	if err != nil {
		slog.Error("[verificacion/subir-documento] trasera upload error", "error", err, "userId", userID)
		ErrorJSON(w, http.StatusBadRequest, "UPLOAD_TRASERA", err.Error())
		return
	}

	fotoSelfieURL, err := uploadOne("fotoSelfie", "selfie")
	if err != nil {
		slog.Error("[verificacion/subir-documento] selfie upload error", "error", err, "userId", userID)
		ErrorJSON(w, http.StatusBadRequest, "UPLOAD_SELFIE", err.Error())
		return
	}

	id, err := h.svc.SubirDocumento(r.Context(), userID, fotoFrontalURL, fotoTraseraURL, fotoSelfieURL)
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
