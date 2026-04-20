package handler

import (
	"net/http"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ResenaHandler struct {
	svc *service.ResenaService
}

func NewResenaHandler(svc *service.ResenaService) *ResenaHandler {
	return &ResenaHandler{svc: svc}
}

type crearResenaRequest struct {
	ReservaID    string `json:"reservaId"`
	Calificacion int    `json:"calificacion"`
	Limpieza     *int   `json:"limpieza"`
	Comunicacion *int   `json:"comunicacion"`
	Ubicacion    *int   `json:"ubicacion"`
	Valor        *int   `json:"valor"`
	Comentario   string `json:"comentario"`
}

func (h *ResenaHandler) Crear(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearResenaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_RESERVA_ID", "reservaId es requerido")
		return
	}
	if req.Calificacion < 1 || req.Calificacion > 5 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_CALIFICACION", "calificacion debe ser entre 1 y 5")
		return
	}
	if len(req.Comentario) < 10 {
		ErrorJSON(w, http.StatusBadRequest, "SHORT_COMENTARIO", "El comentario debe tener al menos 10 caracteres")
		return
	}
	if len(req.Comentario) > 1000 {
		ErrorJSON(w, http.StatusBadRequest, "LONG_COMENTARIO", "El comentario no puede exceder 1000 caracteres")
		return
	}

	if req.Limpieza != nil && (*req.Limpieza < 1 || *req.Limpieza > 5) {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_LIMPIEZA", "limpieza debe ser entre 1 y 5")
		return
	}
	if req.Comunicacion != nil && (*req.Comunicacion < 1 || *req.Comunicacion > 5) {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_COMUNICACION", "comunicacion debe ser entre 1 y 5")
		return
	}
	if req.Ubicacion != nil && (*req.Ubicacion < 1 || *req.Ubicacion > 5) {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_UBICACION", "ubicacion debe ser entre 1 y 5")
		return
	}
	if req.Valor != nil && (*req.Valor < 1 || *req.Valor > 5) {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_VALOR", "valor debe ser entre 1 y 5")
		return
	}

	resenaID, propiedadID, err := h.svc.Crear(r.Context(), userID, &service.CrearResenaInput{
		ReservaID:    req.ReservaID,
		Calificacion: req.Calificacion,
		Limpieza:     req.Limpieza,
		Comunicacion: req.Comunicacion,
		Ubicacion:    req.Ubicacion,
		Valor:        req.Valor,
		Comentario:   req.Comentario,
	})
	if err != nil {
		mapError(w, r, err, "[resenas/crear] error", "userId", userID)
		return
	}

	JSON(w, http.StatusCreated, struct {
		ID          string `json:"id"`
		PropiedadID string `json:"propiedad_id"`
		Mensaje     string `json:"mensaje"`
	}{
		ID:          resenaID,
		PropiedadID: propiedadID,
		Mensaje:     "Reseña creada exitosamente",
	})
}

type responderResenaRequest struct {
	Respuesta string `json:"respuesta"`
}

func (h *ResenaHandler) Responder(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	resenaID := chi.URLParam(r, "id")
	if resenaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reseña requerido")
		return
	}

	var req responderResenaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Respuesta == "" || len(req.Respuesta) < 3 {
		ErrorJSON(w, http.StatusBadRequest, "SHORT_RESPUESTA", "La respuesta debe tener al menos 3 caracteres")
		return
	}

	propiedadID, err := h.svc.Responder(r.Context(), &service.ResponderInput{
		ResenaID:  resenaID,
		UserID:    userID,
		Respuesta: req.Respuesta,
	})
	if err != nil {
		mapError(w, r, err, "[resenas/responder] error", "resenaId", resenaID)
		return
	}

	JSON(w, http.StatusOK, struct {
		Ok          bool   `json:"ok"`
		PropiedadID string `json:"propiedad_id"`
		Mensaje     string `json:"mensaje"`
	}{
		Ok:          true,
		PropiedadID: propiedadID,
		Mensaje:     "Respuesta publicada exitosamente",
	})
}

func (h *ResenaHandler) ListByPropiedad(w http.ResponseWriter, r *http.Request) {
	propiedadID := chi.URLParam(r, "propiedadId")
	if propiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PROP_ID", "propiedadId es requerido")
		return
	}

	page, perPage := getPagination(r)

	resenas, total, err := h.svc.ListByPropiedad(r.Context(), propiedadID, page, perPage)
	if err != nil {
		mapError(w, r, err, "[resenas/list]", "propiedadId", propiedadID)
		return
	}

	JSONWithMeta(w, http.StatusOK, resenas, Meta{
		Page:    page,
		PerPage: perPage,
		Total:   total,
	})
}
