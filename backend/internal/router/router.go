package router

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/rs/cors"
	"golang.org/x/time/rate"

	"github.com/boogie/backend/internal/auth"
	handlermw "github.com/boogie/backend/internal/handler"
)

type Handlers struct {
	Healthz                  http.HandlerFunc
	Exchange                 http.HandlerFunc
	Ubicaciones              http.HandlerFunc
	CryptoCreate             http.HandlerFunc
	CryptoCallback           http.HandlerFunc
	CryptoCallbackPost       http.HandlerFunc
	CryptoVerificar          http.HandlerFunc
	CryptoVerificacionManual http.HandlerFunc
	CryptoCancelarFallida    http.HandlerFunc
	CryptoExpirarAbandonados http.HandlerFunc
	MetamapWebhook           http.HandlerFunc
}

type PagoHandlers struct {
	RegistrarSimple      http.HandlerFunc
	RegistrarComprobante http.HandlerFunc
	Verificar            http.HandlerFunc
	MisPagos             http.HandlerFunc
	PaymentData          http.HandlerFunc
	SubirComprobante     http.HandlerFunc
	AgregarStoreItems    http.HandlerFunc
}

type WalletHandlers struct {
	Get           http.HandlerFunc
	Activar       http.HandlerFunc
	Recarga       http.HandlerFunc
	Transacciones http.HandlerFunc
}

type ResenaHandlers struct {
	Crear           http.HandlerFunc
	Responder       http.HandlerFunc
	ListByPropiedad http.HandlerFunc
}

type VerificacionHandlers struct {
	GetByUser      http.HandlerFunc
	IniciarMetaMap http.HandlerFunc
	SubirDocumento http.HandlerFunc
	ListAll        http.HandlerFunc
	Revisar        http.HandlerFunc
	AdminCounts    http.HandlerFunc
}

type ChatHandlers struct {
	GetConversaciones       http.HandlerFunc
	GetOrCreateConversacion http.HandlerFunc
	GetMensajes             http.HandlerFunc
	EnviarMensaje           http.HandlerFunc
	CountNoLeidos           http.HandlerFunc
	GetConversacionInfo     http.HandlerFunc
	GetMensajesRapidos      http.HandlerFunc
	CrearMensajeRapido      http.HandlerFunc
	ActualizarMensajeRapido http.HandlerFunc
	EliminarMensajeRapido   http.HandlerFunc
	SeedMensajesRapidos     http.HandlerFunc
	SubirImagen             http.HandlerFunc
}

type OfertaHandlers struct {
	Crear        http.HandlerFunc
	Responder    http.HandlerFunc
	GetByID      http.HandlerFunc
	GetRecibidas http.HandlerFunc
	GetEnviadas  http.HandlerFunc
}

type TiendaHandlers struct {
	GetProductos    http.HandlerFunc
	GetServicios    http.HandlerFunc
	GetAllProductos http.HandlerFunc
	GetAllServicios http.HandlerFunc
}

type PropiedadesHandlers struct {
	Search             http.HandlerFunc
	GetByID            http.HandlerFunc
	MisPropiedades     http.HandlerFunc
	UpdateEstado       http.HandlerFunc
	Delete             http.HandlerFunc
	Crear              http.HandlerFunc
	Actualizar         http.HandlerFunc
	AgregarImagenes    http.HandlerFunc
	ActualizarImagenes http.HandlerFunc
}

type CanchasHandlers struct {
	GetDisponibilidad http.HandlerFunc
}

type MetodoPagoHandlers struct {
	List     http.HandlerFunc
	Crear    http.HandlerFunc
	Eliminar http.HandlerFunc
}

type DashboardHandlers struct {
	GetDashboard  http.HandlerFunc
	CrearGasto    http.HandlerFunc
	EliminarGasto http.HandlerFunc
}

type SeccionesHandlers struct {
	GetPublicas         http.HandlerFunc
	GetAdmin            http.HandlerFunc
	Upsert              http.HandlerFunc
	Delete              http.HandlerFunc
	SearchPropiedades   http.HandlerFunc
	GetPropiedadesByIDs http.HandlerFunc
	PreviewPropiedades  http.HandlerFunc
}

type ReservaHandlers struct {
	Crear                  http.HandlerFunc
	CrearConPago           http.HandlerFunc
	GetByID                http.HandlerFunc
	MisReservas            http.HandlerFunc
	ReservasRecibidas      http.HandlerFunc
	ConfirmarORechazar     http.HandlerFunc
	Cancelar               http.HandlerFunc
	Disponibilidad         http.HandlerFunc
	FechasOcupadas         http.HandlerFunc
	CalcularReembolso      http.HandlerFunc
	AutoConfirmarExpiradas http.HandlerFunc
}

type AdminHandlers struct {
	GetDashboard            http.HandlerFunc
	GetReservas             http.HandlerFunc
	GetReservasStats        http.HandlerFunc
	AccionReserva           http.HandlerFunc
	GetReservaByID          http.HandlerFunc
	GetPagos                http.HandlerFunc
	GetPagosStats           http.HandlerFunc
	VerificarPago           http.HandlerFunc
	GetPropiedades          http.HandlerFunc
	GetPropiedadByID        http.HandlerFunc
	UpdatePropiedad         http.HandlerFunc
	DeletePropiedad         http.HandlerFunc
	GetCiudades             http.HandlerFunc
	GetPropiedadIngresos    http.HandlerFunc
	GetResenas              http.HandlerFunc
	ModerarResena           http.HandlerFunc
	GetUsuarios             http.HandlerFunc
	CrearUsuario            http.HandlerFunc
	UpdateUsuario           http.HandlerFunc
	DeleteUsuario           http.HandlerFunc
	GetCupones              http.HandlerFunc
	GetCuponByID            http.HandlerFunc
	CrearCupon              http.HandlerFunc
	EditarCupon             http.HandlerFunc
	ToggleCuponActivo       http.HandlerFunc
	DeleteCupon             http.HandlerFunc
	GetCuponUsos            http.HandlerFunc
	GetComisiones           http.HandlerFunc
	UpdateComisiones        http.HandlerFunc
	GetAuditLog             http.HandlerFunc
	GetNotificaciones       http.HandlerFunc
	EnviarNotificacion      http.HandlerFunc
	CrearProductoStore      http.HandlerFunc
	ActualizarProductoStore http.HandlerFunc
	EliminarProductoStore   http.HandlerFunc
	CrearServicioStore      http.HandlerFunc
	ActualizarServicioStore http.HandlerFunc
	EliminarServicioStore   http.HandlerFunc
	SubirImagenStore        http.HandlerFunc
}

type AuthHandlers struct {
	Login             http.HandlerFunc
	LoginAdmin        http.HandlerFunc
	SendOtpEmail      http.HandlerFunc
	SendOtpSms        http.HandlerFunc
	VerifyOtp         http.HandlerFunc
	Register          http.HandlerFunc
	ResetPassword     http.HandlerFunc
	GoogleOAuthURL    http.HandlerFunc
	GoogleCallback    http.HandlerFunc
	CompletarPerfil   http.HandlerFunc
	Me                http.HandlerFunc
	ActualizarPerfil  http.HandlerFunc
	CambiarContrasena http.HandlerFunc
	SubirAvatar       http.HandlerFunc
}

type CuponHandlers struct {
	GetActivosUsuario http.HandlerFunc
}

type RouterOpts struct {
	Handlers             *Handlers
	PagoHandlers         *PagoHandlers
	WalletHandlers       *WalletHandlers
	ResenaHandlers       *ResenaHandlers
	VerificacionHandlers *VerificacionHandlers
	ChatHandlers         *ChatHandlers
	OfertaHandlers       *OfertaHandlers
	TiendaHandlers       *TiendaHandlers
	PropiedadesHandlers  *PropiedadesHandlers
	CanchasHandlers      *CanchasHandlers
	MetodoPagoHandlers   *MetodoPagoHandlers
	DashboardHandlers    *DashboardHandlers
	SeccionesHandlers    *SeccionesHandlers
	ReservaHandlers      *ReservaHandlers
	AdminHandlers        *AdminHandlers
	AuthHandlers         *AuthHandlers
	CuponHandlers        *CuponHandlers
	AuthVerifier         *auth.SupabaseVerifier
	AppURL               string
	ExchangeLimiter      *handlermw.IPRateLimiter
	UbicacionesLimiter   *handlermw.IPRateLimiter
}

func New(opts *RouterOpts) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(handlermw.LoggingMiddleware)
	r.Use(handlermw.RecoveryMiddleware)
	r.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{opts.AppURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"X-RateLimit-Remaining"},
		AllowCredentials: true,
		MaxAge:           300,
	}).Handler)

	r.Get("/healthz", opts.Handlers.Healthz)

	r.Route("/api/v1", func(r chi.Router) {
		r.With(rateLimitMiddleware(opts.ExchangeLimiter)).Get("/exchange-rate", opts.Handlers.Exchange)
		r.With(rateLimitMiddleware(opts.UbicacionesLimiter)).Get("/ubicaciones", opts.Handlers.Ubicaciones)

		r.Group(func(r chi.Router) {
			r.Use(opts.AuthVerifier.Middleware)
			r.Post("/crypto/create", opts.Handlers.CryptoCreate)
			r.Get("/crypto/verificar", opts.Handlers.CryptoVerificar)
			r.Post("/crypto/verificacion-manual", opts.Handlers.CryptoVerificacionManual)
			r.Post("/crypto/cancelar-fallida", opts.Handlers.CryptoCancelarFallida)
		})

		r.Get("/crypto/callback", opts.Handlers.CryptoCallback)
		r.Post("/crypto/callback", opts.Handlers.CryptoCallbackPost)
		r.Post("/crypto/cron/expirar-abandonados", opts.Handlers.CryptoExpirarAbandonados)
		r.Post("/metamap/webhook", opts.Handlers.MetamapWebhook)

		if opts.PagoHandlers != nil {
			r.Route("/pagos", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(opts.AuthVerifier.Middleware)
					r.Post("/registrar", opts.PagoHandlers.RegistrarSimple)
					r.Post("/registrar-comprobante", opts.PagoHandlers.RegistrarComprobante)
					r.Post("/{id}/verificar", opts.PagoHandlers.Verificar)
					r.Get("/mis-pagos", opts.PagoHandlers.MisPagos)
					r.Post("/subir-comprobante", opts.PagoHandlers.SubirComprobante)
					r.Post("/store-items", opts.PagoHandlers.AgregarStoreItems)
				})
			})
		}

		if opts.CuponHandlers != nil {
			r.Route("/cupones", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(opts.AuthVerifier.Middleware)
					r.Get("/activos", opts.CuponHandlers.GetActivosUsuario)
				})
			})
		}
	})

	return r
}

func rateLimitMiddleware(limiter *handlermw.IPRateLimiter) func(http.Handler) http.Handler {
	return handlermw.RateLimitMiddleware(limiter)
}

func NewExchangeLimiter() *handlermw.IPRateLimiter {
	return handlermw.NewIPRateLimiter(rate.Every(time.Second), 60)
}

func NewUbicacionesLimiter() *handlermw.IPRateLimiter {
	return handlermw.NewIPRateLimiter(rate.Every(2*time.Second), 30)
}
