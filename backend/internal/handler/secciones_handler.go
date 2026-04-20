package handler

import (
	"net/http"
	"strings"

	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
)

type SeccionesHandler struct {
	svc *service.SeccionesService
}

func NewSeccionesHandler(svc *service.SeccionesService) *SeccionesHandler {
	return &SeccionesHandler{svc: svc}
}

func (h *SeccionesHandler) GetPublicas(w http.ResponseWriter, r *http.Request) {
	secciones, err := h.svc.GetPublicas(r.Context())
	if err != nil {
		mapError(w, r, err, "[secciones/publicas]")
		return
	}
	JSON(w, http.StatusOK, secciones)
}

func (h *SeccionesHandler) GetAdmin(w http.ResponseWriter, r *http.Request) {
	secciones, err := h.svc.GetAdmin(r.Context())
	if err != nil {
		mapError(w, r, err, "[secciones/admin]")
		return
	}
	JSON(w, http.StatusOK, secciones)
}

type upsertSeccionRequest struct {
	ID           string   `json:"id"`
	Titulo       string   `json:"titulo"`
	Subtitulo    *string  `json:"subtitulo"`
	TipoFiltro   string   `json:"tipo_filtro"`
	FiltroEstado *string  `json:"filtro_estado"`
	FiltroCiudad *string  `json:"filtro_ciudad"`
	PropiedadIDs []string `json:"propiedad_ids"`
	Orden        int      `json:"orden"`
	Activa       bool     `json:"activa"`
}

func (h *SeccionesHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	var req upsertSeccionRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.Upsert(r.Context(), &repository.SeccionDestacada{
		ID:           req.ID,
		Titulo:       req.Titulo,
		Subtitulo:    req.Subtitulo,
		TipoFiltro:   req.TipoFiltro,
		FiltroEstado: req.FiltroEstado,
		FiltroCiudad: req.FiltroCiudad,
		PropiedadIDs: req.PropiedadIDs,
		Orden:        req.Orden,
		Activa:       req.Activa,
	}); err != nil {
		mapError(w, r, err, "[secciones/upsert] error")
		return
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *SeccionesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		mapError(w, r, err, "[secciones/delete] error")
		return
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *SeccionesHandler) SearchPropiedades(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	results, err := h.svc.SearchPropiedades(r.Context(), query)
	if err != nil {
		mapError(w, r, err, "[secciones/search]")
		return
	}
	JSON(w, http.StatusOK, results)
}

func (h *SeccionesHandler) GetPropiedadesByIDs(w http.ResponseWriter, r *http.Request) {
	idsStr := r.URL.Query().Get("ids")
	var ids []string
	if idsStr != "" {
		ids = strings.Split(idsStr, ",")
	}

	results, err := h.svc.GetPropiedadesByIDs(r.Context(), ids)
	if err != nil {
		mapError(w, r, err, "[secciones/propiedades-by-ids]")
		return
	}
	JSON(w, http.StatusOK, results)
}

func (h *SeccionesHandler) PreviewPropiedades(w http.ResponseWriter, r *http.Request) {
	tipoFiltro := r.URL.Query().Get("tipoFiltro")
	if tipoFiltro == "" {
		tipoFiltro = "POPULAR"
	}

	var filtroEstado, filtroCiudad *string
	if v := r.URL.Query().Get("filtroEstado"); v != "" {
		filtroEstado = &v
	}
	if v := r.URL.Query().Get("filtroCiudad"); v != "" {
		filtroCiudad = &v
	}

	results, err := h.svc.PreviewPropiedades(r.Context(), tipoFiltro, filtroEstado, filtroCiudad)
	if err != nil {
		mapError(w, r, err, "[secciones/preview]")
		return
	}
	JSON(w, http.StatusOK, results)
}
