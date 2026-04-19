package handler

import (
	"net/http"
	"strconv"

	"github.com/boogie/backend/internal/auth"
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

func (h *AdminHandler) auditLog(r *http.Request, adminID, accion, entidad string, entidadID *string, detalles interface{}) {
	if adminID == "" {
		adminID = auth.GetUserID(r.Context())
	}
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.Header.Get("X-Real-Ip")
	}
	var ipPtr *string
	if ip != "" {
		ipPtr = &ip
	}
	ua := r.Header.Get("User-Agent")
	var uaPtr *string
	if ua != "" {
		uaPtr = &ua
	}
	h.svc.LogAction(r.Context(), adminID, accion, entidad, entidadID, detalles, ipPtr, uaPtr)
}

func auditID(r *http.Request) string {
	return auth.GetUserID(r.Context())
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

type accionReservaRequest struct {
	ReservaID string  `json:"reservaId"`
	Accion    string  `json:"accion"`
	Motivo    *string `json:"motivo"`
}

type adminVerificarPagoRequest struct {
	PagoID string  `json:"pagoId"`
	Accion string  `json:"accion"`
	Notas  *string `json:"notasVerificacion"`
}

type updatePropiedadRequest struct {
	PropiedadID       string  `json:"propiedadId"`
	EstadoPublicacion *string `json:"estadoPublicacion"`
	Destacada         *bool   `json:"destacada"`
	Motivo            *string `json:"motivo"`
}

type moderarResenaRequest struct {
	ResenaID string `json:"resenaId"`
	Accion   string `json:"accion"`
	Motivo   string `json:"motivo"`
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

type toggleCuponRequest struct {
	Activo bool `json:"activo"`
}

type updateComisionesRequest struct {
	ComisionHuesped   float64 `json:"comisionHuesped"`
	ComisionAnfitrion float64 `json:"comisionAnfitrion"`
}

type enviarNotificacionRequest struct {
	UsuarioID *string `json:"usuarioId"`
	Titulo    string  `json:"titulo"`
	Mensaje   string  `json:"mensaje"`
	URLAccion *string `json:"urlAccion"`
}
