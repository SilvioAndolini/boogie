package handler

import (
	"net/http"
)

func (h *AdminHandler) GetPagos(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	estado := r.URL.Query().Get("estado")
	metodoPago := r.URL.Query().Get("metodoPago")
	busqueda := r.URL.Query().Get("busqueda")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetPagos(r.Context(), estado, metodoPago, busqueda, pagina)
	if err != nil {
		mapError(w, err, "[admin/pagos]")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetPagosStats(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	stats, err := h.svc.GetPagosStats(r.Context())
	if err != nil {
		mapError(w, err, "[admin/pagos/stats]")
		return
	}
	JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) VerificarPago(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req adminVerificarPagoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.PagoID == "" || req.Accion == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "pagoId y accion son requeridos")
		return
	}
	if err := h.svc.VerificarPago(r.Context(), req.PagoID, req.Accion, req.Notas); err != nil {
		mapError(w, err, "[admin/pagos/verificar]")
		return
	}
	h.auditLog(r, auditID(r), "verificar_pago", "pago", &req.PagoID, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}
