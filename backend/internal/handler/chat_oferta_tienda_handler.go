package handler

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/service"
)

type StorageUploader interface {
	UploadStorage(ctx context.Context, supabaseURL, serviceKey, bucket, path string, fileData []byte, contentType string) (string, error)
}

type ChatHandler struct {
	svc         *service.ChatService
	storage     StorageUploader
	supabaseURL string
	serviceKey  string
}

func NewChatHandler(svc *service.ChatService) *ChatHandler {
	return &ChatHandler{svc: svc}
}

func (h *ChatHandler) WithStorage(uploader StorageUploader, supabaseURL, serviceKey string) *ChatHandler {
	h.storage = uploader
	h.supabaseURL = supabaseURL
	h.serviceKey = serviceKey
	return h
}

func (h *ChatHandler) GetConversaciones(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	convs, err := h.svc.GetConversaciones(r.Context(), userID)
	if err != nil {
		slog.Error("[chat/conversaciones] error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener conversaciones")
		return
	}

	JSON(w, http.StatusOK, convs)
}

type crearConversacionRequest struct {
	OtroUsuarioID string  `json:"otroUsuarioId"`
	PropiedadID   *string `json:"propiedadId"`
}

func (h *ChatHandler) GetOrCreateConversacion(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearConversacionRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.OtroUsuarioID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_OTRO_ID", "otroUsuarioId es requerido")
		return
	}

	conv, err := h.svc.GetOrCreateConversacion(r.Context(), userID, req.OtroUsuarioID, req.PropiedadID)
	if err != nil {
		slog.Error("[chat/conversacion/create] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CONV_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, conv)
}

func (h *ChatHandler) GetMensajes(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	convID := r.URL.Query().Get("conversacionId")
	if convID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_CONV_ID", "conversacionId es requerido")
		return
	}

	limit := 50
	offset := 0
	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && o >= 0 {
		offset = o
	}

	msgs, err := h.svc.GetMensajes(r.Context(), convID, userID, limit, offset)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "MSG_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, msgs)
}

type enviarMensajeRequest struct {
	ConversacionID string  `json:"conversacionId"`
	Contenido      string  `json:"contenido"`
	Tipo           string  `json:"tipo"`
	ImagenURL      *string `json:"imagenUrl"`
}

func (h *ChatHandler) EnviarMensaje(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req enviarMensajeRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ConversacionID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_CONV_ID", "conversacionId es requerido")
		return
	}

	tipo := req.Tipo
	if tipo == "" {
		tipo = "texto"
	}

	msg, err := h.svc.EnviarMensaje(r.Context(), req.ConversacionID, userID, req.Contenido, tipo, req.ImagenURL)
	if err != nil {
		slog.Error("[chat/enviar] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "SEND_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, msg)
}

func (h *ChatHandler) CountNoLeidos(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	count, _ := h.svc.CountNoLeidos(r.Context(), userID)
	JSON(w, http.StatusOK, map[string]interface{}{"noLeidos": count})
}

func (h *ChatHandler) GetConversacionInfo(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	convID := chi.URLParam(r, "id")
	if convID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de conversacion requerido")
		return
	}

	info, err := h.svc.GetConversacionInfo(r.Context(), convID, userID)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "CONV_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, info)
}

func (h *ChatHandler) GetMensajesRapidos(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	mensajes, err := h.svc.GetMensajesRapidos(r.Context(), userID)
	if err != nil {
		slog.Error("[chat/mensajes-rapidos] list error", "error", err)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener mensajes rapidos")
		return
	}

	JSON(w, http.StatusOK, mensajes)
}

type crearMensajeRapidoRequest struct {
	Contenido string `json:"contenido"`
	Tipo      string `json:"tipo"`
}

func (h *ChatHandler) CrearMensajeRapido(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearMensajeRapidoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	tipo := req.Tipo
	if tipo == "" {
		tipo = "ambos"
	}

	msg, err := h.svc.CrearMensajeRapido(r.Context(), userID, req.Contenido, tipo)
	if err != nil {
		slog.Error("[chat/mensajes-rapidos] crear error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "CREAR_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, msg)
}

type actualizarMensajeRapidoRequest struct {
	Contenido string `json:"contenido"`
}

func (h *ChatHandler) ActualizarMensajeRapido(w http.ResponseWriter, r *http.Request) {
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

	var req actualizarMensajeRapidoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.ActualizarMensajeRapido(r.Context(), id, userID, req.Contenido); err != nil {
		slog.Error("[chat/mensajes-rapidos] actualizar error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

func (h *ChatHandler) EliminarMensajeRapido(w http.ResponseWriter, r *http.Request) {
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

	if err := h.svc.EliminarMensajeRapido(r.Context(), id, userID); err != nil {
		slog.Error("[chat/mensajes-rapidos] eliminar error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

type seedMensajesRapidosRequest struct {
	Rol string `json:"rol"`
}

func (h *ChatHandler) SeedMensajesRapidos(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req seedMensajesRapidosRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	rol := req.Rol
	if rol == "" {
		rol = "BOOGER"
	}

	if err := h.svc.SeedMensajesRapidos(r.Context(), userID, rol); err != nil {
		slog.Error("[chat/mensajes-rapidos] seed error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "SEED_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true})
}

const chatImagenMaxSize = 5 << 20

func (h *ChatHandler) SubirImagen(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	if h.storage == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Storage no configurado")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, chatImagenMaxSize+1024)
	if err := r.ParseMultipartForm(chatImagenMaxSize); err != nil {
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
		ext = ".jpg"
	}
	storagePath := fmt.Sprintf("%s/%d%s", userID, time.Now().UnixMilli(), ext)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "READ_ERROR", "Error al leer archivo")
		return
	}

	publicURL, err := h.storage.UploadStorage(r.Context(), h.supabaseURL, h.serviceKey, "imagenes-chat", storagePath, fileBytes, contentType)
	if err != nil {
		slog.Error("[chat/imagen] upload error", "error", err, "userID", userID)
		ErrorJSON(w, http.StatusInternalServerError, "UPLOAD_ERROR", "Error al subir imagen")
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true, "url": publicURL})
}

type OfertaHandler struct {
	svc *service.OfertaService
}

func NewOfertaHandler(svc *service.OfertaService) *OfertaHandler {
	return &OfertaHandler{svc: svc}
}

type crearOfertaRequest struct {
	PropiedadID       string  `json:"propiedadId"`
	FechaEntrada      string  `json:"fechaEntrada"`
	FechaSalida       string  `json:"fechaSalida"`
	CantidadHuespedes int     `json:"cantidadHuespedes"`
	PrecioOfertado    float64 `json:"precioOfertado"`
	Moneda            string  `json:"moneda"`
	Mensaje           *string `json:"mensaje"`
}

func (h *OfertaHandler) Crear(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearOfertaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.PropiedadID == "" || req.PrecioOfertado <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "propiedadId y precioOfertado son requeridos")
		return
	}

	fechaEntrada, err := time.Parse("2006-01-02", req.FechaEntrada)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaEntrada invalida")
		return
	}
	fechaSalida, err := time.Parse("2006-01-02", req.FechaSalida)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaSalida invalida")
		return
	}

	id, err := h.svc.Crear(r.Context(), &service.CrearOfertaInput{
		PropiedadID:       req.PropiedadID,
		HuespedID:         userID,
		FechaEntrada:      fechaEntrada,
		FechaSalida:       fechaSalida,
		CantidadHuespedes: req.CantidadHuespedes,
		PrecioOfertado:    req.PrecioOfertado,
		Moneda:            req.Moneda,
		Mensaje:           req.Mensaje,
	})
	if err != nil {
		slog.Error("[ofertas/crear] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "OFERTA_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusCreated, map[string]interface{}{"id": id, "mensaje": "Oferta creada exitosamente"})
}

type responderOfertaRequest struct {
	Accion        string  `json:"accion"`
	MotivoRechazo *string `json:"motivoRechazo"`
}

func (h *OfertaHandler) Responder(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	ofertaID := chi.URLParam(r, "id")
	if ofertaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de oferta requerido")
		return
	}

	var req responderOfertaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.Responder(r.Context(), ofertaID, userID, req.Accion, req.MotivoRechazo); err != nil {
		slog.Error("[ofertas/responder] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "RESPONDER_ERROR", err.Error())
		return
	}

	JSON(w, http.StatusOK, map[string]interface{}{"ok": true, "mensaje": "Oferta actualizada"})
}

func (h *OfertaHandler) GetRecibidas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	ofertas, err := h.svc.GetRecibidas(r.Context(), userID)
	if err != nil {
		slog.Error("[ofertas/recibidas] error", "error", err, "userID", userID)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener ofertas")
		return
	}

	JSON(w, http.StatusOK, ofertas)
}

func (h *OfertaHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	ofertaID := chi.URLParam(r, "id")
	if ofertaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de oferta requerido")
		return
	}

	detalle, err := h.svc.GetDetalleByID(r.Context(), ofertaID, userID)
	if err != nil {
		slog.Error("[ofertas/detalle] error", "error", err, "ofertaID", ofertaID)
		ErrorJSON(w, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}

	imagenURL := ""
	if detalle.ImagenPrincipal != nil {
		imagenURL = *detalle.ImagenPrincipal
	}
	huespedAvatar := ""
	if detalle.HuespedAvatar != nil {
		huespedAvatar = *detalle.HuespedAvatar
	}

	JSON(w, http.StatusOK, map[string]interface{}{
		"id":                 detalle.ID,
		"codigo":             detalle.Codigo,
		"propiedad_id":       detalle.PropiedadID,
		"huesped_id":         detalle.HuespedID,
		"estado":             detalle.Estado,
		"precio_ofertado":    detalle.PrecioOfertado,
		"precio_original":    detalle.PrecioOriginal,
		"moneda":             detalle.Moneda,
		"fecha_entrada":      detalle.FechaEntrada.Format("2006-01-02"),
		"fecha_salida":       detalle.FechaSalida.Format("2006-01-02"),
		"noches":             detalle.Noches,
		"cantidad_huespedes": detalle.CantidadHuespedes,
		"mensaje":            detalle.Mensaje,
		"motivo_rechazo":     detalle.MotivoRechazo,
		"fecha_creacion":     detalle.FechaCreacion,
		"fecha_aprobada":     detalle.FechaAprobada,
		"fecha_expiracion":   detalle.FechaExpiracion,
		"fecha_rechazada":    detalle.FechaRechazada,
		"reserva_id":         detalle.ReservaID,
		"propiedad": map[string]interface{}{
			"id":               detalle.PropiedadID,
			"titulo":           detalle.PropiedadTitulo,
			"precio_por_noche": detalle.PropiedadPrecio,
			"moneda":           detalle.PropiedadMoneda,
			"propietario_id":   detalle.PropietarioID,
			"imagenes":         buildImagenList(imagenURL),
		},
		"huesped": map[string]interface{}{
			"id":         detalle.HuespedID,
			"nombre":     detalle.HuespedNombre,
			"apellido":   detalle.HuespedApellido,
			"email":      detalle.HuespedEmail,
			"avatar_url": huespedAvatar,
			"verificado": detalle.HuespedVerificado,
		},
	})
}

func buildImagenList(url string) []map[string]interface{} {
	if url == "" {
		return []map[string]interface{}{}
	}
	return []map[string]interface{}{{"url": url, "es_principal": true}}
}

func (h *OfertaHandler) GetEnviadas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	ofertas, err := h.svc.GetEnviadas(r.Context(), userID)
	if err != nil {
		slog.Error("[ofertas/enviadas] error", "error", err, "userID", userID)
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener ofertas")
		return
	}

	JSON(w, http.StatusOK, ofertas)
}

type TiendaHandler struct {
	svc *service.TiendaService
}

func NewTiendaHandler(svc *service.TiendaService) *TiendaHandler {
	return &TiendaHandler{svc: svc}
}

func (h *TiendaHandler) GetProductos(w http.ResponseWriter, r *http.Request) {
	prods, err := h.svc.GetProductos(r.Context())
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener productos")
		return
	}
	JSON(w, http.StatusOK, prods)
}

func (h *TiendaHandler) GetServicios(w http.ResponseWriter, r *http.Request) {
	servs, err := h.svc.GetServicios(r.Context())
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener servicios")
		return
	}
	JSON(w, http.StatusOK, servs)
}

func (h *TiendaHandler) GetAllProductos(w http.ResponseWriter, r *http.Request) {
	role := auth.GetUserRole(r.Context())
	if role != "ADMIN" {
		ErrorJSON(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Acceso de administrador requerido")
		return
	}
	prods, err := h.svc.GetAllProductos(r.Context())
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener productos")
		return
	}
	JSON(w, http.StatusOK, prods)
}

func (h *TiendaHandler) GetAllServicios(w http.ResponseWriter, r *http.Request) {
	role := auth.GetUserRole(r.Context())
	if role != "ADMIN" {
		ErrorJSON(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Acceso de administrador requerido")
		return
	}
	servs, err := h.svc.GetAllServicios(r.Context())
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "LIST_ERROR", "Error al obtener servicios")
		return
	}
	JSON(w, http.StatusOK, servs)
}
