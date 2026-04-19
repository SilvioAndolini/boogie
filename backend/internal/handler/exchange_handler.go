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
		mapError(w, err, "[exchange]")
		return
	}

	w.Header().Set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
	JSON(w, http.StatusOK, ExchangeRateResponse{
		Tasa:                cotizacion.Tasa,
		Fuente:              cotizacion.Fuente,
		UltimaActualizacion: cotizacion.UltimaActualizacion,
	})
}
