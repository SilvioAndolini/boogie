package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
)

type AdminHandler struct {
	svc         *service.AdminService
	tiendaSvc   *service.TiendaService
	storage     StorageUploader
	supabaseURL string
	serviceKey  string
}

func NewAdminHandler(svc *service.AdminService, tiendaSvc *service.TiendaService) *AdminHandler {
	return &AdminHandler{svc: svc, tiendaSvc: tiendaSvc}
}

func (h *AdminHandler) WithStorage(uploader StorageUploader, supabaseURL, serviceKey string) *AdminHandler {
	h.storage = uploader
	h.supabaseURL = supabaseURL
	h.serviceKey = serviceKey
	return h
}

func requireAdmin(w http.ResponseWriter, r *http.Request) (bool, string, string) {
	userID := auth.GetUserID(r.Context())
	role := auth.GetUserRole(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return false, "", ""
	}
	if role != "ADMIN" && role != "CEO" {
		ErrorJSON(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Acceso de administrador requerido")
		return false, "", ""
	}
	return true, userID, role
}

func intQueryParam(r *http.Request, key string, defaultVal int) int {
	v := r.URL.Query().Get(key)
	if v == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 1 {
		return defaultVal
	}
	return n
}

func (h *AdminHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	stats, err := h.svc.GetDashboardStats(r.Context())
	if err != nil {
		slog.Error("[admin/dashboard] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DASHBOARD_ERROR", "Error al obtener estadísticas")
		return
	}
	JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) GetReservas(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	estado := r.URL.Query().Get("estado")
	busqueda := r.URL.Query().Get("busqueda")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetReservas(r.Context(), estado, busqueda, pagina)
	if err != nil {
		slog.Error("[admin/reservas] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetReservasStats(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	stats, err := h.svc.GetReservasStats(r.Context())
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "STATS_ERROR", "Error al obtener estadísticas")
		return
	}
	JSON(w, http.StatusOK, stats)
}

type accionReservaRequest struct {
	ReservaID string  `json:"reservaId"`
	Accion    string  `json:"accion"`
	Motivo    *string `json:"motivo"`
}

func (h *AdminHandler) AccionReserva(w http.ResponseWriter, r *http.Request) {
	ok, adminID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req accionReservaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.ReservaID == "" || req.Accion == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "reservaId y accion son requeridos")
		return
	}
	if err := h.svc.AccionReserva(r.Context(), req.ReservaID, req.Accion, adminID); err != nil {
		slog.Error("[admin/reservas/accion] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "ACCION_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

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
		slog.Error("[admin/pagos] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
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
		ErrorJSON(w, http.StatusInternalServerError, "STATS_ERROR", "Error al obtener estadísticas")
		return
	}
	JSON(w, http.StatusOK, stats)
}

type adminVerificarPagoRequest struct {
	PagoID string  `json:"pagoId"`
	Accion string  `json:"accion"`
	Notas  *string `json:"notasVerificacion"`
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
		slog.Error("[admin/pagos/verificar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "VERIFY_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetPropiedades(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	estado := r.URL.Query().Get("estado")
	ciudad := r.URL.Query().Get("ciudad")
	busqueda := r.URL.Query().Get("busqueda")
	categoria := r.URL.Query().Get("categoria")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetPropiedades(r.Context(), estado, ciudad, busqueda, categoria, pagina)
	if err != nil {
		slog.Error("[admin/propiedades] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, result)
}

type updatePropiedadRequest struct {
	PropiedadID       string  `json:"propiedadId"`
	EstadoPublicacion *string `json:"estadoPublicacion"`
	Destacada         *bool   `json:"destacada"`
	Motivo            *string `json:"motivo"`
}

func (h *AdminHandler) UpdatePropiedad(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req updatePropiedadRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.PropiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "propiedadId es requerido")
		return
	}

	var estado string
	if req.EstadoPublicacion != nil {
		estado = *req.EstadoPublicacion
	}
	if err := h.svc.UpdatePropiedad(r.Context(), req.PropiedadID, estado, req.Destacada); err != nil {
		slog.Error("[admin/propiedades/update] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) DeletePropiedad(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if id == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID requerido")
		return
	}
	if err := h.svc.DeletePropiedad(r.Context(), id); err != nil {
		slog.Error("[admin/propiedades/delete] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "DELETE_ERROR", "Error al eliminar propiedad")
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetResenas(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	calificacionMin, _ := strconv.Atoi(r.URL.Query().Get("calificacionMin"))
	busqueda := r.URL.Query().Get("busqueda")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetResenas(r.Context(), calificacionMin, busqueda, pagina)
	if err != nil {
		slog.Error("[admin/resenas] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
		return
	}

	total, promedio, dist, _ := h.svc.GetResenaStats(r.Context())
	JSON(w, http.StatusOK, map[string]interface{}{
		"data":         result.Data,
		"total":        result.Total,
		"pagina":       result.Pagina,
		"totalPaginas": result.TotalPaginas,
		"stats":        map[string]interface{}{"total": total, "promedio": promedio, "distribucion": dist},
	})
}

type moderarResenaRequest struct {
	ResenaID string `json:"resenaId"`
	Accion   string `json:"accion"`
	Motivo   string `json:"motivo"`
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
		slog.Error("[admin/resenas/moderar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "MODERATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetCupones(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	cupones, err := h.svc.GetCupones(r.Context())
	if err != nil {
		slog.Error("[admin/cupones] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener cupones")
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
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", "Cupón no encontrado")
		return
	}
	JSON(w, http.StatusOK, cupon)
}

type crearCuponRequest struct {
	Codigo            string   `json:"codigo"`
	Nombre            string   `json:"nombre"`
	Descripcion       *string  `json:"descripcion"`
	TipoDescuento     string   `json:"tipoDescuento"`
	ValorDescuento    float64  `json:"valorDescuento"`
	Moneda            string   `json:"moneda"`
	MaxDescuento      *float64 `json:"maxDescuento"`
	TipoAplicacion    string   `json:"tipoAplicacion"`
	ValorAplicacion   *string  `json:"valorAplicacion"`
	MinCompra         *float64 `json:"minCompra"`
	MinNoches         *int     `json:"minNoches"`
	MaxUsos           *int     `json:"maxUsos"`
	MaxUsosPorUsuario int      `json:"maxUsosPorUsuario"`
	FechaInicio       string   `json:"fechaInicio"`
	FechaFin          string   `json:"fechaFin"`
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

	cupon := &repository.Cupon{
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
		slog.Error("[admin/cupones/crear] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusCreated, map[string]interface{}{"ok": true, "mensaje": "Cupón creado"})
}

type editarCuponRequest struct {
	ID                string   `json:"id"`
	Codigo            *string  `json:"codigo"`
	Nombre            *string  `json:"nombre"`
	Descripcion       *string  `json:"descripcion"`
	TipoDescuento     *string  `json:"tipoDescuento"`
	ValorDescuento    *float64 `json:"valorDescuento"`
	Moneda            *string  `json:"moneda"`
	MaxDescuento      *float64 `json:"maxDescuento"`
	TipoAplicacion    *string  `json:"tipoAplicacion"`
	ValorAplicacion   *string  `json:"valorAplicacion"`
	MinCompra         *float64 `json:"minCompra"`
	MinNoches         *int     `json:"minNoches"`
	MaxUsos           *int     `json:"maxUsos"`
	MaxUsosPorUsuario *int     `json:"maxUsosPorUsuario"`
	FechaInicio       *string  `json:"fechaInicio"`
	FechaFin          *string  `json:"fechaFin"`
	Activo            *bool    `json:"activo"`
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
		slog.Error("[admin/cupones/editar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

type toggleCuponRequest struct {
	Activo bool `json:"activo"`
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
		ErrorJSON(w, http.StatusBadRequest, "TOGGLE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) DeleteCupon(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteCupon(r.Context(), id); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetCuponUsos(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	cuponID := r.URL.Query().Get("cuponId")
	usos, err := h.svc.GetCuponUsos(r.Context(), cuponID)
	if err != nil {
		slog.Error("[admin/cupones/usos] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener usos")
		return
	}
	JSON(w, http.StatusOK, usos)
}

type updateComisionesRequest struct {
	ComisionHuesped   float64 `json:"comisionHuesped"`
	ComisionAnfitrion float64 `json:"comisionAnfitrion"`
}

func (h *AdminHandler) GetComisiones(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	comisiones, err := h.svc.GetComisiones(r.Context())
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "COMISIONES_ERROR", "Error al obtener comisiones")
		return
	}
	JSON(w, http.StatusOK, comisiones)
}

func (h *AdminHandler) UpdateComisiones(w http.ResponseWriter, r *http.Request) {
	ok, userID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req updateComisionesRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if err := h.svc.UpdateComisiones(r.Context(), req.ComisionHuesped, req.ComisionAnfitrion, userID); err != nil {
		slog.Error("[admin/comisiones] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetAuditLog(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	entidad := r.URL.Query().Get("entidad")
	adminID := r.URL.Query().Get("adminId")
	fechaInicio := r.URL.Query().Get("fechaInicio")
	fechaFin := r.URL.Query().Get("fechaFin")
	pagina := intQueryParam(r, "pagina", 1)

	result, err := h.svc.GetAuditLog(r.Context(), entidad, adminID, fechaInicio, fechaFin, pagina)
	if err != nil {
		slog.Error("[admin/auditoria] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetNotificaciones(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	pagina := intQueryParam(r, "pagina", 1)
	result, err := h.svc.GetNotificaciones(r.Context(), pagina)
	if err != nil {
		slog.Error("[admin/notificaciones] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, result)
}

type enviarNotificacionRequest struct {
	UsuarioID *string `json:"usuarioId"`
	Titulo    string  `json:"titulo"`
	Mensaje   string  `json:"mensaje"`
	URLAccion *string `json:"urlAccion"`
}

func (h *AdminHandler) EnviarNotificacion(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req enviarNotificacionRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Titulo == "" || req.Mensaje == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "titulo y mensaje son requeridos")
		return
	}

	var usuarioID string
	if req.UsuarioID != nil {
		usuarioID = *req.UsuarioID
	}
	if err := h.svc.EnviarNotificacion(r.Context(), usuarioID, req.Titulo, req.Mensaje, req.URLAccion); err != nil {
		slog.Error("[admin/notificaciones/enviar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "SEND_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusCreated, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) CrearProductoStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req struct {
		Nombre      string  `json:"nombre"`
		Descripcion *string `json:"descripcion"`
		Precio      float64 `json:"precio"`
		Moneda      string  `json:"moneda"`
		ImagenURL   *string `json:"imagenUrl"`
		Categoria   string  `json:"categoria"`
		Orden       *int    `json:"orden"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Nombre == "" || req.Precio <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "nombre y precio son requeridos")
		return
	}
	orden := 0
	if req.Orden != nil {
		orden = *req.Orden
	}
	moneda := req.Moneda
	if moneda == "" {
		moneda = "USD"
	}
	if err := h.tiendaSvc.CrearProducto(r.Context(), req.Nombre, req.Descripcion, req.Precio, moneda, req.ImagenURL, req.Categoria, orden); err != nil {
		slog.Error("[admin/store/productos/crear] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusCreated, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) ActualizarProductoStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	var req struct {
		Nombre      *string  `json:"nombre"`
		Descripcion *string  `json:"descripcion"`
		Precio      *float64 `json:"precio"`
		Moneda      *string  `json:"moneda"`
		ImagenURL   *string  `json:"imagenUrl"`
		Categoria   *string  `json:"categoria"`
		Activo      *bool    `json:"activo"`
		Orden       *int     `json:"orden"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if err := h.tiendaSvc.ActualizarProducto(r.Context(), id, req.Nombre, req.Descripcion, req.Precio, req.Moneda, req.ImagenURL, req.Categoria, req.Activo, req.Orden); err != nil {
		slog.Error("[admin/store/productos/actualizar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) EliminarProductoStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.tiendaSvc.EliminarProducto(r.Context(), id); err != nil {
		slog.Error("[admin/store/productos/eliminar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) CrearServicioStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	var req struct {
		Nombre      string  `json:"nombre"`
		Descripcion *string `json:"descripcion"`
		Precio      float64 `json:"precio"`
		Moneda      string  `json:"moneda"`
		TipoPrecio  string  `json:"tipoPrecio"`
		ImagenURL   *string `json:"imagenUrl"`
		Categoria   string  `json:"categoria"`
		Orden       *int    `json:"orden"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Nombre == "" || req.Precio <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "nombre y precio son requeridos")
		return
	}
	orden := 0
	if req.Orden != nil {
		orden = *req.Orden
	}
	moneda := req.Moneda
	if moneda == "" {
		moneda = "USD"
	}
	tipoPrecio := req.TipoPrecio
	if tipoPrecio == "" {
		tipoPrecio = "FIJO"
	}
	if err := h.tiendaSvc.CrearServicio(r.Context(), req.Nombre, req.Descripcion, req.Precio, moneda, tipoPrecio, req.Categoria, req.ImagenURL, orden); err != nil {
		slog.Error("[admin/store/servicios/crear] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusCreated, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) ActualizarServicioStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	var req struct {
		Nombre      *string  `json:"nombre"`
		Descripcion *string  `json:"descripcion"`
		Precio      *float64 `json:"precio"`
		Moneda      *string  `json:"moneda"`
		TipoPrecio  *string  `json:"tipoPrecio"`
		ImagenURL   *string  `json:"imagenUrl"`
		Categoria   *string  `json:"categoria"`
		Activo      *bool    `json:"activo"`
		Orden       *int     `json:"orden"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if err := h.tiendaSvc.ActualizarServicio(r.Context(), id, req.Nombre, req.Descripcion, req.Precio, req.Moneda, req.TipoPrecio, req.ImagenURL, req.Categoria, req.Activo, req.Orden); err != nil {
		slog.Error("[admin/store/servicios/actualizar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) EliminarServicioStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.tiendaSvc.EliminarServicio(r.Context(), id); err != nil {
		slog.Error("[admin/store/servicios/eliminar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetUsuarios(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	busqueda := r.URL.Query().Get("busqueda")
	rol := r.URL.Query().Get("rol")
	pagina := intQueryParam(r, "pagina", 1)
	limite := intQueryParam(r, "limite", 20)

	result, err := h.svc.GetUsuarios(r.Context(), busqueda, rol, pagina, limite)
	if err != nil {
		slog.Error("[admin/usuarios] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) CrearUsuario(w http.ResponseWriter, r *http.Request) {
	ok, adminID, _ := requireAdmin(w, r)
	if !ok {
		return
	}
	var req struct {
		Email    string  `json:"email"`
		Password string  `json:"password"`
		Nombre   string  `json:"nombre"`
		Apellido string  `json:"apellido"`
		Telefono *string `json:"telefono"`
		Rol      string  `json:"rol"`
	}
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" || req.Password == "" || req.Nombre == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "email, password y nombre son requeridos")
		return
	}
	result, err := h.svc.CrearUsuario(r.Context(), req.Email, req.Password, req.Nombre, req.Apellido, req.Telefono, req.Rol, adminID)
	if err != nil {
		slog.Error("[admin/usuarios/crear] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusCreated, result)
}

func (h *AdminHandler) UpdateUsuario(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	var req struct {
		Rol              *string  `json:"rol"`
		Plan             *string  `json:"plan"`
		PlanSuscripcion  *string  `json:"plan_suscripcion"`
		Reputacion       *float64 `json:"reputacion"`
		ReputacionManual *string  `json:"reputacion_manual"`
		Activo           *bool    `json:"activo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	plan := req.PlanSuscripcion
	if plan == nil && req.Plan != nil {
		plan = req.Plan
	}
	if err := h.svc.UpdateUsuario(r.Context(), id, req.Rol, plan, req.Reputacion, req.Activo); err != nil {
		slog.Error("[admin/usuarios/update] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) DeleteUsuario(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.DeleteUsuario(r.Context(), id); err != nil {
		slog.Error("[admin/usuarios/delete] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *AdminHandler) GetPropiedadByID(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	result, err := h.svc.GetPropiedadByID(r.Context(), id)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", "Propiedad no encontrada")
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetCiudades(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	ciudades, err := h.svc.GetCiudades(r.Context())
	if err != nil {
		slog.Error("[admin/propiedades/ciudades] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener ciudades")
		return
	}
	JSON(w, http.StatusOK, ciudades)
}

func (h *AdminHandler) GetPropiedadIngresos(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	result, err := h.svc.GetPropiedadIngresos(r.Context(), id)
	if err != nil {
		slog.Error("[admin/propiedades/ingresos] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "INGRESOS_ERROR", err.Error())
		return
	}
	JSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetReservaByID(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	result, err := h.svc.GetReservaByID(r.Context(), id)
	if err != nil {
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", "Reserva no encontrada")
		return
	}
	JSON(w, http.StatusOK, result)
}

const storeImagenMaxSize = 5 << 20

func (h *AdminHandler) SubirImagenStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}

	if h.storage == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Storage no configurado")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, storeImagenMaxSize+1024)
	if err := r.ParseMultipartForm(storeImagenMaxSize); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "FILE_TOO_LARGE", "Imagen muy grande (max 5MB)")
		return
	}

	file, header, err := r.FormFile("imagen")
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_FILE", "No se encontro imagen")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".webp"
	}
	storagePath := fmt.Sprintf("store/%d%s", time.Now().UnixMilli(), ext)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "READ_ERROR", "Error al leer archivo")
		return
	}

	publicURL, err := h.storage.UploadStorage(r.Context(), h.supabaseURL, h.serviceKey, "imagenes", storagePath, fileBytes, contentType)
	if err != nil {
		slog.Error("[admin/store/upload-imagen] upload error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "UPLOAD_ERROR", "Error al subir imagen")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true, "url": publicURL})
}
