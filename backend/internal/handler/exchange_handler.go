package handler

import (
	"net/http"

	"github.com/boogie/backend/internal/service"
)

type ExchangeHandler struct {
	service *service.ExchangeService
}

func NewExchangeHandler(s *service.ExchangeService) *ExchangeHandler {
	return &ExchangeHandler{service: s}
}

func (h *ExchangeHandler) Get(w http.ResponseWriter, r *http.Request) {
	cotizacion, err := h.service.GetCotizacion()
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "EXCHANGE_RATE_ERROR", "Error al obtener cotizacion")
		return
	}

	w.Header().Set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
	JSON(w, http.StatusOK, map[string]interface{}{
		"tasa":                cotizacion.Tasa,
		"fuente":              cotizacion.Fuente,
		"ultimaActualizacion": cotizacion.UltimaActualizacion,
	})
}
