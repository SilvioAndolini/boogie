package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
)

func newAdminHandler() *AdminHandler {
	svc := service.NewAdminService(nil)
	return NewAdminHandler(svc, nil)
}

func adminCtx(r *http.Request) *http.Request {
	ctx := context.WithValue(r.Context(), auth.UserIDKey, "admin-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "ADMIN")
	return r.WithContext(ctx)
}

func ceoCtx(r *http.Request) *http.Request {
	ctx := context.WithValue(r.Context(), auth.UserIDKey, "ceo-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "CEO")
	return r.WithContext(ctx)
}

func TestAdminDashboard_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/dashboard", nil)
	w := httptest.NewRecorder()
	h.GetDashboard(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminDashboard_NotAdmin(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/dashboard", nil)
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	ctx = context.WithValue(ctx, auth.UserRoleKey, "HUESPED")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	h.GetDashboard(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestAdminReservas_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/reservas", nil)
	w := httptest.NewRecorder()
	h.GetReservas(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminAccionReserva_InvalidBody(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/reservas/accion", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.AccionReserva(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminAccionReserva_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"reservaId":"r1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/reservas/accion", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.AccionReserva(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminPagos_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/pagos", nil)
	w := httptest.NewRecorder()
	h.GetPagos(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminVerificarPago_InvalidBody(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/pagos/verificar", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.VerificarPago(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminVerificarPago_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"pagoId":"p1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/pagos/verificar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.VerificarPago(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	_ = json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_PARAMS", errBody["code"])
}

func TestAdminPropiedades_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/propiedades", nil)
	w := httptest.NewRecorder()
	h.GetPropiedades(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminUpdatePropiedad_MissingID(t *testing.T) {
	h := newAdminHandler()
	body := `{"estadoPublicacion":"PUBLICADA"}`
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/admin/propiedades", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.UpdatePropiedad(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminResenas_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/resenas", nil)
	w := httptest.NewRecorder()
	h.GetResenas(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminModerarResena_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"resenaId":"r1"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/resenas/moderar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.ModerarResena(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminCrearCupon_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"codigo":"TEST"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cupones", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = ceoCtx(req)
	w := httptest.NewRecorder()
	h.CrearCupon(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminCrearCupon_InvalidFecha(t *testing.T) {
	h := newAdminHandler()
	body := `{"codigo":"TEST","nombre":"Test","tipoDescuento":"PORCENTAJE","valorDescuento":10,"fechaInicio":"invalid","fechaFin":"2026-12-31"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cupones", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = ceoCtx(req)
	w := httptest.NewRecorder()
	h.CrearCupon(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminCrearCupon_PorcentajeOver100(t *testing.T) {
	h := newAdminHandler()
	body := `{"codigo":"TEST","nombre":"Test","tipoDescuento":"PORCENTAJE","valorDescuento":150,"fechaInicio":"2026-01-01","fechaFin":"2026-12-31"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cupones", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = ceoCtx(req)
	w := httptest.NewRecorder()
	h.CrearCupon(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminEditarCupon_MissingID(t *testing.T) {
	h := newAdminHandler()
	body := `{"nombre":"Updated"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/cupones", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.EditarCupon(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminComisiones_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/comisiones", nil)
	w := httptest.NewRecorder()
	h.GetComisiones(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminComisiones_InvalidBody(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/comisiones", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = ceoCtx(req)
	w := httptest.NewRecorder()
	h.UpdateComisiones(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminAuditLog_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/auditoria", nil)
	w := httptest.NewRecorder()
	h.GetAuditLog(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminNotificaciones_Unauthorized(t *testing.T) {
	h := newAdminHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/notificaciones", nil)
	w := httptest.NewRecorder()
	h.GetNotificaciones(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAdminEnviarNotificacion_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"titulo":"Test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/notificaciones", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.EnviarNotificacion(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminCrearProductoStore_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"nombre":"Test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/store/productos", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.CrearProductoStore(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdminCrearServicioStore_MissingParams(t *testing.T) {
	h := newAdminHandler()
	body := `{"nombre":"Test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/store/servicios", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = adminCtx(req)
	w := httptest.NewRecorder()
	h.CrearServicioStore(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
