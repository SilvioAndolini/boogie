package handler

import (
	"net/http"

	"github.com/boogie/backend/internal/service"
)

type PaymentDataHandler struct {
	svc *service.PaymentDataService
}

func NewPaymentDataHandler(svc *service.PaymentDataService) *PaymentDataHandler {
	return &PaymentDataHandler{svc: svc}
}

func (h *PaymentDataHandler) Get(w http.ResponseWriter, r *http.Request) {
	data := h.svc.GetPaymentData()
	JSON(w, http.StatusOK, data)
}
