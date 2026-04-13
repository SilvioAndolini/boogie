package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/stretchr/testify/assert"
)

func TestResenaCrear_Unauthorized(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"reservaId":"r1","calificacion":5,"comentario":"Excelente lugar, muy recomendado!"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestResenaCrear_MissingReservaID(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"calificacion":5,"comentario":"Excelente lugar, muy recomendado!"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_RESERVA_ID", errBody["code"])
}

func TestResenaCrear_InvalidCalificacion(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"reservaId":"r1","calificacion":0,"comentario":"Excelente lugar, muy recomendado!"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "INVALID_CALIFICACION", errBody["code"])
}

func TestResenaCrear_ShortComentario(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"reservaId":"r1","calificacion":5,"comentario":"Corto"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestResenaCrear_InvalidBody(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestResenaCrear_InvalidSubRatings(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"reservaId":"r1","calificacion":5,"comentario":"Excelente lugar, muy recomendado!","limpieza":0}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestResenaResponder_Unauthorized(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"respuesta":"Gracias por tu comentario!"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas/r1/responder", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Responder(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestResenaResponder_ShortRespuesta(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	body := `{"respuesta":"OK"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/resenas/r1/responder", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.Responder(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestResenaListByPropiedad_MissingID(t *testing.T) {
	svc := service.NewResenaService(nil)
	h := NewResenaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/propiedades//resenas", nil)
	w := httptest.NewRecorder()

	h.ListByPropiedad(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
