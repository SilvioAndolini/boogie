package admin

import (
	"encoding/json"
	"time"
)

type AdminUser struct {
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	Nombre           string    `json:"nombre"`
	Apellido         string    `json:"apellido"`
	Telefono         *string   `json:"telefono"`
	Cedula           *string   `json:"cedula"`
	AvatarURL        *string   `json:"avatar_url"`
	Verificado       bool      `json:"verificado"`
	Rol              string    `json:"rol"`
	Activo           bool      `json:"activo"`
	FechaRegistro    time.Time `json:"fecha_registro"`
	PlanSuscripcion  string    `json:"plan_suscripcion"`
	Reputacion       float64   `json:"reputacion"`
	ReputacionManual bool      `json:"reputacion_manual"`
}

type AdminUserShort struct {
	ID        string  `json:"id"`
	Nombre    string  `json:"nombre"`
	Apellido  string  `json:"apellido"`
	Email     string  `json:"email"`
	AvatarURL *string `json:"avatar_url"`
}

type AdminUserFull struct {
	ID        string  `json:"id"`
	Nombre    string  `json:"nombre"`
	Apellido  string  `json:"apellido"`
	Email     string  `json:"email"`
	Telefono  *string `json:"telefono"`
	Cedula    *string `json:"cedula"`
	AvatarURL *string `json:"avatar_url"`
}

type AdminReserva struct {
	ID                 string               `json:"id"`
	Codigo             string               `json:"codigo"`
	FechaEntrada       time.Time            `json:"fecha_entrada"`
	FechaSalida        time.Time            `json:"fecha_salida"`
	Noches             int                  `json:"noches"`
	PrecioPorNoche     float64              `json:"precio_por_noche"`
	Subtotal           float64              `json:"subtotal"`
	ComisionPlataforma float64              `json:"comision_plataforma"`
	ComisionAnfitrion  *float64             `json:"comision_anfitrion"`
	Total              float64              `json:"total"`
	Moneda             string               `json:"moneda"`
	Estado             string               `json:"estado"`
	CantidadHuespedes  int                  `json:"cantidad_huespedes"`
	NotasHuesped       *string              `json:"notas_huesped"`
	NotasInternas      *string              `json:"notas_internas"`
	FechaCreacion      time.Time            `json:"fecha_creacion"`
	FechaConfirmacion  *time.Time           `json:"fecha_confirmacion"`
	FechaCancelacion   *time.Time           `json:"fecha_cancelacion"`
	Propiedad          *AdminPropiedadFull  `json:"propiedad"`
	Huesped            *AdminUserFull       `json:"huesped"`
	Pagos              []AdminPagoReserva   `json:"pagos"`
	Timeline           []AdminTimelineEntry `json:"timeline"`
}

type AdminReservaListItem struct {
	ID                 string               `json:"id"`
	Codigo             string               `json:"codigo"`
	FechaEntrada       time.Time            `json:"fecha_entrada"`
	FechaSalida        time.Time            `json:"fecha_salida"`
	Noches             int                  `json:"noches"`
	PrecioPorNoche     float64              `json:"precio_por_noche"`
	Subtotal           float64              `json:"subtotal"`
	ComisionPlataforma float64              `json:"comision_plataforma"`
	Total              float64              `json:"total"`
	Moneda             string               `json:"moneda"`
	Estado             string               `json:"estado"`
	CantidadHuespedes  int                  `json:"cantidad_huespedes"`
	NotasHuesped       *string              `json:"notas_huesped"`
	NotasInternas      *string              `json:"notas_internas"`
	FechaCreacion      time.Time            `json:"fecha_creacion"`
	FechaConfirmacion  *time.Time           `json:"fecha_confirmacion"`
	FechaCancelacion   *time.Time           `json:"fecha_cancelacion"`
	Propiedad          *AdminPropiedadShort `json:"propiedad"`
	Huesped            *AdminUserShort      `json:"huesped"`
}

type AdminReservaShort struct {
	ID     string `json:"id"`
	Codigo string `json:"codigo"`
	Estado string `json:"estado"`
}

type AdminPropiedadShort struct {
	ID     string `json:"id"`
	Titulo string `json:"titulo"`
	Slug   string `json:"slug"`
	Ciudad string `json:"ciudad"`
	Estado string `json:"estado"`
}

type AdminPropiedadFull struct {
	ID          string                 `json:"id"`
	Titulo      string                 `json:"titulo"`
	Slug        string                 `json:"slug"`
	Ciudad      string                 `json:"ciudad"`
	Estado      string                 `json:"estado"`
	Direccion   *string                `json:"direccion"`
	Propietario *AdminPropietarioShort `json:"propietario"`
}

type AdminPropietarioShort struct {
	ID       string  `json:"id"`
	Nombre   string  `json:"nombre"`
	Apellido string  `json:"apellido"`
	Email    string  `json:"email"`
	Telefono *string `json:"telefono"`
}

type AdminPropiedad struct {
	ID                 string          `json:"id"`
	Titulo             string          `json:"titulo"`
	Slug               string          `json:"slug"`
	TipoPropiedad      string          `json:"tipo_propiedad"`
	PrecioPorNoche     float64         `json:"precio_por_noche"`
	Moneda             string          `json:"moneda"`
	CapacidadMaxima    int             `json:"capacidad_maxima"`
	Habitaciones       *int            `json:"habitaciones"`
	Banos              *int            `json:"banos"`
	Camas              *int            `json:"camas"`
	Ciudad             string          `json:"ciudad"`
	Estado             string          `json:"estado"`
	Direccion          *string         `json:"direccion"`
	EstadoPublicacion  string          `json:"estado_publicacion"`
	Destacada          bool            `json:"destacada"`
	FechaPublicacion   *time.Time      `json:"fecha_publicacion"`
	FechaActualizacion time.Time       `json:"fecha_actualizacion"`
	VistasTotales      int             `json:"vistas_totales"`
	RatingPromedio     float64         `json:"rating_promedio"`
	TotalResenas       int             `json:"total_resenas"`
	Imagenes           json.RawMessage `json:"imagenes"`
	Propietario        *AdminUserShort `json:"propietario"`
}

type AdminPago struct {
	ID                string             `json:"id"`
	Monto             float64            `json:"monto"`
	Moneda            string             `json:"moneda"`
	MontoEquivalente  *float64           `json:"monto_equivalente"`
	MonedaEquivalente *string            `json:"moneda_equivalente"`
	TasaCambio        *float64           `json:"tasa_cambio"`
	MetodoPago        string             `json:"metodo_pago"`
	Referencia        string             `json:"referencia"`
	Comprobante       *string            `json:"comprobante"`
	Estado            string             `json:"estado"`
	FechaCreacion     time.Time          `json:"fecha_creacion"`
	FechaVerificacion *time.Time         `json:"fecha_verificacion"`
	FechaAcreditacion *time.Time         `json:"fecha_acreditacion"`
	NotasVerificacion *string            `json:"notas_verificacion"`
	Reserva           *AdminReservaShort `json:"reserva"`
	Usuario           *AdminUserShort    `json:"usuario"`
}

type AdminPagoReserva struct {
	ID                string     `json:"id"`
	Monto             float64    `json:"monto"`
	Moneda            string     `json:"moneda"`
	MetodoPago        string     `json:"metodo_pago"`
	Referencia        string     `json:"referencia"`
	Comprobante       *string    `json:"comprobante"`
	Estado            string     `json:"estado"`
	FechaCreacion     time.Time  `json:"fecha_creacion"`
	FechaVerificacion *time.Time `json:"fecha_verificacion"`
	NotasVerificacion *string    `json:"notas_verificacion"`
}

type AdminTimelineEntry struct {
	Accion   string                 `json:"accion"`
	CreadoEn time.Time              `json:"creado_en"`
	Detalles map[string]interface{} `json:"detalles"`
	Admin    *AdminTimelineAdmin    `json:"admin"`
}

type AdminTimelineAdmin struct {
	Nombre   string `json:"nombre"`
	Apellido string `json:"apellido"`
	Email    string `json:"email"`
}

type AdminResena struct {
	ID             string               `json:"id"`
	Calificacion   int                  `json:"calificacion"`
	Limpieza       *int                 `json:"limpieza"`
	Comunicacion   *int                 `json:"comunicacion"`
	Ubicacion      *int                 `json:"ubicacion"`
	Valor          *int                 `json:"valor"`
	Comentario     string               `json:"comentario"`
	Respuesta      *string              `json:"respuesta"`
	FechaCreacion  time.Time            `json:"fecha_creacion"`
	FechaRespuesta *time.Time           `json:"fecha_respuesta"`
	Oculta         bool                 `json:"oculta"`
	Propiedad      *AdminPropiedadShort `json:"propiedad"`
	Autor          *AdminUserShort      `json:"autor"`
	Reserva        *AdminReservaShort   `json:"reserva"`
}

type Cupon struct {
	ID                string    `json:"id"`
	Codigo            string    `json:"codigo"`
	Nombre            string    `json:"nombre"`
	Descripcion       *string   `json:"descripcion"`
	TipoDescuento     string    `json:"tipo_descuento"`
	ValorDescuento    float64   `json:"valor_descuento"`
	Moneda            string    `json:"moneda"`
	MaxDescuento      *float64  `json:"max_descuento"`
	TipoAplicacion    string    `json:"tipo_aplicacion"`
	ValorAplicacion   *string   `json:"valor_aplicacion"`
	MinCompra         *float64  `json:"min_compra"`
	MinNoches         *int      `json:"min_noches"`
	MaxUsos           *int      `json:"max_usos"`
	MaxUsosPorUsuario int       `json:"max_usos_por_usuario"`
	UsosActuales      int       `json:"usos_actuales"`
	FechaInicio       time.Time `json:"fecha_inicio"`
	FechaFin          time.Time `json:"fecha_fin"`
	Activo            bool      `json:"activo"`
	CreadoPor         *string   `json:"creado_por"`
	FechaCreacion     time.Time `json:"fecha_creacion"`
}

type CuponUso struct {
	ID                string             `json:"id"`
	CuponID           string             `json:"cupon_id"`
	UsuarioID         string             `json:"usuario_id"`
	ReservaID         string             `json:"reserva_id"`
	DescuentoAplicado float64            `json:"descuento_aplicado"`
	FechaUso          time.Time          `json:"fecha_uso"`
	Usuario           *AdminUserShort    `json:"usuario"`
	Cupon             *CuponShort        `json:"cupon"`
	Reserva           *AdminReservaShort `json:"reserva"`
}

type CuponShort struct {
	Codigo string `json:"codigo"`
	Nombre string `json:"nombre"`
}

type CuponActivoUsuario struct {
	Cupon
	VecesUsado int `json:"veces_usado"`
}

type AuditLog struct {
	ID        string          `json:"id"`
	AdminID   string          `json:"admin_id"`
	Accion    string          `json:"accion"`
	Entidad   string          `json:"entidad"`
	EntidadID *string         `json:"entidad_id"`
	Detalles  *string         `json:"detalles"`
	IP        *string         `json:"ip"`
	UserAgent *string         `json:"user_agent"`
	CreatedAt time.Time       `json:"created_at"`
	Admin     *AdminUserShort `json:"admin"`
}

type Notificacion struct {
	ID            string          `json:"id"`
	Tipo          string          `json:"tipo"`
	Titulo        string          `json:"titulo"`
	Mensaje       string          `json:"mensaje"`
	Leida         bool            `json:"leida"`
	URLAccion     *string         `json:"url_accion"`
	FechaCreacion time.Time       `json:"fecha_creacion"`
	Usuario       *AdminUserShort `json:"usuario"`
}
