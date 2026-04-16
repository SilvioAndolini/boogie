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

func newTestPagoHandler() *PagoHandler {
	return NewPagoHandler(nil, nil, "", "", nil)
}

func TestMisPagos_Unauthorized(t *testing.T) {
	svc := service.NewPagoService(nil, nil)
	h := NewPagoHandler(svc, nil, "", "", nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/pagos/mis-pagos", nil)
	w := httptest.NewRecorder()

	h.MisPagos(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRegistrarSimple_Unauthorized(t *testing.T) {
	h := newTestPagoHandler()

	body := `{"reservaId":"r1","monto":100,"moneda":"USD","metodoPago":"ZELLE","referencia":"REF123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pagos/registrar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.RegistrarSimple(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestRegistrarSimple_MissingReservaID(t *testing.T) {
	h := newTestPagoHandler()

	body := `{"monto":100,"moneda":"USD","metodoPago":"ZELLE","referencia":"REF123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pagos/registrar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.RegistrarSimple(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_RESERVA_ID", errBody["code"])
}

func TestRegistrarSimple_InvalidMonto(t *testing.T) {
	h := newTestPagoHandler()

	body := `{"reservaId":"r1","monto":0,"moneda":"USD","metodoPago":"ZELLE","referencia":"REF123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pagos/registrar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.RegistrarSimple(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegistrarSimple_InvalidMetodo(t *testing.T) {
	h := newTestPagoHandler()

	body := `{"reservaId":"r1","monto":100,"moneda":"USD","metodoPago":"INVALID","referencia":"REF123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pagos/registrar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.RegistrarSimple(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegistrarSimple_InvalidBody(t *testing.T) {
	h := newTestPagoHandler()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/pagos/registrar", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	h.RegistrarSimple(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVerificar_Unauthorized(t *testing.T) {
	h := newTestPagoHandler()

	body := `{"aprobado":true}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/pagos/p1/verificar", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Verificar(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestPaymentDataHandler(t *testing.T) {
	svc := service.NewPaymentDataService()
	h := NewPaymentDataHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/payment-data", nil)
	w := httptest.NewRecorder()

	h.Get(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]json.RawMessage
	err := json.NewDecoder(w.Body).Decode(&resp)
	assert.NoError(t, err)
	assert.Contains(t, resp, "data")
}
