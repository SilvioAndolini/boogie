package handler

import (
	"log/slog"
	"net/http"

	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type CanchasHandler struct {
	repo *repository.PropiedadesRepo
	svc  *service.PropiedadesService
}

func NewCanchasHandler(repo *repository.PropiedadesRepo, svc *service.PropiedadesService) *CanchasHandler {
	return &CanchasHandler{repo: repo, svc: svc}
}

func (h *CanchasHandler) GetDisponibilidad(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	fecha := r.URL.Query().Get("fecha")
	if fecha == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_FECHA", "Parametro fecha requerido (YYYY-MM-DD)")
		return
	}

	bloques, err := h.repo.GetDisponibilidadHoraria(r.Context(), id, fecha)
	if err != nil {
		slog.Error("[canchas/disponibilidad] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "AVAILABILITY_ERROR", "Error al obtener disponibilidad")
		return
	}

	if bloques == nil {
		bloques = []repository.BloqueHorario{}
	}

	JSON(w, http.StatusOK, bloques)
}
