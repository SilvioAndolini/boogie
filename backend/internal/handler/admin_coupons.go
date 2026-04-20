package handler

import (
	"net/http"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/repository/admin"
	"github.com/go-chi/chi/v5"
)

func (h *AdminHandler) GetCupones(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	cupones, err := h.svc.GetCupones(r.Context())
	if err != nil {
		mapError(w, r, err, "[admin/cupones]")
		return
	}
	JSON(w, http.StatusOK, cupones)
}

func (h *AdminHandler) GetCuponByID(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	cupon, err := h.svc.GetCuponByID(r.Context(), id)
	if err != nil {
		mapError(w, r, err, "[admin/cupones/by-id]", "id", id)
		return
	}
	JSON(w, http.StatusOK, cupon)
}

func (h *AdminHandler) CrearCupon(w http.ResponseWriter, r *http.Request) {
	ok, userID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req crearCuponRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Codigo == "" || req.Nombre == "" || req.TipoDescuento == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "codigo, nombre y tipoDescuento son requeridos")
		return
	}

	fechaInicio, err := time.Parse("2006-01-02", req.FechaInicio)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaInicio invalida")
		return
	}
	fechaFin, err := time.Parse("2006-01-02", req.FechaFin)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaFin invalida")
		return
	}
	if !fechaFin.After(fechaInicio) {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaFin debe ser posterior a fechaInicio")
		return
	}

	if req.TipoDescuento == "PORCENTAJE" && req.ValorDescuento > 100 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_VALUE", "Porcentaje no puede superar 100%")
		return
	}

	maxUsosPorUsuario := req.MaxUsosPorUsuario
	if maxUsosPorUsuario < 1 {
		maxUsosPorUsuario = 1
	}

	moneda := req.Moneda
	if moneda == "" {
		moneda = "USD"
	}

	cupon := &admin.Cupon{
		Codigo:            req.Codigo,
		Nombre:            req.Nombre,
		Descripcion:       req.Descripcion,
		TipoDescuento:     req.TipoDescuento,
		ValorDescuento:    req.ValorDescuento,
		Moneda:            moneda,
		MaxDescuento:      req.MaxDescuento,
		TipoAplicacion:    req.TipoAplicacion,
		ValorAplicacion:   req.ValorAplicacion,
		MinCompra:         req.MinCompra,
		MinNoches:         req.MinNoches,
		MaxUsos:           req.MaxUsos,
		MaxUsosPorUsuario: maxUsosPorUsuario,
		FechaInicio:       fechaInicio,
		FechaFin:          fechaFin,
		CreadoPor:         &userID,
	}

	if err := h.svc.CrearCupon(r.Context(), cupon); err != nil {
		mapError(w, r, err, "[admin/cupones/crear]")
		return
	}
	h.auditLog(r, userID, "crear_cupon", "cupon", nil, map[string]interface{}{"codigo": req.Codigo, "nombre": req.Nombre})
	JSON(w, http.StatusCreated, OKMensajeResponse{Ok: true, Mensaje: "Cupón creado"})
}

func (h *AdminHandler) EditarCupon(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req editarCuponRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.ID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "id es requerido")
		return
	}

	fields := map[string]interface{}{}
	if req.Codigo != nil {
		fields["codigo"] = *req.Codigo
	}
	if req.Nombre != nil {
		fields["nombre"] = *req.Nombre
	}
	if req.Descripcion != nil {
		fields["descripcion"] = *req.Descripcion
	}
	if req.TipoDescuento != nil {
		fields["tipo_descuento"] = *req.TipoDescuento
	}
	if req.ValorDescuento != nil {
		fields["valor_descuento"] = *req.ValorDescuento
	}
	if req.Moneda != nil {
		fields["moneda"] = *req.Moneda
	}
	if req.MaxDescuento != nil {
		fields["max_descuento"] = *req.MaxDescuento
	}
	if req.TipoAplicacion != nil {
		fields["tipo_aplicacion"] = *req.TipoAplicacion
	}
	if req.ValorAplicacion != nil {
		fields["valor_aplicacion"] = *req.ValorAplicacion
	}
	if req.MinCompra != nil {
		fields["min_compra"] = *req.MinCompra
	}
	if req.MinNoches != nil {
		fields["min_noches"] = *req.MinNoches
	}
	if req.MaxUsos != nil {
		fields["max_usos"] = *req.MaxUsos
	}
	if req.MaxUsosPorUsuario != nil {
		fields["max_usos_por_usuario"] = *req.MaxUsosPorUsuario
	}
	if req.Activo != nil {
		fields["activo"] = *req.Activo
	}
	if req.FechaInicio != nil {
		fi, err := time.Parse("2006-01-02", *req.FechaInicio)
		if err != nil {
			ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaInicio invalida")
			return
		}
		fields["fecha_inicio"] = fi
	}
	if req.FechaFin != nil {
		ff, err := time.Parse("2006-01-02", *req.FechaFin)
		if err != nil {
			ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaFin invalida")
			return
		}
		fields["fecha_fin"] = ff
	}

	if err := h.svc.UpdateCupon(r.Context(), req.ID, fields); err != nil {
		mapError(w, r, err, "[admin/cupones/editar]")
		return
	}
	h.auditLog(r, "", "editar_cupon", "cupon", &req.ID, fields)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) ToggleCuponActivo(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	var req toggleCuponRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if err := h.svc.ToggleCuponActivo(r.Context(), id, req.Activo); err != nil {
		mapError(w, r, err, "[admin/cupones/toggle]")
		return
	}
	h.auditLog(r, "", "toggle_cupon", "cupon", &id, map[string]interface{}{"activo": req.Activo})
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) DeleteCupon(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteCupon(r.Context(), id); err != nil {
		mapError(w, r, err, "[admin/cupones/delete]")
		return
	}
	h.auditLog(r, "", "delete_cupon", "cupon", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) GetCuponUsos(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	cuponID := r.URL.Query().Get("cuponId")
	usos, err := h.svc.GetCuponUsos(r.Context(), cuponID)
	if err != nil {
		mapError(w, r, err, "[admin/cupones/usos]")
		return
	}
	JSON(w, http.StatusOK, usos)
}

func (h *AdminHandler) GetCuponesActivosUsuario(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	cupones, err := h.svc.GetCuponesActivosUsuario(r.Context(), userID)
	if err != nil {
		mapError(w, r, err, "[cupones/activos]")
		return
	}

	JSON(w, http.StatusOK, cupones)
}
