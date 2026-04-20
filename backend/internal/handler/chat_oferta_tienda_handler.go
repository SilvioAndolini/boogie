package handler

import (
	"context"
	"fmt"
	"io"
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
		mapError(w, r, err, "[chat/conversaciones]", "userId", userID)
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
		mapError(w, r, err, "[chat/conversacion/create]")
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
		mapError(w, r, err, "[chat/mensajes]")
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
		mapError(w, r, err, "[chat/enviar]")
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
	JSON(w, http.StatusOK, NoLeidosResponse{NoLeidos: count})
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
		mapError(w, r, err, "[chat/conversacion/info]")
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
		mapError(w, r, err, "[chat/mensajes-rapidos]", "userId", userID)
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
		mapError(w, r, err, "[chat/mensajes-rapidos/crear]")
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
		mapError(w, r, err, "[chat/mensajes-rapidos/actualizar]")
		return
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
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
		mapError(w, r, err, "[chat/mensajes-rapidos/eliminar]")
		return
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
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
		mapError(w, r, err, "[chat/mensajes-rapidos/seed]")
		return
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
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

	if err := r.ParseMultipartForm(chatImagenMaxSize); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "FILE_TOO_LARGE", "Imagen muy grande (max 5MB)")
		return
	}

	file, header, err := r.FormFile("imagen")
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_FILE", "No se encontro imagen")
		return
	}
	defer func() { _ = file.Close() }()

	contentType := header.Header.Get("Content-Type")
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	storagePath := fmt.Sprintf("%s/%d%s", userID, time.Now().UnixMilli(), ext)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		CaptureError(w, r, http.StatusInternalServerError, "READ_ERROR", "Error al leer archivo", err)
		return
	}

	publicURL, err := h.storage.UploadStorage(r.Context(), h.supabaseURL, h.serviceKey, "imagenes-chat", storagePath, fileBytes, contentType)
	if err != nil {
		mapError(w, r, err, "[chat/imagen] upload", "userId", userID)
		return
	}

	JSON(w, http.StatusOK, OKURLResponse{Ok: true, URL: publicURL})
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
		mapError(w, r, err, "[ofertas/crear]")
		return
	}

	JSON(w, http.StatusCreated, OfertaCreadaResponse{ID: id, Mensaje: "Oferta creada exitosamente"})
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
		mapError(w, r, err, "[ofertas/responder]")
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Oferta actualizada"})
}

func (h *OfertaHandler) GetRecibidas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	ofertas, err := h.svc.GetRecibidas(r.Context(), userID)
	if err != nil {
		mapError(w, r, err, "[ofertas/recibidas]", "userId", userID)
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
		mapError(w, r, err, "[ofertas/detalle]", "ofertaID", ofertaID)
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

	JSON(w, http.StatusOK, OfertaDetalleResponse{
		ID:               detalle.ID,
		Codigo:           detalle.Codigo,
		PropiedadID:      detalle.PropiedadID,
		HuespedID:        detalle.HuespedID,
		Estado:           detalle.Estado,
		PrecioOfertado:   detalle.PrecioOfertado,
		PrecioOriginal:   detalle.PrecioOriginal,
		Moneda:           detalle.Moneda,
		FechaEntrada:     detalle.FechaEntrada.Format("2006-01-02"),
		FechaSalida:      detalle.FechaSalida.Format("2006-01-02"),
		Noches:           detalle.Noches,
		CantidadHuespedes: detalle.CantidadHuespedes,
		Mensaje:          detalle.Mensaje,
		MotivoRechazo:    detalle.MotivoRechazo,
		FechaCreacion:    detalle.FechaCreacion,
		FechaAprobada:    detalle.FechaAprobada,
		FechaExpiracion:  detalle.FechaExpiracion,
		FechaRechazada:   detalle.FechaRechazada,
		ReservaID:        detalle.ReservaID,
		Propiedad: OfertaDetallePropiedad{
			ID:             detalle.PropiedadID,
			Titulo:         detalle.PropiedadTitulo,
			PrecioPorNoche: detalle.PropiedadPrecio,
			Moneda:         detalle.PropiedadMoneda,
			PropietarioID:  detalle.PropietarioID,
			Imagenes:       buildImagenList(imagenURL),
		},
		Huesped: OfertaDetalleHuesped{
			ID:         detalle.HuespedID,
			Nombre:     detalle.HuespedNombre,
			Apellido:   detalle.HuespedApellido,
			Email:      detalle.HuespedEmail,
			AvatarURL:  huespedAvatar,
			Verificado: detalle.HuespedVerificado,
		},
	})
}

func buildImagenList(url string) []ImagenEntry {
	if url == "" {
		return []ImagenEntry{}
	}
	return []ImagenEntry{{URL: url, EsPrincipal: true}}
}

func (h *OfertaHandler) GetEnviadas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	ofertas, err := h.svc.GetEnviadas(r.Context(), userID)
	if err != nil {
		mapError(w, r, err, "[ofertas/enviadas]", "userId", userID)
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
		mapError(w, r, err, "[tienda/productos]")
		return
	}
	JSON(w, http.StatusOK, prods)
}

func (h *TiendaHandler) GetServicios(w http.ResponseWriter, r *http.Request) {
	servs, err := h.svc.GetServicios(r.Context())
	if err != nil {
		mapError(w, r, err, "[tienda/servicios]")
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
		mapError(w, r, err, "[tienda/all-productos]")
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
		mapError(w, r, err, "[tienda/all-servicios]")
		return
	}
	JSON(w, http.StatusOK, servs)
}
