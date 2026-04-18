package handler_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/handler"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
)

type mockOfertaRepo struct {
	mock.Mock
}

func (m *mockOfertaRepo) Crear(ctx context.Context, o *repository.Oferta) (string, error) {
	args := m.Called(ctx, o)
	return args.String(0), args.Error(1)
}

func (m *mockOfertaRepo) GetByID(ctx context.Context, id string) (*repository.Oferta, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.Oferta), args.Error(1)
}

func (m *mockOfertaRepo) GetDetalleByID(ctx context.Context, id string) (*repository.OfertaDetalle, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.OfertaDetalle), args.Error(1)
}

func (m *mockOfertaRepo) ExistsActive(ctx context.Context, propiedadID, huespedID string) (bool, error) {
	args := m.Called(ctx, propiedadID, huespedID)
	return args.Bool(0), args.Error(1)
}

func (m *mockOfertaRepo) Responder(ctx context.Context, ofertaID, estado string, motivoRechazo *string) error {
	args := m.Called(ctx, ofertaID, estado, motivoRechazo)
	return args.Error(0)
}

func (m *mockOfertaRepo) GetRecibidas(ctx context.Context, propietarioID string) ([]repository.OfertaConPropiedad, error) {
	args := m.Called(ctx, propietarioID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.OfertaConPropiedad), args.Error(1)
}

func (m *mockOfertaRepo) GetEnviadas(ctx context.Context, huespedID string) ([]repository.OfertaConPropiedad, error) {
	args := m.Called(ctx, huespedID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]repository.OfertaConPropiedad), args.Error(1)
}

func (m *mockOfertaRepo) GetPropietarioID(ctx context.Context, propiedadID string) (string, error) {
	args := m.Called(ctx, propiedadID)
	return args.String(0), args.Error(1)
}

func (m *mockOfertaRepo) GetPropiedadPrecio(ctx context.Context, propiedadID string) (float64, string, int, int, *int, string, error) {
	args := m.Called(ctx, propiedadID)
	return args.Get(0).(float64), args.String(1), args.Int(2), args.Int(3), nil, args.String(4), args.Error(5)
}

func withAuth(r *http.Request, userID string) *http.Request {
	ctx := context.WithValue(r.Context(), auth.UserIDKey, userID)
	return r.WithContext(ctx)
}

func withChiParam(r *http.Request, key, val string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, val)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func TestOfertaGetByID_Unauthorized(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/o1", nil)
	req = withChiParam(req, "id", "o1")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestOfertaGetByID_MissingID(t *testing.T) {
	svc := service.NewOfertaService(nil)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/", nil)
	req = withAuth(req, "user-1")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_ID", errBody["code"])
}

func TestOfertaGetByID_NotFound(t *testing.T) {
	repo := new(mockOfertaRepo)
	repo.On("GetDetalleByID", mock.Anything, "nonexistent").Return(nil, assert.AnError)
	svc := service.NewOfertaService(repo)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/nonexistent", nil)
	req = withChiParam(req, "id", "nonexistent")
	req = withAuth(req, "user-1")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "NOT_FOUND", errBody["code"])
	repo.AssertExpectations(t)
}

func TestOfertaGetByID_Success_AsHuesped(t *testing.T) {
	now := time.Now()
	imagenURL := "https://supabase.example.com/img1.jpg"
	avatarURL := "https://supabase.example.com/avatar.jpg"
	msg := "Hola, me interesa"

	repo := new(mockOfertaRepo)
	repo.On("GetDetalleByID", mock.Anything, "oferta-1").Return(&repository.OfertaDetalle{
		Oferta: repository.Oferta{
			ID:                "oferta-1",
			Codigo:            "OF-001",
			PropiedadID:       "prop-1",
			HuespedID:         "huesped-1",
			FechaEntrada:      now,
			FechaSalida:       now.Add(24 * time.Hour),
			Noches:            1,
			CantidadHuespedes: 2,
			PrecioOriginal:    100,
			PrecioOfertado:    90,
			Moneda:            "USD",
			Estado:            "PENDIENTE",
			Mensaje:           &msg,
			FechaCreacion:     now,
		},
		PropiedadTitulo:   "Casa Bonita",
		PropiedadPrecio:   100,
		PropiedadMoneda:   "USD",
		PropietarioID:     "owner-1",
		ImagenPrincipal:   &imagenURL,
		HuespedNombre:     "Juan",
		HuespedApellido:   "Perez",
		HuespedEmail:      "juan@test.com",
		HuespedAvatar:     &avatarURL,
		HuespedVerificado: true,
	}, nil)

	svc := service.NewOfertaService(repo)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/oferta-1", nil)
	req = withChiParam(req, "id", "oferta-1")
	req = withAuth(req, "huesped-1")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "oferta-1", data["id"])
	assert.Equal(t, "PENDIENTE", data["estado"])
	assert.Equal(t, 90.0, data["precio_ofertado"])
	assert.Equal(t, "USD", data["moneda"])

	prop := data["propiedad"].(map[string]interface{})
	assert.Equal(t, "Casa Bonita", prop["titulo"])
	assert.Equal(t, "owner-1", prop["propietario_id"])
	imgs := prop["imagenes"].([]interface{})
	assert.Equal(t, 1, len(imgs))

	huesped := data["huesped"].(map[string]interface{})
	assert.Equal(t, "Juan", huesped["nombre"])
	assert.Equal(t, true, huesped["verificado"])
	repo.AssertExpectations(t)
}

func TestOfertaGetByID_Success_AsOwner(t *testing.T) {
	now := time.Now()

	repo := new(mockOfertaRepo)
	repo.On("GetDetalleByID", mock.Anything, "oferta-2").Return(&repository.OfertaDetalle{
		Oferta: repository.Oferta{
			ID:                "oferta-2",
			Codigo:            "OF-002",
			PropiedadID:       "prop-2",
			HuespedID:         "huesped-2",
			FechaEntrada:      now,
			FechaSalida:       now.Add(72 * time.Hour),
			Noches:            3,
			CantidadHuespedes: 4,
			PrecioOriginal:    300,
			PrecioOfertado:    270,
			Moneda:            "USD",
			Estado:            "PENDIENTE",
			FechaCreacion:     now,
		},
		PropiedadTitulo:   "Apto Centro",
		PropiedadPrecio:   100,
		PropiedadMoneda:   "USD",
		PropietarioID:     "owner-2",
		HuespedNombre:     "Maria",
		HuespedApellido:   "Lopez",
		HuespedEmail:      "maria@test.com",
		HuespedVerificado: false,
	}, nil)

	svc := service.NewOfertaService(repo)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/oferta-2", nil)
	req = withChiParam(req, "id", "oferta-2")
	req = withAuth(req, "owner-2")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "oferta-2", data["id"])
	assert.Equal(t, 3.0, data["noches"])
	assert.Equal(t, 4.0, data["cantidad_huespedes"])
	repo.AssertExpectations(t)
}

func TestOfertaGetByID_Forbidden(t *testing.T) {
	now := time.Now()

	repo := new(mockOfertaRepo)
	repo.On("GetDetalleByID", mock.Anything, "oferta-3").Return(&repository.OfertaDetalle{
		Oferta: repository.Oferta{
			ID:             "oferta-3",
			Codigo:         "OF-003",
			PropiedadID:    "prop-3",
			HuespedID:      "huesped-3",
			FechaEntrada:   now,
			FechaSalida:    now.Add(24 * time.Hour),
			Noches:         1,
			PrecioOriginal: 100,
			PrecioOfertado: 80,
			Moneda:         "USD",
			Estado:         "PENDIENTE",
			FechaCreacion:  now,
		},
		PropietarioID: "owner-3",
		HuespedNombre: "Carlos",
	}, nil)

	svc := service.NewOfertaService(repo)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/oferta-3", nil)
	req = withChiParam(req, "id", "oferta-3")
	req = withAuth(req, "random-user")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
	repo.AssertExpectations(t)
}

func TestOfertaGetByID_Success_NoImagen(t *testing.T) {
	now := time.Now()

	repo := new(mockOfertaRepo)
	repo.On("GetDetalleByID", mock.Anything, "oferta-4").Return(&repository.OfertaDetalle{
		Oferta: repository.Oferta{
			ID:             "oferta-4",
			Codigo:         "OF-004",
			PropiedadID:    "prop-4",
			HuespedID:      "huesped-4",
			FechaEntrada:   now,
			FechaSalida:    now.Add(48 * time.Hour),
			Noches:         2,
			PrecioOriginal: 200,
			PrecioOfertado: 180,
			Moneda:         "USD",
			Estado:         "ACEPTADA",
			FechaCreacion:  now,
		},
		PropiedadTitulo:   "Sin Imagen",
		PropiedadPrecio:   100,
		PropiedadMoneda:   "USD",
		PropietarioID:     "huesped-4",
		HuespedNombre:     "Ana",
		HuespedApellido:   "Garcia",
		HuespedEmail:      "ana@test.com",
		HuespedVerificado: true,
	}, nil)

	svc := service.NewOfertaService(repo)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/oferta-4", nil)
	req = withChiParam(req, "id", "oferta-4")
	req = withAuth(req, "huesped-4")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	prop := data["propiedad"].(map[string]interface{})
	imgs := prop["imagenes"].([]interface{})
	assert.Equal(t, 0, len(imgs))

	huesped := data["huesped"].(map[string]interface{})
	assert.Equal(t, "", huesped["avatar_url"])
	repo.AssertExpectations(t)
}

func TestOfertaGetByID_WithRechazo(t *testing.T) {
	now := time.Now()
	motivo := "Precio muy bajo"
	fechaRechazo := now.Add(-1 * time.Hour)

	repo := new(mockOfertaRepo)
	repo.On("GetDetalleByID", mock.Anything, "oferta-5").Return(&repository.OfertaDetalle{
		Oferta: repository.Oferta{
			ID:             "oferta-5",
			Codigo:         "OF-005",
			PropiedadID:    "prop-5",
			HuespedID:      "huesped-5",
			FechaEntrada:   now,
			FechaSalida:    now.Add(24 * time.Hour),
			Noches:         1,
			PrecioOriginal: 100,
			PrecioOfertado: 30,
			Moneda:         "USD",
			Estado:         "RECHAZADA",
			MotivoRechazo:  &motivo,
			FechaRechazada: &fechaRechazo,
			FechaCreacion:  now,
		},
		PropietarioID:     "huesped-5",
		PropiedadTitulo:   "Dept",
		PropiedadPrecio:   100,
		PropiedadMoneda:   "USD",
		HuespedNombre:     "Luis",
		HuespedApellido:   "Martinez",
		HuespedEmail:      "luis@test.com",
		HuespedVerificado: false,
	}, nil)

	svc := service.NewOfertaService(repo)
	h := handler.NewOfertaHandler(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/ofertas/oferta-5", nil)
	req = withChiParam(req, "id", "oferta-5")
	req = withAuth(req, "huesped-5")
	w := httptest.NewRecorder()

	h.GetByID(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "RECHAZADA", data["estado"])
	assert.Equal(t, motivo, data["motivo_rechazo"])
	repo.AssertExpectations(t)
}
