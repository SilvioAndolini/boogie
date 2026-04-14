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
	Healthz            http.HandlerFunc
	Exchange           http.HandlerFunc
	Ubicaciones        http.HandlerFunc
	CryptoCreate       http.HandlerFunc
	CryptoCallback     http.HandlerFunc
	CryptoCallbackPost http.HandlerFunc
	MetamapWebhook     http.HandlerFunc
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
	Search         http.HandlerFunc
	GetByID        http.HandlerFunc
	MisPropiedades http.HandlerFunc
	UpdateEstado   http.HandlerFunc
	Delete         http.HandlerFunc
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
	MetodoPagoHandlers   *MetodoPagoHandlers
	DashboardHandlers    *DashboardHandlers
	SeccionesHandlers    *SeccionesHandlers
	ReservaHandlers      *ReservaHandlers
	AdminHandlers        *AdminHandlers
	AuthHandlers         *AuthHandlers
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
		})

		r.Get("/crypto/callback", opts.Handlers.CryptoCallback)
		r.Post("/crypto/callback", opts.Handlers.CryptoCallbackPost)
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

			r.Get("/payment-data", opts.PagoHandlers.PaymentData)
		}

		if opts.WalletHandlers != nil {
			r.Route("/wallet", func(r chi.Router) {
				r.Use(opts.AuthVerifier.Middleware)
				r.Get("/", opts.WalletHandlers.Get)
				r.Post("/activar", opts.WalletHandlers.Activar)
				r.Post("/recarga", opts.WalletHandlers.Recarga)
				r.Get("/{walletId}/transacciones", opts.WalletHandlers.Transacciones)
			})
		}

		if opts.MetodoPagoHandlers != nil {
			r.Route("/metodos-pago", func(r chi.Router) {
				r.Use(opts.AuthVerifier.Middleware)
				r.Get("/", opts.MetodoPagoHandlers.List)
				r.Post("/", opts.MetodoPagoHandlers.Crear)
				r.Delete("/{id}", opts.MetodoPagoHandlers.Eliminar)
			})
		}

		if opts.ResenaHandlers != nil {
			r.Route("/resenas", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(opts.AuthVerifier.Middleware)
					r.Post("/", opts.ResenaHandlers.Crear)
					r.Post("/{id}/responder", opts.ResenaHandlers.Responder)
				})
			})

			r.Get("/propiedades/{propiedadId}/resenas", opts.ResenaHandlers.ListByPropiedad)
		}

		if opts.VerificacionHandlers != nil {
			r.Route("/verificacion", func(r chi.Router) {
				r.Use(opts.AuthVerifier.Middleware)
				r.Get("/", opts.VerificacionHandlers.GetByUser)
				r.Post("/iniciar-metamap", opts.VerificacionHandlers.IniciarMetaMap)
				r.Post("/subir-documento", opts.VerificacionHandlers.SubirDocumento)
			})
		}

		if opts.ChatHandlers != nil {
			r.Route("/chat", func(r chi.Router) {
				r.Use(opts.AuthVerifier.Middleware)
				r.Get("/conversaciones", opts.ChatHandlers.GetConversaciones)
				r.Post("/conversaciones", opts.ChatHandlers.GetOrCreateConversacion)
				r.Get("/conversaciones/{id}", opts.ChatHandlers.GetConversacionInfo)
				r.Get("/mensajes", opts.ChatHandlers.GetMensajes)
				r.Post("/mensajes", opts.ChatHandlers.EnviarMensaje)
				r.Get("/no-leidos", opts.ChatHandlers.CountNoLeidos)
				r.Get("/mensajes-rapidos", opts.ChatHandlers.GetMensajesRapidos)
				r.Post("/mensajes-rapidos", opts.ChatHandlers.CrearMensajeRapido)
				r.Post("/mensajes-rapidos/seed", opts.ChatHandlers.SeedMensajesRapidos)
				r.Put("/mensajes-rapidos/{id}", opts.ChatHandlers.ActualizarMensajeRapido)
				r.Delete("/mensajes-rapidos/{id}", opts.ChatHandlers.EliminarMensajeRapido)
				r.Post("/imagen", opts.ChatHandlers.SubirImagen)
			})
		}

		if opts.OfertaHandlers != nil {
			r.Route("/ofertas", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(opts.AuthVerifier.Middleware)
					r.Post("/", opts.OfertaHandlers.Crear)
					r.Post("/{id}/responder", opts.OfertaHandlers.Responder)
					r.Get("/recibidas", opts.OfertaHandlers.GetRecibidas)
					r.Get("/enviadas", opts.OfertaHandlers.GetEnviadas)
				})
			})
		}

		if opts.TiendaHandlers != nil {
			r.Get("/tienda/productos", opts.TiendaHandlers.GetProductos)
			r.Get("/tienda/servicios", opts.TiendaHandlers.GetServicios)
		}

		if opts.PropiedadesHandlers != nil {
			r.Route("/propiedades", func(r chi.Router) {
				r.Get("/publicas", opts.PropiedadesHandlers.Search)
				r.Get("/buscar", opts.PropiedadesHandlers.Search)

				r.Group(func(r chi.Router) {
					r.Use(opts.AuthVerifier.Middleware)
					r.Get("/mias", opts.PropiedadesHandlers.MisPropiedades)
					r.Post("/", func(w http.ResponseWriter, r *http.Request) {
						w.WriteHeader(http.StatusNotImplemented)
						w.Write([]byte(`{"error":{"code":"NOT_IMPLEMENTED","message":"Use Supabase storage for property creation"}}`))
					})
				})

				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", opts.PropiedadesHandlers.GetByID)
					r.Group(func(r chi.Router) {
						r.Use(opts.AuthVerifier.Middleware)
						r.Patch("/estado", opts.PropiedadesHandlers.UpdateEstado)
						r.Put("/", func(w http.ResponseWriter, r *http.Request) {
							w.WriteHeader(http.StatusNotImplemented)
							w.Write([]byte(`{"error":{"code":"NOT_IMPLEMENTED","message":"Use Supabase storage for property update"}}`))
						})
						r.Get("/editar", opts.PropiedadesHandlers.GetByID)
						r.Delete("/", opts.PropiedadesHandlers.Delete)
						if opts.DashboardHandlers != nil {
							r.Get("/dashboard", opts.DashboardHandlers.GetDashboard)
							r.Post("/gastos", opts.DashboardHandlers.CrearGasto)
							r.Delete("/gastos/{gastoId}", opts.DashboardHandlers.EliminarGasto)
						}
						r.Get("/reservas", func(w http.ResponseWriter, r *http.Request) {
							w.WriteHeader(http.StatusNotImplemented)
						})
						r.Get("/amenidades", func(w http.ResponseWriter, r *http.Request) {
							w.WriteHeader(http.StatusNotImplemented)
						})
					})
				})
			})
		}

		if opts.SeccionesHandlers != nil {
			r.Get("/secciones-destacadas", opts.SeccionesHandlers.GetPublicas)
		}

		if opts.ReservaHandlers != nil {
			r.Route("/reservas", func(r chi.Router) {
				r.Get("/fechas-ocupadas", opts.ReservaHandlers.FechasOcupadas)
				r.Get("/disponibilidad", opts.ReservaHandlers.Disponibilidad)

				r.Group(func(r chi.Router) {
					r.Use(opts.AuthVerifier.Middleware)
					r.Post("/", opts.ReservaHandlers.Crear)
					r.Post("/crear-con-pago", opts.ReservaHandlers.CrearConPago)
					r.Get("/mias", opts.ReservaHandlers.MisReservas)
					r.Get("/recibidas", opts.ReservaHandlers.ReservasRecibidas)
					r.Post("/cron/auto-confirmar", opts.ReservaHandlers.AutoConfirmarExpiradas)
					r.Get("/{id}", opts.ReservaHandlers.GetByID)
					r.Post("/{id}/cancelar", opts.ReservaHandlers.Cancelar)
					r.Post("/{id}/confirmar", opts.ReservaHandlers.ConfirmarORechazar)
					r.Post("/{id}/rechazar", opts.ReservaHandlers.ConfirmarORechazar)
				})
			})
		}

		if opts.AdminHandlers != nil || opts.VerificacionHandlers != nil || opts.TiendaHandlers != nil {
			r.Route("/admin", func(r chi.Router) {
				r.Use(opts.AuthVerifier.Middleware)
				r.Use(auth.RequireAdmin)

				if opts.VerificacionHandlers != nil {
					r.Get("/verificaciones", opts.VerificacionHandlers.ListAll)
					r.Post("/verificaciones/{id}/revisar", opts.VerificacionHandlers.Revisar)
					r.Get("/counts", opts.VerificacionHandlers.AdminCounts)
				}

				if opts.TiendaHandlers != nil {
					r.Get("/tienda/productos", opts.TiendaHandlers.GetAllProductos)
					r.Get("/tienda/servicios", opts.TiendaHandlers.GetAllServicios)
				}

				if opts.SeccionesHandlers != nil {
					r.Get("/secciones-destacadas", opts.SeccionesHandlers.GetAdmin)
					r.Post("/secciones-destacadas", opts.SeccionesHandlers.Upsert)
					r.Put("/secciones-destacadas", opts.SeccionesHandlers.Upsert)
					r.Delete("/secciones-destacadas", opts.SeccionesHandlers.Delete)
					r.Get("/secciones-destacadas/propiedades", opts.SeccionesHandlers.SearchPropiedades)
					r.Get("/secciones-destacadas/propiedades/publicadas", opts.SeccionesHandlers.SearchPropiedades)
					r.Get("/secciones-destacadas/propiedades/por-ids", opts.SeccionesHandlers.GetPropiedadesByIDs)
					r.Get("/secciones-destacadas/propiedades/preview", opts.SeccionesHandlers.PreviewPropiedades)
				}

				if opts.AdminHandlers != nil {
					r.Get("/dashboard", opts.AdminHandlers.GetDashboard)
					r.Get("/reservas", opts.AdminHandlers.GetReservas)
					r.Get("/reservas/stats", opts.AdminHandlers.GetReservasStats)
					r.Post("/reservas/accion", opts.AdminHandlers.AccionReserva)
					r.Get("/reservas/{id}", opts.AdminHandlers.GetReservaByID)
					r.Get("/pagos", opts.AdminHandlers.GetPagos)
					r.Get("/pagos/stats", opts.AdminHandlers.GetPagosStats)
					r.Post("/pagos/verificar", opts.AdminHandlers.VerificarPago)
					r.Get("/propiedades", opts.AdminHandlers.GetPropiedades)
					r.Get("/propiedades/ciudades", opts.AdminHandlers.GetCiudades)
					r.Get("/propiedades/{id}", opts.AdminHandlers.GetPropiedadByID)
					r.Get("/propiedades/{id}/ingresos", opts.AdminHandlers.GetPropiedadIngresos)
					r.Patch("/propiedades", opts.AdminHandlers.UpdatePropiedad)
					r.Delete("/propiedades/{id}", opts.AdminHandlers.DeletePropiedad)
					r.Get("/resenas", opts.AdminHandlers.GetResenas)
					r.Post("/resenas/moderar", opts.AdminHandlers.ModerarResena)
					r.Get("/usuarios", opts.AdminHandlers.GetUsuarios)
					r.Post("/usuarios", opts.AdminHandlers.CrearUsuario)
					r.Patch("/usuarios/{id}", opts.AdminHandlers.UpdateUsuario)
					r.Delete("/usuarios/{id}", opts.AdminHandlers.DeleteUsuario)
					r.Get("/cupones", opts.AdminHandlers.GetCupones)
					r.Get("/cupones/{id}", opts.AdminHandlers.GetCuponByID)
					r.Post("/cupones", opts.AdminHandlers.CrearCupon)
					r.Put("/cupones", opts.AdminHandlers.EditarCupon)
					r.Patch("/cupones/{id}/activo", opts.AdminHandlers.ToggleCuponActivo)
					r.Delete("/cupones/{id}", opts.AdminHandlers.DeleteCupon)
					r.Get("/cupon-usos", opts.AdminHandlers.GetCuponUsos)
					r.Get("/comisiones", opts.AdminHandlers.GetComisiones)
					r.Put("/comisiones", opts.AdminHandlers.UpdateComisiones)
					r.Get("/auditoria", opts.AdminHandlers.GetAuditLog)
					r.Get("/notificaciones", opts.AdminHandlers.GetNotificaciones)
					r.Post("/notificaciones", opts.AdminHandlers.EnviarNotificacion)
					r.Post("/store/productos", opts.AdminHandlers.CrearProductoStore)
					r.Patch("/store/productos/{id}", opts.AdminHandlers.ActualizarProductoStore)
					r.Delete("/store/productos/{id}", opts.AdminHandlers.EliminarProductoStore)
					r.Post("/store/servicios", opts.AdminHandlers.CrearServicioStore)
					r.Patch("/store/servicios/{id}", opts.AdminHandlers.ActualizarServicioStore)
					r.Delete("/store/servicios/{id}", opts.AdminHandlers.EliminarServicioStore)
				}
			})
		}

		if opts.AuthHandlers != nil {
			r.Post("/auth/login", opts.AuthHandlers.Login)
			r.Post("/auth/login-admin", opts.AuthHandlers.LoginAdmin)
			r.Post("/auth/otp/email", opts.AuthHandlers.SendOtpEmail)
			r.Post("/auth/otp/sms", opts.AuthHandlers.SendOtpSms)
			r.Post("/auth/otp/verify", opts.AuthHandlers.VerifyOtp)
			r.Post("/auth/register", opts.AuthHandlers.Register)
			r.Post("/auth/reset-password", opts.AuthHandlers.ResetPassword)
			r.Get("/auth/google", opts.AuthHandlers.GoogleOAuthURL)
			r.Get("/auth/google/callback", opts.AuthHandlers.GoogleCallback)

			r.Group(func(r chi.Router) {
				r.Use(opts.AuthVerifier.Middleware)
				r.Post("/auth/completar-perfil", opts.AuthHandlers.CompletarPerfil)
				r.Get("/auth/me", opts.AuthHandlers.Me)
				r.Put("/auth/perfil", opts.AuthHandlers.ActualizarPerfil)
				r.Post("/auth/password", opts.AuthHandlers.CambiarContrasena)
				r.Post("/auth/avatar", opts.AuthHandlers.SubirAvatar)
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
