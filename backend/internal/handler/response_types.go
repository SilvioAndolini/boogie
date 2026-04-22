package handler

import (
	"time"

	"github.com/boogie/backend/internal/domain/enums"
)

type OKResponse struct {
	Ok bool `json:"ok"`
}

type OKMensajeResponse struct {
	Ok      bool   `json:"ok"`
	Mensaje string `json:"mensaje"`
}

type OKURLResponse struct {
	Ok  bool   `json:"ok"`
	URL string `json:"url"`
}

type OKExpiradosResponse struct {
	Ok       bool `json:"ok"`
	Expirados int `json:"expirados"`
}

type IDMensajeResponse struct {
	ID      string `json:"id"`
	Mensaje string `json:"mensaje"`
}

type RegisterResponse struct {
	Ok      bool   `json:"ok"`
	UserID  string `json:"userId"`
	Mensaje string `json:"mensaje"`
}

type OAuthURLResponse struct {
	URL string `json:"url"`
}

type AvatarUploadResponse struct {
	Ok  bool   `json:"ok"`
	URL string `json:"url"`
}

type CrearReservaResponse struct {
	ID                 string             `json:"id"`
	Codigo             string             `json:"codigo"`
	PropiedadID        string             `json:"propiedadId"`
	FechaEntrada       time.Time          `json:"fechaEntrada"`
	FechaSalida        time.Time          `json:"fechaSalida"`
	Noches             int                `json:"noches"`
	PrecioPorNoche     float64            `json:"precioPorNoche"`
	Subtotal           float64            `json:"subtotal"`
	ComisionPlataforma float64            `json:"comisionPlataforma"`
	ComisionAnfitrion  float64            `json:"comisionAnfitrion"`
	Total              float64            `json:"total"`
	Moneda             enums.Moneda       `json:"moneda"`
	CantidadHuespedes  int                `json:"cantidadHuespedes"`
	Estado             enums.EstadoReserva `json:"estado"`
}

type CrearReservaConPagoResponse struct {
	ID                 string              `json:"id"`
	Codigo             string              `json:"codigo"`
	PropiedadID        string              `json:"propiedadId"`
	FechaEntrada       time.Time           `json:"fechaEntrada"`
	FechaSalida        time.Time           `json:"fechaSalida"`
	Noches             int                 `json:"noches"`
	PrecioPorNoche     float64             `json:"precioPorNoche"`
	Subtotal           float64             `json:"subtotal"`
	ComisionPlataforma float64             `json:"comisionPlataforma"`
	ComisionAnfitrion  float64             `json:"comisionAnfitrion"`
	Total              float64             `json:"total"`
	Moneda             enums.Moneda        `json:"moneda"`
	CantidadHuespedes  int                 `json:"cantidadHuespedes"`
	Estado             enums.EstadoReserva `json:"estado"`
	CuponID            *string             `json:"cuponId"`
	Descuento          float64             `json:"descuento"`
}

type CancelarReservaResponse struct {
	Ok       bool        `json:"ok"`
	Mensaje  string      `json:"mensaje"`
	Reembolso interface{} `json:"reembolso,omitempty"`
}

type DisponibilidadResponse struct {
	Disponible bool `json:"disponible"`
}

type ConfirmarRechazarResponse struct {
	Ok      bool   `json:"ok"`
	Mensaje string `json:"mensaje"`
}

type AutoConfirmarResponse struct {
	Ok           bool `json:"ok"`
	Confirmadas  int  `json:"confirmadas"`
}

type CryptoAddressResponse struct {
	Address   string  `json:"address"`
	ReservaID string  `json:"reservaId"`
	Ticker    string  `json:"ticker"`
	Network   string  `json:"network"`
	Currency  string  `json:"currency"`
	Amount    float64 `json:"amount"`
}

type CryptoVerifyResponse struct {
	Estado     string `json:"estado"`
	TxHash     string `json:"txHash"`
	Confirmado bool   `json:"confirmado"`
}

type CallbackOKResponse struct {
	Ok      bool   `json:"ok"`
	Message string `json:"message,omitempty"`
}

type DashboardPropiedadResponse struct {
	Propiedad        interface{} `json:"propiedad"`
	Gastos           interface{} `json:"gastos"`
	FechasBloqueadas interface{} `json:"fechasBloqueadas"`
	PreciosEspeciales interface{} `json:"preciosEspeciales"`
	Reservas         interface{} `json:"reservas"`
	Amenidades       interface{} `json:"amenidades"`
	KPIs             interface{} `json:"kpis"`
	IngresosByMonth  interface{} `json:"ingresosByMonth"`
	GastosByMonth    interface{} `json:"gastosByMonth"`
	Ocupadas         interface{} `json:"ocupadas"`
}

type StoreItemsResponse struct {
	Ok      bool   `json:"ok"`
	Mensaje string `json:"mensaje"`
}

type AdminResenasResponse struct {
	Data         interface{}       `json:"data"`
	Total        int               `json:"total"`
	Pagina       int               `json:"pagina"`
	TotalPaginas int               `json:"totalPaginas"`
	Stats        ResenaStatsResponse `json:"stats"`
}

type ResenaStatsResponse struct {
	Total        int         `json:"total"`
	Promedio     float64     `json:"promedio"`
	Distribucion interface{} `json:"distribucion"`
}

type ResultadosResponse struct {
	Resultados interface{} `json:"resultados"`
}

type ExchangeRateResponse struct {
	Tasa                float64   `json:"tasa"`
	Fuente              string    `json:"fuente"`
	UltimaActualizacion time.Time `json:"ultimaActualizacion"`
}

type WebhookReceivedResponse struct {
	Received bool `json:"received"`
}

type NoLeidosResponse struct {
	NoLeidos int `json:"noLeidos"`
}

type OfertaCreadaResponse struct {
	ID      string `json:"id"`
	Mensaje string `json:"mensaje"`
}

type VerificacionIniciadaResponse struct {
	ID      string `json:"id"`
	Metodo  string `json:"metodo"`
	Estado  string `json:"estado"`
	Mensaje string `json:"mensaje"`
}

type DocumentoSubidoResponse struct {
	Ok        bool   `json:"ok"`
	URL       string `json:"url"`
	Documento string `json:"documento"`
}

type OfertaDetalleResponse struct {
	ID               string                   `json:"id"`
	Codigo           string                   `json:"codigo"`
	PropiedadID      string                   `json:"propiedad_id"`
	HuespedID        string                   `json:"huesped_id"`
	Estado           string                   `json:"estado"`
	PrecioOfertado   float64                  `json:"precio_ofertado"`
	PrecioOriginal   float64                  `json:"precio_original"`
	Moneda           string                   `json:"moneda"`
	FechaEntrada     string                   `json:"fecha_entrada"`
	FechaSalida      string                   `json:"fecha_salida"`
	Noches           int                      `json:"noches"`
	CantidadHuespedes int                     `json:"cantidad_huespedes"`
	Mensaje          *string                  `json:"mensaje"`
	MotivoRechazo    *string                  `json:"motivo_rechazo"`
	FechaCreacion    interface{}              `json:"fecha_creacion"`
	FechaAprobada    interface{}              `json:"fecha_aprobada"`
	FechaExpiracion  interface{}              `json:"fecha_expiracion"`
	FechaRechazada   interface{}              `json:"fecha_rechazada"`
	ReservaID        *string                  `json:"reserva_id"`
	Propiedad        OfertaDetallePropiedad   `json:"propiedad"`
	Huesped          OfertaDetalleHuesped     `json:"huesped"`
}

type OfertaDetallePropiedad struct {
	ID             string        `json:"id"`
	Titulo         string        `json:"titulo"`
	PrecioPorNoche float64       `json:"precio_por_noche"`
	Moneda         string        `json:"moneda"`
	PropietarioID  string        `json:"propietario_id"`
	Imagenes       []ImagenEntry `json:"imagenes"`
}

type ImagenEntry struct {
	URL         string `json:"url"`
	EsPrincipal bool   `json:"es_principal"`
}

type OfertaDetalleHuesped struct {
	ID         string `json:"id"`
	Nombre     string `json:"nombre"`
	Apellido   string `json:"apellido"`
	Email      string `json:"email"`
	AvatarURL  string `json:"avatar_url"`
	Verificado bool   `json:"verificado"`
}
