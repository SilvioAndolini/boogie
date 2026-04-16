package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
)

type CuponHandler struct {
	svc *service.CuponService
}

func NewCuponHandler(svc *service.CuponService) *CuponHandler {
	return &CuponHandler{svc: svc}
}

type validarCuponRequest struct {
	Codigo      string  `json:"codigo"`
	PropiedadID string  `json:"propiedadId"`
	MontoTotal  float64 `json:"montoTotal"`
	Noches      int     `json:"noches"`
}

func (h *CuponHandler) Validar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req validarCuponRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Codigo == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_CODE", "codigo es requerido")
		return
	}
	if req.PropiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PROP", "propiedadId es requerido")
		return
	}
	if req.MontoTotal <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_MONTO", "montoTotal debe ser mayor a 0")
		return
	}
	if req.Noches < 1 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_NOCHES", "noches debe ser mayor a 0")
		return
	}

	result, err := h.svc.ValidarCupon(r.Context(), req.Codigo, userID, req.PropiedadID, req.MontoTotal, req.Noches)
	if err != nil {
		slog.Error("[cupones/validar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "INVALID_CUPON", err.Error())
		return
	}

	JSON(w, http.StatusOK, result)
}
