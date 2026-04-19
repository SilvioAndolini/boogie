package handler

import (
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
)

const storeImagenMaxSize = 5 << 20

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
		mapError(w, err, "[admin/store/productos/crear]")
		return
	}
	h.auditLog(r, "", "crear_producto_store", "producto", nil, map[string]interface{}{"nombre": req.Nombre, "precio": req.Precio})
	JSON(w, http.StatusCreated, OKResponse{Ok: true})
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
		mapError(w, err, "[admin/store/productos/actualizar]")
		return
	}
	h.auditLog(r, "", "actualizar_producto_store", "producto", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) EliminarProductoStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.tiendaSvc.EliminarProducto(r.Context(), id); err != nil {
		mapError(w, err, "[admin/store/productos/eliminar]")
		return
	}
	h.auditLog(r, "", "eliminar_producto_store", "producto", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
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
		mapError(w, err, "[admin/store/servicios/crear]")
		return
	}
	h.auditLog(r, "", "crear_servicio_store", "servicio", nil, map[string]interface{}{"nombre": req.Nombre, "precio": req.Precio})
	JSON(w, http.StatusCreated, OKResponse{Ok: true})
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
		mapError(w, err, "[admin/store/servicios/actualizar]")
		return
	}
	h.auditLog(r, "", "actualizar_servicio_store", "servicio", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) EliminarServicioStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}
	id := chi.URLParam(r, "id")
	if err := h.tiendaSvc.EliminarServicio(r.Context(), id); err != nil {
		mapError(w, err, "[admin/store/servicios/eliminar]")
		return
	}
	h.auditLog(r, "", "eliminar_servicio_store", "servicio", &id, nil)
	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AdminHandler) SubirImagenStore(w http.ResponseWriter, r *http.Request) {
	if ok, _, _ := requireAdmin(w, r); !ok {
		return
	}

	if h.storage == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Storage no configurado")
		return
	}

	if err := r.ParseMultipartForm(storeImagenMaxSize); err != nil {
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
		mapError(w, err, "[admin/store/upload-imagen]")
		return
	}

	h.auditLog(r, "", "subir_imagen_store", "store_imagen", nil, map[string]interface{}{"path": storagePath})
	JSON(w, http.StatusOK, OKURLResponse{Ok: true, URL: publicURL})
}
