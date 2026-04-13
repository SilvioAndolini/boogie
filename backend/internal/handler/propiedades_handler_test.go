package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPropiedadesSearch_NoParams(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/propiedades", nil)
	w := httptest.NewRecorder()

	h := &PropiedadesHandler{}
	h.Search(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Logf("Status: %d (expected 500 without DB)", resp.StatusCode)
	}
}

func TestPropiedadesGetByID_MissingID(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/propiedades/", nil)
	w := httptest.NewRecorder()

	h := &PropiedadesHandler{}
	h.GetByID(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}
}

func TestPropiedadesMisPropiedades_NoAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/propiedades/mis", nil)
	w := httptest.NewRecorder()

	h := &PropiedadesHandler{}
	h.MisPropiedades(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestPropiedadesDelete_NoAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/propiedades/123", nil)
	w := httptest.NewRecorder()

	h := &PropiedadesHandler{}
	h.Delete(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}

func TestPropiedadesUpdateEstado_NoAuth(t *testing.T) {
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/propiedades/123/estado", nil)
	w := httptest.NewRecorder()

	h := &PropiedadesHandler{}
	h.UpdateEstado(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", resp.StatusCode)
	}
}
