package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type PropiedadesHandler struct {
	svc *service.PropiedadesService
}

func NewPropiedadesHandler(svc *service.PropiedadesService) *PropiedadesHandler {
	return &PropiedadesHandler{svc: svc}
}

func (h *PropiedadesHandler) Search(w http.ResponseWriter, r *http.Request) {
	if h.svc == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Servicio no disponible")
		return
	}

	q := r.URL.Query()

	filtros := &repository.PropiedadesFiltros{
		Ubicacion:  q.Get("ubicacion"),
		OrdenarPor: q.Get("ordenarPor"),
	}

	if lat, err := strconv.ParseFloat(q.Get("lat"), 64); err == nil {
		filtros.Lat = &lat
	}
	if lng, err := strconv.ParseFloat(q.Get("lng"), 64); err == nil {
		filtros.Lng = &lng
	}
	if radio, err := strconv.ParseFloat(q.Get("radio"), 64); err == nil {
		filtros.Radio = &radio
	}
	if min, err := strconv.ParseFloat(q.Get("precioMin"), 64); err == nil {
		filtros.PrecioMin = &min
	}
	if max, err := strconv.ParseFloat(q.Get("precioMax"), 64); err == nil {
		filtros.PrecioMax = &max
	}
	if h, err := strconv.Atoi(q.Get("huespedes")); err == nil {
		filtros.Huespedes = &h
	}
	if tp := q.Get("tipoPropiedad"); tp != "" {
		filtros.TipoPropiedad = &tp
	}
	if d, err := strconv.Atoi(q.Get("habitaciones")); err == nil {
		filtros.Dormitorios = &d
	}
	if b, err := strconv.Atoi(q.Get("banos")); err == nil {
		filtros.Banos = &b
	}
	if am := q.Get("amenidades"); am != "" {
		filtros.Amenidades = []string{am}
	}
	if p, err := strconv.Atoi(q.Get("pagina")); err == nil && p > 0 {
		filtros.Pagina = p
	} else {
		filtros.Pagina = 1
	}
	if pp, err := strconv.Atoi(q.Get("porPagina")); err == nil && pp > 0 {
		filtros.PorPagina = pp
	} else {
		filtros.PorPagina = 12
	}

	results, total, err := h.svc.Search(r.Context(), filtros)
	if err != nil {
		slog.Error("[propiedades/search] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "SEARCH_ERROR", "Error al buscar propiedades")
		return
	}

	if results == nil {
		results = []repository.PropiedadListado{}
	}

	w.Header().Set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
	JSONWithMeta(w, http.StatusOK, results, Meta{
		Page:    filtros.Pagina,
		PerPage: filtros.PorPagina,
		Total:   total,
	})
}

func (h *PropiedadesHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	result, err := h.svc.GetByIDOrSlug(r.Context(), id)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", "Propiedad no encontrada")
		return
	}

	w.Header().Set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600")
	JSON(w, http.StatusOK, result)
}

func (h *PropiedadesHandler) MisPropiedades(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	results, err := h.svc.ListByPropietario(r.Context(), userID)
	if err != nil {
		slog.Error("[propiedades/mis] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener propiedades")
		return
	}

	if results == nil {
		results = []repository.PropiedadListado{}
	}

	JSON(w, http.StatusOK, results)
}

func (h *PropiedadesHandler) UpdateEstado(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	var req struct {
		Estado string `json:"estado"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	validEstados := map[string]bool{
		"PUBLICADA": true, "PAUSADA": true, "DESPUBLICADA": true,
	}
	if !validEstados[req.Estado] {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_ESTADO", "Estado invalido")
		return
	}

	if err := h.svc.UpdateEstado(r.Context(), id, req.Estado, userID); err != nil {
		slog.Error("[propiedades/update-estado] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "UPDATE_ERROR", "Error al actualizar estado")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *PropiedadesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		slog.Error("[propiedades/delete] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DELETE_ERROR", "Error al eliminar propiedad")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}
