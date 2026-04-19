package handler

import (
	"net/http"

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
		JSON(w, http.StatusOK, ResultadosResponse{Resultados: []interface{}{}})
		return
	}

	results, err := h.service.Search(q)
	if err != nil {
		mapError(w, err, "[ubicaciones/search]")
		return
	}

	w.Header().Set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
	w.Header().Set("Vary", "Accept-Encoding")
	JSON(w, http.StatusOK, ResultadosResponse{Resultados: results})
}
