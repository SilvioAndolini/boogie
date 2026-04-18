package handler

import (
	"net/http"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type WalletHandler struct {
	svc *service.WalletService
}

func NewWalletHandler(svc *service.WalletService) *WalletHandler {
	return &WalletHandler{svc: svc}
}

func (h *WalletHandler) GetWallet(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	wallet, err := h.svc.GetWallet(r.Context(), userID)
	if err != nil {
		JSON(w, http.StatusOK, nil)
		return
	}

	JSON(w, http.StatusOK, wallet)
}

func (h *WalletHandler) Activar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	if err := h.svc.Activar(r.Context(), userID); err != nil {
		mapError(w, err, "[wallet/activar] error")
		return
	}

	wallet, _ := h.svc.GetWallet(r.Context(), userID)

	JSON(w, http.StatusCreated, wallet)
}

type recargaRequest struct {
	MontoUSD float64           `json:"montoUsd"`
	Metodo   string            `json:"metodo"`
	DatosPago map[string]string `json:"datosPago"`
}

func (h *WalletHandler) Recarga(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req recargaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.MontoUSD <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_MONTO", "montoUsd debe ser mayor a 0")
		return
	}
	if req.Metodo == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_METODO", "metodo es requerido")
		return
	}
	if req.DatosPago == nil {
		req.DatosPago = map[string]string{}
	}

	txID, err := h.svc.CrearRecarga(r.Context(), userID, req.MontoUSD, req.Metodo, req.DatosPago)
	if err != nil {
		mapError(w, err, "[wallet/recarga] error")
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{
		"id":      txID,
		"mensaje": "Recarga registrada exitosamente",
	})
}

func (h *WalletHandler) Transacciones(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	walletID := chi.URLParam(r, "walletId")
	if walletID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_WALLET_ID", "walletId es requerido")
		return
	}

	txs, err := h.svc.GetTransacciones(r.Context(), walletID, userID)
	if err != nil {
		mapError(w, err, "[wallet/transacciones] error")
		return
	}

	JSON(w, http.StatusOK, txs)
}
