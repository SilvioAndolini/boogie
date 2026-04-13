package handler

import (
	"net/http"
	"net/url"

	"github.com/boogie/backend/internal/service"
)

type UbicacionesHandler struct {
	service *service.UbicacionesService
}

func NewUbicacionesHandler(s *service.UbicacionesService) *UbicacionesHandler {
	return &UbicacionesHandler{service: s}
}

func (h *UbicacionesHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if len(q) < 2 {
		w.Header().Set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
		JSON(w, http.StatusOK, map[string]interface{}{
			"resultados": []interface{}{},
		})
		return
	}

	decoded, err := url.QueryUnescape(q)
	if err != nil {
		decoded = q
	}

	results, err := h.service.Search(decoded)
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "UBICACIONES_ERROR", "Error al buscar ubicaciones")
		return
	}

	w.Header().Set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
	w.Header().Set("Vary", "Accept-Encoding")
	JSON(w, http.StatusOK, map[string]interface{}{
		"resultados": results,
	})
}
