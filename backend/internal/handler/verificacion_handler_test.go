package handler

import (
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/stretchr/testify/assert"
)

func TestVerificacionGetByUser_Unauthorized(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/verificacion", nil)
	w := httptest.NewRecorder()
	h.GetByUser(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestVerificacionIniciarMetaMap_Unauthorized(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/verificacion/iniciar-metamap", nil)
	w := httptest.NewRecorder()
	h.IniciarMetaMap(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestVerificacionSubirDocumento_Unauthorized(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	var buf strings.Builder
	writer := multipart.NewWriter(&buf)
	writer.WriteField("fotoFrontal", "dummy")
	writer.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/verificacion/subir-documento", strings.NewReader(buf.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	h.SubirDocumento(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestVerificacionSubirDocumento_StorageNotConfigured(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	var buf strings.Builder
	writer := multipart.NewWriter(&buf)
	writer.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/verificacion/subir-documento", strings.NewReader(buf.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.SubirDocumento(w, req)
	assert.Equal(t, http.StatusServiceUnavailable, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "SERVICE_UNAVAILABLE", errBody["code"])
}

func TestVerificacionSubirDocumento_MissingFotos(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	var buf strings.Builder
	writer := multipart.NewWriter(&buf)
	writer.WriteField("fotoFrontal", "dummy")
	writer.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/verificacion/subir-documento", strings.NewReader(buf.String()))
	req.Header.Set("Content-Type", writer.FormDataContentType())
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.SubirDocumento(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "UPLOAD_FRONTAL", errBody["code"])
}

func TestVerificacionSubirDocumento_InvalidBody(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/verificacion/subir-documento", strings.NewReader("not multipart"))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.SubirDocumento(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVerificacionListAll_NotAdmin(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/verificaciones", nil)
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "BOOGER")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.ListAll(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestVerificacionRevisar_NotAdmin(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	body := `{"accion":"APROBADA"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verificaciones/v1/revisar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "BOOGER")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Revisar(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestVerificacionRevisar_InvalidBody(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/verificaciones/v1/revisar", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "admin-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "ADMIN")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Revisar(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVerificacionAdminCounts_NotAdmin(t *testing.T) {
	svc := service.NewVerificacionService(nil)
	h := NewVerificacionHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/counts", nil)
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "BOOGER")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.AdminCounts(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}
