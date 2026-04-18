package handler

import (
	"log/slog"
	"net/http"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type MetodoPagoHandler struct {
	svc *service.MetodoPagoService
}

func NewMetodoPagoHandler(svc *service.MetodoPagoService) *MetodoPagoHandler {
	return &MetodoPagoHandler{svc: svc}
}

func (h *MetodoPagoHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	metodos, err := h.svc.List(r.Context(), userID)
	if err != nil {
		slog.Error("[metodos-pago/list] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener metodos de pago")
		return
	}

	JSON(w, http.StatusOK, metodos)
}

type crearMetodoPagoRequest struct {
	Tipo          string  `json:"tipo"`
	Banco         *string `json:"banco"`
	Telefono      *string `json:"telefono"`
	Cedula        *string `json:"cedula"`
	NumeroCuenta  *string `json:"numero_cuenta"`
	Titular       *string `json:"titular"`
	EmailZelle    *string `json:"email_zelle"`
	DireccionUSDT *string `json:"direccion_usdt"`
}

func (h *MetodoPagoHandler) Crear(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearMetodoPagoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Tipo == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_TIPO", "tipo es requerido")
		return
	}

	metodo, err := h.svc.Crear(r.Context(), userID, &service.CrearMetodoPagoInput{
		Tipo:          req.Tipo,
		Banco:         req.Banco,
		Telefono:      req.Telefono,
		Cedula:        req.Cedula,
		NumeroCuenta:  req.NumeroCuenta,
		Titular:       req.Titular,
		EmailZelle:    req.EmailZelle,
		DireccionUSDT: req.DireccionUSDT,
	})
	if err != nil {
		mapError(w, err, "[metodos-pago/crear] error", "userId", userID)
		return
	}

	JSON(w, http.StatusCreated, metodo)
}

func (h *MetodoPagoHandler) Eliminar(w http.ResponseWriter, r *http.Request) {
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

	if err := h.svc.Eliminar(r.Context(), id, userID); err != nil {
		mapError(w, err, "[metodos-pago/eliminar] error", "id", id, "userId", userID)
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"mensaje": "Metodo de pago eliminado",
	})
}
