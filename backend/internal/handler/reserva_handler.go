package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ReservaHandler struct {
	svc       *service.ReservaService
	disponSvc *service.ReservaDisponibilidad
}

func NewReservaHandler(svc *service.ReservaService, disponSvc *service.ReservaDisponibilidad) *ReservaHandler {
	return &ReservaHandler{svc: svc, disponSvc: disponSvc}
}

type crearReservaRequest struct {
	PropiedadID       string  `json:"propiedadId"`
	FechaEntrada      string  `json:"fechaEntrada"`
	FechaSalida       string  `json:"fechaSalida"`
	CantidadHuespedes int     `json:"cantidadHuespedes"`
	NotasHuesped      *string `json:"notasHuesped"`
	CuponCodigo       string  `json:"cuponCodigo"`
	StoreItems        []struct {
		TipoItem       string  `json:"tipo_item"`
		Nombre         string  `json:"nombre"`
		Cantidad       int     `json:"cantidad"`
		PrecioUnitario float64 `json:"precio_unitario"`
		Moneda         string  `json:"moneda"`
		Subtotal       float64 `json:"subtotal"`
		ProductoID     *string `json:"producto_id"`
		ServicioID     *string `json:"servicio_id"`
	} `json:"storeItems"`
}

func (h *ReservaHandler) Crear(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearReservaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.PropiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PROP_ID", "propiedadId es requerido")
		return
	}

	fechaEntrada, err := parseFlexibleDate(req.FechaEntrada)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_ENTRADA", "fechaEntrada invalida (formato: YYYY-MM-DD)")
		return
	}

	fechaSalida, err := parseFlexibleDate(req.FechaSalida)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_SALIDA", "fechaSalida invalida (formato: YYYY-MM-DD)")
		return
	}

	if req.CantidadHuespedes < 1 || req.CantidadHuespedes > 20 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_HUESPEDES", "cantidadHuespedes debe ser entre 1 y 20")
		return
	}

	var storeItems []repository.StoreItemInput
	for _, it := range req.StoreItems {
		storeItems = append(storeItems, repository.StoreItemInput{
			TipoItem:       it.TipoItem,
			Nombre:         it.Nombre,
			Cantidad:       it.Cantidad,
			PrecioUnitario: it.PrecioUnitario,
			Moneda:         it.Moneda,
			Subtotal:       it.Subtotal,
			ProductoID:     it.ProductoID,
			ServicioID:     it.ServicioID,
		})
	}

	result, err := h.svc.Crear(r.Context(), &service.CrearReservaInput{
		PropiedadID:       req.PropiedadID,
		HuespedID:         userID,
		FechaEntrada:      fechaEntrada,
		FechaSalida:       fechaSalida,
		CantidadHuespedes: req.CantidadHuespedes,
		NotasHuesped:      req.NotasHuesped,
		CuponCodigo:       req.CuponCodigo,
		StoreItems:        storeItems,
	})
	if err != nil {
		mapError(w, r, err, "[reservas/crear]", "userId", userID, "propId", req.PropiedadID)
		return
	}

	JSON(w, http.StatusCreated, CrearReservaResponse{
		ID:                 result.Reserva.ID,
		Codigo:             result.Reserva.Codigo,
		PropiedadID:        result.Reserva.PropiedadID,
		FechaEntrada:       result.Reserva.FechaEntrada,
		FechaSalida:        result.Reserva.FechaSalida,
		Noches:             result.Reserva.Noches,
		PrecioPorNoche:     result.Reserva.PrecioPorNoche,
		Subtotal:           result.Reserva.Subtotal,
		ComisionPlataforma: result.Reserva.ComisionPlataforma,
		ComisionAnfitrion:  result.Reserva.ComisionAnfitrion,
		Total:              result.Reserva.Total,
		Moneda:             result.Reserva.Moneda,
		CantidadHuespedes:  result.Reserva.CantidadHuespedes,
		Estado:             result.Reserva.Estado,
	})
}

type crearReservaConPagoRequest struct {
	PropiedadID       string  `json:"propiedadId"`
	FechaEntrada      string  `json:"fechaEntrada"`
	FechaSalida       string  `json:"fechaSalida"`
	CantidadHuespedes int     `json:"cantidadHuespedes"`
	NotasHuesped      *string `json:"notasHuesped"`
	Monto             float64 `json:"monto"`
	Moneda            string  `json:"moneda"`
	MetodoPago        string  `json:"metodoPago"`
	Referencia        string  `json:"referencia"`
	ComprobanteURL    *string `json:"comprobanteUrl"`
	BancoEmisor       *string `json:"bancoEmisor"`
	TelefonoEmisor    *string `json:"telefonoEmisor"`
	CuponCodigo       string  `json:"cuponCodigo"`
	StoreItems        []struct {
		TipoItem       string  `json:"tipo_item"`
		Nombre         string  `json:"nombre"`
		Cantidad       int     `json:"cantidad"`
		PrecioUnitario float64 `json:"precio_unitario"`
		Moneda         string  `json:"moneda"`
		Subtotal       float64 `json:"subtotal"`
		ProductoID     *string `json:"producto_id"`
		ServicioID     *string `json:"servicio_id"`
	} `json:"storeItems"`
}

func (h *ReservaHandler) CrearConPago(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req crearReservaConPagoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.PropiedadID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PROP_ID", "propiedadId es requerido")
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

	fechaEntrada, err := parseFlexibleDate(req.FechaEntrada)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_ENTRADA", "fechaEntrada invalida")
		return
	}
	fechaSalida, err := parseFlexibleDate(req.FechaSalida)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA_SALIDA", "fechaSalida invalida")
		return
	}
	if req.CantidadHuespedes < 1 || req.CantidadHuespedes > 20 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_HUESPEDES", "cantidadHuespedes debe ser entre 1 y 20")
		return
	}

	moneda := enums.Moneda(req.Moneda)
	if moneda != enums.MonedaUSD && moneda != enums.MonedaVES {
		moneda = enums.MonedaUSD
	}

	var storeItems []repository.StoreItemInput
	for _, it := range req.StoreItems {
		storeItems = append(storeItems, repository.StoreItemInput{
			TipoItem:       it.TipoItem,
			Nombre:         it.Nombre,
			Cantidad:       it.Cantidad,
			PrecioUnitario: it.PrecioUnitario,
			Moneda:         it.Moneda,
			Subtotal:       it.Subtotal,
			ProductoID:     it.ProductoID,
			ServicioID:     it.ServicioID,
		})
	}

	result, err := h.svc.CrearConPago(r.Context(), &service.CrearConPagoInput{
		PropiedadID:       req.PropiedadID,
		HuespedID:         userID,
		FechaEntrada:      fechaEntrada,
		FechaSalida:       fechaSalida,
		CantidadHuespedes: req.CantidadHuespedes,
		NotasHuesped:      req.NotasHuesped,
		Monto:             req.Monto,
		Moneda:            moneda,
		MetodoPago:        enums.MetodoPagoEnum(req.MetodoPago),
		Referencia:        req.Referencia,
		ComprobanteURL:    req.ComprobanteURL,
		BancoEmisor:       req.BancoEmisor,
		TelefonoEmisor:    req.TelefonoEmisor,
		StoreItems:        storeItems,
		CuponCodigo:       req.CuponCodigo,
	})
	if err != nil {
		mapError(w, r, err, "[reservas/crear-con-pago]", "userId", userID, "propId", req.PropiedadID)
		return
	}

	JSON(w, http.StatusCreated, CrearReservaConPagoResponse{
		ID:                 result.Reserva.ID,
		Codigo:             result.Reserva.Codigo,
		PropiedadID:        result.Reserva.PropiedadID,
		FechaEntrada:       result.Reserva.FechaEntrada,
		FechaSalida:        result.Reserva.FechaSalida,
		Noches:             result.Reserva.Noches,
		PrecioPorNoche:     result.Reserva.PrecioPorNoche,
		Subtotal:           result.Reserva.Subtotal,
		ComisionPlataforma: result.Reserva.ComisionPlataforma,
		ComisionAnfitrion:  result.Reserva.ComisionAnfitrion,
		Total:              result.Reserva.Total,
		Moneda:             result.Reserva.Moneda,
		CantidadHuespedes:  result.Reserva.CantidadHuespedes,
		Estado:             result.Reserva.Estado,
		CuponID:            result.Reserva.CuponID,
		Descuento:          result.Reserva.Descuento,
	})
}

func (h *ReservaHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	detalle, err := h.svc.GetByID(r.Context(), reservaID, userID)
	if err != nil {
		mapError(w, r, err, "[reservas/get-by-id]", "reservaId", reservaID)
		return
	}

	JSON(w, http.StatusOK, detalle)
}

func (h *ReservaHandler) MisReservas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	page, perPage := getPagination(r)

	reservas, total, err := h.svc.ListByHuesped(r.Context(), userID, page, perPage)
	if err != nil {
		mapError(w, r, err, "[reservas/mis]", "userId", userID)
		return
	}

	if reservas == nil {
		reservas = []repository.ReservaConPropiedad{}
	}

	JSONWithMeta(w, http.StatusOK, reservas, Meta{
		Page:    page,
		PerPage: perPage,
		Total:   total,
	})
}

func (h *ReservaHandler) ReservasRecibidas(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	page, perPage := getPagination(r)
	estado := r.URL.Query().Get("estado")

	reservas, total, err := h.svc.ListByPropietario(r.Context(), userID, estado, page, perPage)
	if err != nil {
		mapError(w, r, err, "[reservas/recibidas]", "userId", userID)
		return
	}

	if reservas == nil {
		reservas = []repository.ReservaConHuesped{}
	}

	JSONWithMeta(w, http.StatusOK, reservas, Meta{
		Page:    page,
		PerPage: perPage,
		Total:   total,
	})
}

type confirmarRechazarRequest struct {
	Accion string  `json:"accion"`
	Motivo *string `json:"motivo"`
}

func (h *ReservaHandler) ConfirmarORechazar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	var req confirmarRechazarRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	if req.Accion != "confirmar" && req.Accion != "rechazar" {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_ACCION", "accion debe ser 'confirmar' o 'rechazar'")
		return
	}

	err := h.svc.ConfirmarORechazar(r.Context(), reservaID, userID, service.TransicionEstado(req.Accion), req.Motivo)
	if err != nil {
		mapError(w, r, err, "[reservas/confirmar-rechazar]", "reservaId", reservaID)
		return
	}

	JSON(w, http.StatusOK, ConfirmarRechazarResponse{
		Ok:      true,
		Mensaje: fmt.Sprintf("Reserva %s exitosamente", req.Accion),
	})
}

type cancelarRequest struct {
	Motivo *string `json:"motivo"`
}

func (h *ReservaHandler) Cancelar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	var req cancelarRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}

	reembolso, err := h.svc.Cancelar(r.Context(), &service.CancelarInput{
		ReservaID: reservaID,
		UserID:    userID,
		Motivo:    req.Motivo,
	})
	if err != nil {
		mapError(w, r, err, "[reservas/cancelar]", "reservaId", reservaID)
		return
	}

	resp := CancelarReservaResponse{
		Ok:      true,
		Mensaje: "Reserva cancelada exitosamente",
	}
	if reembolso != nil {
		resp.Reembolso = reembolso
	}

	JSON(w, http.StatusOK, resp)
}

func (h *ReservaHandler) Disponibilidad(w http.ResponseWriter, r *http.Request) {
	propID := r.URL.Query().Get("propiedadId")
	fe := r.URL.Query().Get("fechaEntrada")
	fs := r.URL.Query().Get("fechaSalida")

	if propID == "" || fe == "" || fs == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "propiedadId, fechaEntrada y fechaSalida son requeridos")
		return
	}

	fechaEntrada, err := parseFlexibleDate(fe)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaEntrada invalida")
		return
	}
	fechaSalida, err := parseFlexibleDate(fs)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaSalida invalida")
		return
	}

	result, err := h.disponSvc.Verificar(r.Context(), propID, fechaEntrada, fechaSalida)
	if err != nil {
		mapError(w, r, err, "[reservas/disponibilidad]")
		return
	}

	JSON(w, http.StatusOK, DisponibilidadResponse{
		Disponible: result.Disponible,
	})
}

func (h *ReservaHandler) FechasOcupadas(w http.ResponseWriter, r *http.Request) {
	propID := r.URL.Query().Get("propiedadId")
	if propID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "propiedadId es requerido")
		return
	}

	fechas, err := h.disponSvc.ObtenerFechasOcupadas(r.Context(), propID)
	if err != nil {
		mapError(w, r, err, "[reservas/fechas-ocupadas]")
		return
	}

	JSON(w, http.StatusOK, fechas)
}

func (h *ReservaHandler) CalcularReembolso(w http.ResponseWriter, r *http.Request) {
	totalStr := r.URL.Query().Get("total")
	comisionStr := r.URL.Query().Get("comision")
	politica := r.URL.Query().Get("politica")
	fechaStr := r.URL.Query().Get("fechaEntrada")

	if totalStr == "" || comisionStr == "" || politica == "" || fechaStr == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "total, comision, politica y fechaEntrada son requeridos")
		return
	}

	total, err := strconv.ParseFloat(totalStr, 64)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_TOTAL", "total debe ser un numero")
		return
	}

	comision, err := strconv.ParseFloat(comisionStr, 64)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_COMISION", "comision debe ser un numero")
		return
	}

	fechaEntrada, err := time.Parse(time.RFC3339, fechaStr)
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_FECHA", "fechaEntrada debe ser ISO 8601")
		return
	}

	pol := enums.PoliticaCancelacion(strings.ToUpper(politica))
	result := service.CalcularReembolso(total, comision, pol, fechaEntrada)
	JSON(w, http.StatusOK, result)
}

func getPagination(r *http.Request) (page, perPage int) {
	page = 1
	perPage = 20

	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil && p > 0 {
		page = p
	}
	if pp, err := strconv.Atoi(r.URL.Query().Get("perPage")); err == nil && pp > 0 && pp <= 50 {
		perPage = pp
	}
	return
}

// parseFlexibleDate tries YYYY-MM-DD first, then RFC3339.
func parseFlexibleDate(s string) (time.Time, error) {
	t, err := time.Parse("2006-01-02", s)
	if err == nil {
		return t, nil
	}
	return time.Parse(time.RFC3339, s)
}


func (h *ReservaHandler) ExpirarPendientes(w http.ResponseWriter, r *http.Request) {
	expiradas, err := h.svc.ExpirarPendientes(r.Context())
	if err != nil {
		mapError(w, r, err, "[reservas/expirar-pendientes]")
		return
	}
	JSON(w, http.StatusOK, AutoConfirmarResponse{
		Ok:          true,
		Confirmadas: expiradas,
	})
}

func (h *ReservaHandler) EliminarPendientePago(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	reservaID := chi.URLParam(r, "id")
	if reservaID == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_ID", "ID de reserva requerido")
		return
	}

	if err := h.svc.EliminarPendientePago(r.Context(), reservaID, userID); err != nil {
		mapError(w, r, err, "[reservas/eliminar-pendiente]", "reservaId", reservaID)
		return
	}

	JSON(w, http.StatusOK, map[string]any{"ok": true})
}