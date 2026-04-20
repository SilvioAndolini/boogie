package handler

import (
	"net/http"
	"strconv"
)

func (h *AdminHandler) GetResenas(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	calificacionMin, _ := strconv.Atoi(r.URL.Query().Get("calificacionMin"))
	busqueda := r.URL.Query().Get("busqueda")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetResenas(r.Context(), calificacionMin, busqueda, pagina)
	if err != nil {
		mapError(w, r, err, "[admin/resenas]")
		return
	}

	total, promedio, dist, _ := h.svc.GetResenaStats(r.Context())
	JSON(w, http.StatusOK, AdminResenasResponse{
		Data:         result.Data,
		Total:        result.Total,
		Pagina:       result.Pagina,
		TotalPaginas: result.TotalPaginas,
		Stats: ResenaStatsResponse{
			Total:        total,
			Promedio:     promedio,
			Distribucion: dist,
		},
	})
}

func (h *AdminHandler) ModerarResena(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req moderarResenaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.ResenaID == "" || req.Accion == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "resenaId y accion son requeridos")
		return
	}
	if err := h.svc.ModerarResena(r.Context(), req.ResenaID, req.Accion); err != nil {
		mapError(w, r, err, "[admin/resenas/moderar]")
		return
	}
	h.auditLog(r, "", "moderar_resena", "resena", &req.ResenaID, map[string]interface{}{"accion": req.Accion, "motivo": req.Motivo})
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}
