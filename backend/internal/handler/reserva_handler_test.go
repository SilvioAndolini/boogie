package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCrearReserva_MissingAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/reservas", nil)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.Crear(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestCrearReserva_InvalidBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/reservas", bytes.NewReader([]byte("invalid")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.Crear(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 for no auth, got %d", resp.StatusCode)
	}
}

func TestCancelar_MissingAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/reservas/123/cancelar", nil)
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.Cancelar(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestConfirmarRechazar_MissingAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/reservas/123/confirmar", nil)
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.ConfirmarORechazar(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestMisReservas_MissingAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/reservas/mis", nil)
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.MisReservas(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestReservasRecibidas_MissingAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/reservas/recibidas", nil)
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.ReservasRecibidas(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestRegistrarPago_MissingAuth(t *testing.T) {
	body, _ := json.Marshal(map[string]interface{}{
		"reservaId": "test",
		"monto":     100,
		"metodoPago": "ZELLE",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/reservas/pagos", bytes.NewReader(body))
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.RegistrarPago(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestRegistrarPago_InvalidBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/reservas/pagos", bytes.NewReader([]byte("bad")))
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.RegistrarPago(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestStats_MissingAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/reservas/stats?rol=anfitrion", nil)
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.Stats(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestDisponibilidad_MissingParams(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/reservas/disponibilidad", nil)
	w := httptest.NewRecorder()

	h := &ReservaHandler{}
	h.Disponibilidad(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
}

func TestIsBusinessError(t *testing.T) {
	tests := []struct {
		input string
		want  bool
	}{
		{"la propiedad no encontrada", true},
		{"no puedes reservar tu propia propiedad", true},
		{"las fechas seleccionadas ya no estan disponibles", true},
		{"database connection error", false},
		{"no tienes permisos", true},
		{"internal server error", false},
	}

	for _, tt := range tests {
		got := isBusinessError(&testError{msg: tt.input})
		if got != tt.want {
			t.Errorf("isBusinessError(%q) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

type testError struct {
	msg string
}

func (e *testError) Error() string {
	return e.msg
}
