package models

import (
	"time"

	"github.com/boogie/backend/internal/domain/enums"
)

type Usuario struct {
	ID              string                `json:"id"`
	Email           string                `json:"email"`
	Nombre          string                `json:"nombre"`
	Apellido        string                `json:"apellido"`
	TipoDocumento   string                `json:"tipo_documento"`
	NumeroDocumento string                `json:"numero_documento"`
	Telefono        *string               `json:"telefono"`
	CodigoPais      *string               `json:"codigo_pais"`
	AvatarURL       *string               `json:"avatar_url"`
	Verificado      bool                  `json:"verificado"`
	Rol             enums.Rol             `json:"rol"`
	PlanSuscripcion enums.PlanSuscripcion `json:"plan_suscripcion"`
	Activo          bool                  `json:"activo"`
	Reputacion      float64               `json:"reputacion"`
	CantidadResenas int                   `json:"cantidad_resenas"`
	Instagram       *string               `json:"instagram"`
	Tiktok          *string               `json:"tiktok"`
	Biografia       *string               `json:"biografia"`
	FechaNacimiento *time.Time            `json:"fecha_nacimiento"`
	CreatedAt       time.Time             `json:"created_at"`
	UpdatedAt       time.Time             `json:"updated_at"`
}

type Propiedad struct {
	ID                  string                    `json:"id"`
	PropietarioID       string                    `json:"propietario_id"`
	Titulo              string                    `json:"titulo"`
	Slug                string                    `json:"slug"`
	Descripcion         string                    `json:"descripcion"`
	TipoPropiedad       enums.TipoPropiedad       `json:"tipo_propiedad"`
	PrecioPorNoche      float64                   `json:"precio_por_noche"`
	Moneda              enums.Moneda              `json:"moneda"`
	PoliticaCancelacion enums.PoliticaCancelacion `json:"politica_cancelacion"`
	Capacidad           int                       `json:"capacidad"`
	Dormitorios         int                       `json:"dormitorios"`
	Banos               int                       `json:"banos"`
	Camas               int                       `json:"camas"`
	Direccion           string                    `json:"direccion"`
	Ciudad              string                    `json:"ciudad"`
	Estado              string                    `json:"estado"`
	Zona                *string                   `json:"zona"`
	Pais                *string                   `json:"pais"`
	Latitud             float64                   `json:"latitud"`
	Longitud            float64                   `json:"longitud"`
	CodigoPostal        *string                   `json:"codigo_postal"`
	Reglas              *string                   `json:"reglas"`
	CheckIn             *string                   `json:"check_in"`
	CheckOut            *string                   `json:"check_out"`
	EstanciaMinima      int                       `json:"estancia_minima"`
	EstanciaMaxima      *int                      `json:"estancia_maxima"`
	EstadoPublicacion   enums.EstadoPublicacion   `json:"estado_publicacion"`
	Destacada           bool                      `json:"destacada"`
	FechaPublicacion    *time.Time                `json:"fecha_publicacion"`
	FechaActualizacion  time.Time                 `json:"fecha_actualizacion"`
	VistasTotales       int                       `json:"vistas_totales"`
	Calificacion        float64                   `json:"calificacion"`
	CantidadResenas     int                       `json:"cantidad_resenas"`
	Imagenes            []ImagenPropiedad         `json:"imagenes"`
	CreatedAt           time.Time                 `json:"created_at"`
	UpdatedAt           time.Time                 `json:"updated_at"`
	Categoria           enums.CategoriaPropiedad  `json:"categoria"`
	TipoCancha          *enums.TipoCancha         `json:"tipo_cancha"`
	PrecioPorHora       *float64                  `json:"precio_por_hora"`
	HoraApertura        *string                   `json:"hora_apertura"`
	HoraCierre          *string                   `json:"hora_cierre"`
	DuracionMinimaMin   *int                      `json:"duracion_minima_min"`
	EsExpress           bool                      `json:"es_express"`
	PrecioExpress       *float64                  `json:"precio_express"`
	ModoReserva         enums.ModoReserva         `json:"modo_reserva"`
}

type ImagenPropiedad struct {
	ID           string  `json:"id"`
	PropiedadID  string  `json:"propiedad_id"`
	URL          string  `json:"url"`
	ThumbnailURL *string `json:"thumbnail_url"`
	Alt          *string `json:"alt"`
	Categoria    string  `json:"categoria"`
	Orden        int     `json:"orden"`
	EsPrincipal  *bool   `json:"es_principal"`
}

type Amenidad struct {
	ID        string `json:"id"`
	Nombre    string `json:"nombre"`
	Icono     string `json:"icono"`
	Categoria string `json:"categoria"`
}

type Reserva struct {
	ID                 string              `json:"id"`
	Codigo             string              `json:"codigo"`
	PropiedadID        string              `json:"propiedad_id"`
	HuespedID          string              `json:"huesped_id"`
	FechaEntrada       time.Time           `json:"fecha_entrada"`
	FechaSalida        time.Time           `json:"fecha_salida"`
	Noches             int                 `json:"noches"`
	PrecioPorNoche     float64             `json:"precio_por_noche"`
	Subtotal           float64             `json:"subtotal"`
	ComisionPlataforma float64             `json:"comision_plataforma"`
	ComisionAnfitrion  float64             `json:"comision_anfitrion"`
	Total              float64             `json:"total"`
	Moneda             enums.Moneda        `json:"moneda"`
	CantidadHuespedes  int                 `json:"cantidad_huespedes"`
	Estado             enums.EstadoReserva `json:"estado"`
	NotasHuesped       *string             `json:"notas_huesped"`
	CanceladaEn        *time.Time          `json:"cancelada_en"`
	MotivoCancelacion  *string             `json:"motivo_cancelacion"`
	FechaConfirmacion  *time.Time          `json:"fecha_confirmacion"`
	CreatedAt          time.Time           `json:"created_at"`
}

type Pago struct {
	ID                  string               `json:"id"`
	ReservaID           *string              `json:"reserva_id"`
	UsuarioID           string               `json:"usuario_id"`
	Monto               float64              `json:"monto"`
	Moneda              enums.Moneda         `json:"moneda"`
	MetodoPago          enums.MetodoPagoEnum `json:"metodo_pago"`
	Estado              enums.EstadoPago     `json:"estado"`
	Referencia          string               `json:"referencia"`
	ComprobanteURL      *string              `json:"comprobante_url"`
	BancoEmisor         *string              `json:"banco_emisor"`
	TelefonoEmisor      *string              `json:"telefono_emisor"`
	Notas               *string              `json:"notas"`
	VerificadoPor       *string              `json:"verificado_por"`
	FechaVerificacion   *time.Time           `json:"fecha_verificacion"`
	CryptoAddress       *string              `json:"crypto_address"`
	CryptoTxHash        *string              `json:"crypto_tx_hash"`
	CryptoConfirmations *int                 `json:"crypto_confirmations"`
	CryptoValueCoin     *float64             `json:"crypto_value_coin"`
	CreatedAt           time.Time            `json:"created_at"`
}

type Resena struct {
	ID             string     `json:"id"`
	ReservaID      string     `json:"reserva_id"`
	PropiedadID    string     `json:"propiedad_id"`
	AutorID        string     `json:"autor_id"`
	Calificacion   int        `json:"calificacion"`
	Limpieza       *int       `json:"limpieza"`
	Comunicacion   *int       `json:"comunicacion"`
	Ubicacion      *int       `json:"ubicacion"`
	Valor          *int       `json:"valor"`
	Comentario     string     `json:"comentario"`
	Respuesta      *string    `json:"respuesta"`
	FechaRespuesta *time.Time `json:"fecha_respuesta"`
	Oculta         bool       `json:"oculta"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CotizacionEuro struct {
	Tasa                float64   `json:"tasa"`
	Fuente              string    `json:"fuente"`
	UltimaActualizacion time.Time `json:"ultima_actualizacion"`
}

type LocationSuggestion struct {
	ID      string  `json:"id"`
	Nombre  string  `json:"nombre"`
	Detalle string  `json:"detalle"`
	Tipo    string  `json:"tipo"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
}
