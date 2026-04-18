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
	svc        *service.PropiedadesService
	reservaSvc *service.ReservaService
}

func NewPropiedadesHandler(svc *service.PropiedadesService, reservaSvc *service.ReservaService) *PropiedadesHandler {
	return &PropiedadesHandler{svc: svc, reservaSvc: reservaSvc}
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
	if hu, err := strconv.Atoi(q.Get("huespedes")); err == nil {
		filtros.Huespedes = &hu
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
	if cat := q.Get("categoria"); cat != "" {
		filtros.Categoria = &cat
	}
	if tc := q.Get("tipoCancha"); tc != "" {
		filtros.TipoCancha = &tc
	}
	if exp := q.Get("esExpress"); exp == "true" {
		v := true
		filtros.EsExpress = &v
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
		slog.Error("[propiedades/get-by-id] error", "error", err, "id", id)
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

func (h *PropiedadesHandler) Crear(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req struct {
		Titulo              string   `json:"titulo"`
		Descripcion         string   `json:"descripcion"`
		TipoPropiedad       string   `json:"tipoPropiedad"`
		PrecioPorNoche      float64  `json:"precioPorNoche"`
		Moneda              string   `json:"moneda"`
		CapacidadMaxima     int      `json:"capacidadMaxima"`
		Habitaciones        int      `json:"habitaciones"`
		Banos               int      `json:"banos"`
		Camas               int      `json:"camas"`
		Direccion           string   `json:"direccion"`
		Ciudad              string   `json:"ciudad"`
		Estado              string   `json:"estado"`
		Zona                *string  `json:"zona"`
		Latitud             *float64 `json:"latitud"`
		Longitud            *float64 `json:"longitud"`
		Reglas              *string  `json:"reglas"`
		PoliticaCancelacion string   `json:"politicaCancelacion"`
		HorarioCheckIn      string   `json:"horarioCheckIn"`
		HorarioCheckOut     string   `json:"horarioCheckOut"`
		EstanciaMinima      int      `json:"estanciaMinima"`
		EstanciaMaxima      *int     `json:"estanciaMaxima"`
		Categoria           string   `json:"categoria"`
		TipoCancha          *string  `json:"tipoCancha"`
		PrecioPorHora       *float64 `json:"precioPorHora"`
		HoraApertura        *string  `json:"horaApertura"`
		HoraCierre          *string  `json:"horaCierre"`
		DuracionMinimaMin   *int     `json:"duracionMinimaMin"`
		EsExpress           bool     `json:"esExpress"`
		PrecioExpress       *float64 `json:"precioExpress"`
		Amenidades          []string `json:"amenidades"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	input := &repository.CrearPropiedadInput{
		Titulo:              req.Titulo,
		Descripcion:         req.Descripcion,
		TipoPropiedad:       req.TipoPropiedad,
		PrecioPorNoche:      req.PrecioPorNoche,
		Moneda:              req.Moneda,
		CapacidadMaxima:     req.CapacidadMaxima,
		Habitaciones:        req.Habitaciones,
		Banos:               req.Banos,
		Camas:               req.Camas,
		Direccion:           req.Direccion,
		Ciudad:              req.Ciudad,
		Estado:              req.Estado,
		Zona:                req.Zona,
		Latitud:             req.Latitud,
		Longitud:            req.Longitud,
		Reglas:              req.Reglas,
		PoliticaCancelacion: req.PoliticaCancelacion,
		HorarioCheckIn:      req.HorarioCheckIn,
		HorarioCheckOut:     req.HorarioCheckOut,
		EstanciaMinima:      req.EstanciaMinima,
		EstanciaMaxima:      req.EstanciaMaxima,
		Categoria:           req.Categoria,
		TipoCancha:          req.TipoCancha,
		PrecioPorHora:       req.PrecioPorHora,
		HoraApertura:        req.HoraApertura,
		HoraCierre:          req.HoraCierre,
		DuracionMinimaMin:   req.DuracionMinimaMin,
		EsExpress:           req.EsExpress,
		PrecioExpress:       req.PrecioExpress,
	}

	result, err := h.svc.Crear(r.Context(), userID, input, req.Amenidades)
	if err != nil {
		mapError(w, err, "[propiedades/crear]", "userID", userID)
		return
	}

	JSON(w, http.StatusCreated, result)
}

func (h *PropiedadesHandler) Actualizar(w http.ResponseWriter, r *http.Request) {
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
		Titulo              string   `json:"titulo"`
		Descripcion         string   `json:"descripcion"`
		TipoPropiedad       string   `json:"tipoPropiedad"`
		PrecioPorNoche      float64  `json:"precioPorNoche"`
		Moneda              string   `json:"moneda"`
		CapacidadMaxima     int      `json:"capacidadMaxima"`
		Habitaciones        int      `json:"habitaciones"`
		Banos               int      `json:"banos"`
		Camas               int      `json:"camas"`
		Direccion           string   `json:"direccion"`
		Ciudad              string   `json:"ciudad"`
		Estado              string   `json:"estado"`
		Zona                *string  `json:"zona"`
		Latitud             *float64 `json:"latitud"`
		Longitud            *float64 `json:"longitud"`
		Reglas              *string  `json:"reglas"`
		PoliticaCancelacion string   `json:"politicaCancelacion"`
		HorarioCheckIn      string   `json:"horarioCheckIn"`
		HorarioCheckOut     string   `json:"horarioCheckOut"`
		EstanciaMinima      int      `json:"estanciaMinima"`
		EstanciaMaxima      *int     `json:"estanciaMaxima"`
		Categoria           string   `json:"categoria"`
		TipoCancha          *string  `json:"tipoCancha"`
		PrecioPorHora       *float64 `json:"precioPorHora"`
		HoraApertura        *string  `json:"horaApertura"`
		HoraCierre          *string  `json:"horaCierre"`
		DuracionMinimaMin   *int     `json:"duracionMinimaMin"`
		EsExpress           bool     `json:"esExpress"`
		PrecioExpress       *float64 `json:"precioExpress"`
		Amenidades          []string `json:"amenidades"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	input := &repository.CrearPropiedadInput{
		Titulo:              req.Titulo,
		Descripcion:         req.Descripcion,
		TipoPropiedad:       req.TipoPropiedad,
		PrecioPorNoche:      req.PrecioPorNoche,
		Moneda:              req.Moneda,
		CapacidadMaxima:     req.CapacidadMaxima,
		Habitaciones:        req.Habitaciones,
		Banos:               req.Banos,
		Camas:               req.Camas,
		Direccion:           req.Direccion,
		Ciudad:              req.Ciudad,
		Estado:              req.Estado,
		Zona:                req.Zona,
		Latitud:             req.Latitud,
		Longitud:            req.Longitud,
		Reglas:              req.Reglas,
		PoliticaCancelacion: req.PoliticaCancelacion,
		HorarioCheckIn:      req.HorarioCheckIn,
		HorarioCheckOut:     req.HorarioCheckOut,
		EstanciaMinima:      req.EstanciaMinima,
		EstanciaMaxima:      req.EstanciaMaxima,
		Categoria:           req.Categoria,
		TipoCancha:          req.TipoCancha,
		PrecioPorHora:       req.PrecioPorHora,
		HoraApertura:        req.HoraApertura,
		HoraCierre:          req.HoraCierre,
		DuracionMinimaMin:   req.DuracionMinimaMin,
		EsExpress:           req.EsExpress,
		PrecioExpress:       req.PrecioExpress,
	}

	result, err := h.svc.Actualizar(r.Context(), userID, id, input, req.Amenidades)
	if err != nil {
		mapError(w, err, "[propiedades/actualizar]", "id", id, "userID", userID)
		return
	}

	JSON(w, http.StatusOK, result)
}

func (h *PropiedadesHandler) AgregarImagenes(w http.ResponseWriter, r *http.Request) {
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
		Imagenes []repository.ImagenInput `json:"imagenes"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if len(req.Imagenes) == 0 {
		ErrorJSON(w, http.StatusBadRequest, "EMPTY_IMAGES", "No se enviaron imagenes")
		return
	}
	if len(req.Imagenes) > 20 {
		ErrorJSON(w, http.StatusBadRequest, "TOO_MANY_IMAGES", "Maximo 20 imagenes por request")
		return
	}

	if err := h.svc.AgregarImagenes(r.Context(), userID, id, req.Imagenes); err != nil {
		mapError(w, err, "[propiedades/agregar-imagenes]", "id", id)
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *PropiedadesHandler) ActualizarImagenes(w http.ResponseWriter, r *http.Request) {
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
		Updates []repository.ImagenUpdate `json:"updates"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.ActualizarImagenes(r.Context(), userID, id, req.Updates); err != nil {
		mapError(w, err, "[propiedades/actualizar-imagenes]", "id", id)
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
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

func (h *PropiedadesHandler) GetAmenidades(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	amenidades, err := h.svc.GetAmenidades(r.Context(), id)
	if err != nil {
		slog.Error("[propiedades/amenidades] error", "error", err, "id", id)
		ErrorJSON(w, http.StatusInternalServerError, "FETCH_ERROR", "Error al obtener amenidades")
		return
	}

	if amenidades == nil {
		amenidades = []repository.AmenidadInfo{}
	}

	JSON(w, http.StatusOK, amenidades)
}

func (h *PropiedadesHandler) GetReservas(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}

	if h.reservaSvc == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Servicio no disponible")
		return
	}

	page, perPage := getPagination(r)

	reservas, total, err := h.reservaSvc.ListByPropiedad(r.Context(), id, page, perPage)
	if err != nil {
		slog.Error("[propiedades/reservas] error", "error", err, "id", id)
		ErrorJSON(w, http.StatusInternalServerError, "FETCH_ERROR", "Error al obtener reservas")
		return
	}

	if reservas == nil {
		reservas = []repository.ReservaConHuesped{}
	}

	JSONWithMeta(w, http.StatusOK, reservas, Meta{
		Page:    page,
		PerPage: perPage,
		Total:   total,
	})
}
