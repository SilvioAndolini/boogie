package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/stretchr/testify/assert"
)

func authCtx(r *http.Request, userID string) *http.Request {
	ctx := context.WithValue(r.Context(), auth.UserIDKey, userID)
	return r.WithContext(ctx)
}

func authCtxWithRole(r *http.Request, userID, role string) *http.Request {
	ctx := context.WithValue(r.Context(), auth.UserIDKey, userID)
	ctx = context.WithValue(ctx, auth.UserRoleKey, role)
	return r.WithContext(ctx)
}

func TestChatGetConversaciones_Unauthorized(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/chat/conversaciones", nil)
	w := httptest.NewRecorder()

	h.GetConversaciones(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestChatGetOrCreateConversacion_MissingOtroID(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	body := `{"propiedadId":"p1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat/conversaciones", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.GetOrCreateConversacion(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_OTRO_ID", errBody["code"])
}

func TestChatGetOrCreateConversacion_InvalidBody(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat/conversaciones", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.GetOrCreateConversacion(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestChatGetMensajes_MissingConvID(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/chat/mensajes", nil)
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.GetMensajes(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_CONV_ID", errBody["code"])
}

func TestChatEnviarMensaje_MissingConvID(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	body := `{"contenido":"Hola"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat/mensajes", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.EnviarMensaje(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_CONV_ID", errBody["code"])
}

func TestChatEnviarMensaje_InvalidBody(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/chat/mensajes", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.EnviarMensaje(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestChatCountNoLeidos_Unauthorized(t *testing.T) {
	svc := service.NewChatService(nil)
	h := NewChatHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/chat/no-leidos", nil)
	w := httptest.NewRecorder()

	h.CountNoLeidos(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestOfertaCrear_Unauthorized(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	body := `{"propiedadId":"p1","precioOfertado":100}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ofertas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestOfertaCrear_MissingPropiedadID(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	body := `{"precioOfertado":100}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ofertas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_PARAMS", errBody["code"])
}

func TestOfertaCrear_InvalidFecha(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	body := `{"propiedadId":"p1","fechaEntrada":"invalid","fechaSalida":"2025-05-10","precioOfertado":100}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ofertas", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "INVALID_FECHA", errBody["code"])
}

func TestOfertaCrear_InvalidBody(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/ofertas", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")
	w := httptest.NewRecorder()

	h.Crear(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestOfertaResponder_Unauthorized(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	body := `{"accion":"ACEPTADA"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ofertas/o1/responder", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Responder(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestOfertaResponder_InvalidBody(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/ofertas/o1/responder", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = authCtx(req, "user-1")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "o1")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	w := httptest.NewRecorder()

	h.Responder(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestOfertaGetRecibidas_Unauthorized(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/recibidas", nil)
	w := httptest.NewRecorder()

	h.GetRecibidas(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestOfertaGetEnviadas_Unauthorized(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/enviadas", nil)
	w := httptest.NewRecorder()

	h.GetEnviadas(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestTiendaGetAllProductos_NotAdmin(t *testing.T) {
	svc := service.NewTiendaService(nil)
	h := NewTiendaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/tienda/productos", nil)
	req = authCtxWithRole(req, "user-1", "HUESPED")
	w := httptest.NewRecorder()

	h.GetAllProductos(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestTiendaGetAllServicios_NotAdmin(t *testing.T) {
	svc := service.NewTiendaService(nil)
	h := NewTiendaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/tienda/servicios", nil)
	req = authCtxWithRole(req, "user-1", "ANFITRION")
	w := httptest.NewRecorder()

	h.GetAllServicios(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}
