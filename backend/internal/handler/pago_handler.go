package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type PagoHandler struct {
	svc           *service.PagoService
	authClient    *auth.SupabaseAuthClient
	supabaseURL   string
	serviceKey    string
	storeItemRepo *repository.StoreItemRepo
}

func NewPagoHandler(svc *service.PagoService, authClient *auth.SupabaseAuthClient, supabaseURL, serviceKey string, storeItemRepo *repository.StoreItemRepo) *PagoHandler {
	return &PagoHandler{svc: svc, authClient: authClient, supabaseURL: supabaseURL, serviceKey: serviceKey, storeItemRepo: storeItemRepo}
}

type registrarPagoSimpleRequest struct {
	ReservaID  string  `json:"reservaId"`
	Monto      float64 `json:"monto"`
	Moneda     string  `json:"moneda"`
	MetodoPago string  `json:"metodoPago"`
	Referencia string  `json:"referencia"`
}

func (h *PagoHandler) RegistrarSimple(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req registrarPagoSimpleRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_RESERVA_ID", "reservaId es requerido")
		return
	}
	if req.Monto <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_MONTO", "monto debe ser mayor a 0")
		return
	}
	if req.MetodoPago == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_METODO", "metodoPago es requerido")
		return
	}

	validMetodos := map[string]bool{
		"TRANSFERENCIA_BANCARIA": true, "PAGO_MOVIL": true, "ZELLE": true,
		"EFECTIVO_FARMATODO": true, "EFECTIVO": true, "WALLET": true,
	}
	if !validMetodos[req.MetodoPago] {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_METODO", "metodo de pago invalido")
		return
	}

	moneda := enums.Moneda(req.Moneda)
	if moneda != enums.MonedaUSD && moneda != enums.MonedaVES {
		moneda = enums.MonedaUSD
	}

	pagoID, err := h.svc.RegistrarPagoSimple(r.Context(), req.ReservaID, userID, req.Monto, moneda, enums.MetodoPagoEnum(req.MetodoPago), req.Referencia)
	if err != nil {
		mapError(w, err, "[pagos/registrar] error")
		return
	}

	JSON(w, http.StatusCreated, IDMensajeResponse{
		ID:      pagoID,
		Mensaje: "Pago registrado exitosamente",
	})
}

type registrarPagoComprobanteRequest struct {
	ReservaID      string  `json:"reservaId"`
	Monto          float64 `json:"monto"`
	Moneda         string  `json:"moneda"`
	MetodoPago     string  `json:"metodoPago"`
	Referencia     string  `json:"referencia"`
	ComprobanteURL *string `json:"comprobanteUrl"`
	BancoEmisor    *string `json:"bancoEmisor"`
	TelefonoEmisor *string `json:"telefonoEmisor"`
}

func (h *PagoHandler) RegistrarConComprobante(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req registrarPagoComprobanteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_RESERVA_ID", "reservaId es requerido")
		return
	}
	if req.Monto <= 0 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_MONTO", "monto debe ser mayor a 0")
		return
	}
	if req.MetodoPago == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_METODO", "metodoPago es requerido")
		return
	}

	moneda := enums.Moneda(req.Moneda)
	if moneda != enums.MonedaUSD && moneda != enums.MonedaVES {
		moneda = enums.MonedaUSD
	}

	pagoID, err := h.svc.RegistrarPagoConComprobante(r.Context(), req.ReservaID, userID, req.Monto, moneda, enums.MetodoPagoEnum(req.MetodoPago), req.Referencia, req.ComprobanteURL, req.BancoEmisor, req.TelefonoEmisor)
	if err != nil {
		mapError(w, err, "[pagos/registrar-comprobante] error")
		return
	}

	JSON(w, http.StatusCreated, IDMensajeResponse{
		ID:      pagoID,
		Mensaje: "Pago registrado exitosamente",
	})
}

type verificarPagoRequest struct {
	Aprobado bool    `json:"aprobado"`
	Notas    *string `json:"notas"`
}

func (h *PagoHandler) Verificar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	pagoID := chi.URLParam(r, "id")
	if pagoID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de pago requerido")
		return
	}

	var req verificarPagoRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if err := h.svc.Verificar(r.Context(), pagoID, userID, req.Aprobado, req.Notas); err != nil {
		mapError(w, err, "[pagos/verificar] error", "pagoId", pagoID)
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{
		Ok:      true,
		Mensaje: "Pago verificado exitosamente",
	})
}

func (h *PagoHandler) MisPagos(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	pagos, err := h.svc.GetMisPagos(r.Context(), userID)
	if err != nil {
		mapError(w, err, "[pagos/mis-pagos]", "userId", userID)
		return
	}

	JSON(w, http.StatusOK, pagos)
}

type subirComprobanteRequest struct {
	ReservaID string `json:"reservaId"`
	Base64    string `json:"comprobanteBase64"`
	Ext       string `json:"comprobanteExt"`
}

func (h *PagoHandler) SubirComprobante(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req subirComprobanteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" || req.Base64 == "" || req.Ext == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "reservaId, comprobanteBase64 y comprobanteExt son requeridos")
		return
	}

	fileBytes, err := base64.StdEncoding.DecodeString(req.Base64)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BASE64", "comprobanteBase64 no es base64 valido")
		return
	}

	ext := strings.TrimPrefix(req.Ext, ".")
	contentType := "image/jpeg"
	if ext == "png" {
		contentType = "image/png"
	} else if ext == "webp" {
		contentType = "image/webp"
	}

	path := fmt.Sprintf("comprobantes/%s/%s.%s", userID, req.ReservaID, ext)
	publicURL, err := h.authClient.UploadStorage(r.Context(), h.supabaseURL, h.serviceKey, "pagos", path, fileBytes, contentType)
	if err != nil {
		mapError(w, err, "[pagos/subir-comprobante]", "userId", userID)
		return
	}

	JSON(w, http.StatusOK, OKURLResponse{
		Ok:  true,
		URL: publicURL,
	})
}

type storeItemJSON struct {
	TipoItem       string  `json:"tipo_item"`
	Nombre         string  `json:"nombre"`
	Cantidad       int     `json:"cantidad"`
	PrecioUnitario float64 `json:"precio_unitario"`
	Moneda         string  `json:"moneda"`
	Subtotal       float64 `json:"subtotal"`
	ProductoID     *string `json:"producto_id"`
	ServicioID     *string `json:"servicio_id"`
}

type agregarStoreItemsRequest struct {
	ReservaID string          `json:"reservaId"`
	Items     []storeItemJSON `json:"items"`
}

func (h *PagoHandler) AgregarStoreItems(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req agregarStoreItemsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.ReservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_RESERVA_ID", "reservaId es requerido")
		return
	}
	if len(req.Items) == 0 {
		JSON(w, http.StatusOK, StoreItemsResponse{Ok: true, Mensaje: "sin items"})
		return
	}

	items := make([]repository.StoreItemInput, len(req.Items))
	for i, it := range req.Items {
		items[i] = repository.StoreItemInput{
			ReservaID:      req.ReservaID,
			TipoItem:       it.TipoItem,
			Nombre:         it.Nombre,
			Cantidad:       it.Cantidad,
			PrecioUnitario: it.PrecioUnitario,
			Moneda:         it.Moneda,
			Subtotal:       it.Subtotal,
			ProductoID:     it.ProductoID,
			ServicioID:     it.ServicioID,
		}
	}

	if err := h.storeItemRepo.InsertBatch(r.Context(), items); err != nil {
		mapError(w, err, "[pagos/store-items]", "reservaId", req.ReservaID)
		return
	}

	JSON(w, http.StatusCreated, StoreItemsResponse{
		Ok:      true,
		Mensaje: fmt.Sprintf("%d items guardados", len(items)),
	})
}
