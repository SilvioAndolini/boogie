package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/boogie/backend/internal/auth"
	"github.com/boogie/backend/internal/config"
	"github.com/boogie/backend/internal/handler"
	"github.com/boogie/backend/internal/repository"
	"github.com/boogie/backend/internal/router"
	"github.com/boogie/backend/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	slog.Info("starting boogie-backend")

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config error", "error", err)
		os.Exit(1)
	}

	verifier := auth.NewSupabaseVerifier(cfg.SupabaseURL)

	db, err := repository.NewPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Warn("database connection skipped", "error", err)
	}

	if db != nil {
		verifier.FetchRole = func(ctx context.Context, userID string) string {
			authRepo := repository.NewAuthRepo(db)
			rol, err := authRepo.GetUserRole(ctx, userID)
			if err != nil {
				slog.Warn("fetch role failed", "userID", userID, "error", err)
				return ""
			}
			return rol
		}
	}

	exchangeSvc := service.NewExchangeService()
	ubicacionesSvc := service.NewUbicacionesService()

	exchangeHandler := handler.NewExchangeHandler(exchangeSvc)
	ubicacionesHandler := handler.NewUbicacionesHandler(ubicacionesSvc)

	var cryptoHandler *handler.CryptoHandler
	var metamapHandler *handler.MetamapHandler

	if db != nil {
		cryptoSvc := service.NewCryptoService(service.CryptapiConfig{
			WalletAddress:   cfg.CryptapiWalletAddress,
			CallbackSecret:  cfg.CryptapiCallbackSecret,
			CallbackBaseURL: cfg.AppURL,
		}, cfg.ComisionPlataformaHuesped, cfg.ComisionPlataformaAnfitrion)
		reservaDisponSvc := service.NewReservaDisponibilidad(db)
		cryptoRepo := repository.NewCryptoRepo(db)
		cryptoHandler = handler.NewCryptoHandler(cryptoSvc, reservaDisponSvc, cryptoRepo)

		metamapRepo := repository.NewMetamapRepo(db)
		metamapHandler = handler.NewMetamapHandler(metamapRepo, cfg.MetamapWebhookSecret)
	}

	var pagoHandlers *router.PagoHandlers
	var walletHandlers *router.WalletHandlers
	var resenaHandlers *router.ResenaHandlers
	var verifHandlers *router.VerificacionHandlers
	var chatHandlers *router.ChatHandlers
	var ofertaHandlers *router.OfertaHandlers
	var tiendaHandlers *router.TiendaHandlers
	var adminHandlers *router.AdminHandlers
	var authHandlers *router.AuthHandlers
	var metodoPagoHandlers *router.MetodoPagoHandlers
	var dashboardHandlers *router.DashboardHandlers
	var seccionesHandlers *router.SeccionesHandlers
	var propiedadesHandlers *router.PropiedadesHandlers
	var canchasHandlers *router.CanchasHandlers
	var reservaHandlers *router.ReservaHandlers

	authClient := auth.NewSupabaseAuthClient(cfg.SupabaseURL, cfg.SupabaseSecretKey)

	var authRepo *repository.AuthRepo
	if db != nil {
		authRepo = repository.NewAuthRepo(db)
	}

	authH := handler.NewAuthHandler(authClient, verifier, authRepo, cfg.SupabaseURL, cfg.SupabaseSecretKey, cfg.AppURL)

	authHandlers = &router.AuthHandlers{
		Login:             authH.Login,
		LoginAdmin:        authH.LoginAdmin,
		SendOtpEmail:      authH.SendOtpEmail,
		SendOtpSms:        authH.SendOtpSms,
		VerifyOtp:         authH.VerifyOtp,
		Register:          authH.Register,
		ResetPassword:     authH.ResetPassword,
		GoogleOAuthURL:    authH.GoogleOAuthURL,
		GoogleCallback:    authH.GoogleCallback,
		CompletarPerfil:   authH.CompletarPerfil,
		Me:                authH.Me,
		ActualizarPerfil:  authH.ActualizarPerfil,
		CambiarContrasena: authH.CambiarContrasena,
		SubirAvatar:       authH.SubirAvatar,
	}

	if db != nil {
		pagoRepo := repository.NewPagoRepo(db)

		pagoSvc := service.NewPagoService(pagoRepo)
		walletSvc := service.NewWalletService(pagoRepo)
		paymentDataSvc := service.NewPaymentDataService()
		storeItemRepo := repository.NewStoreItemRepo(db)

		pagoHandler := handler.NewPagoHandler(pagoSvc, authClient, cfg.SupabaseURL, cfg.SupabaseSecretKey, storeItemRepo)
		walletHandler := handler.NewWalletHandler(walletSvc)
		paymentDataHandler := handler.NewPaymentDataHandler(paymentDataSvc)

		pagoHandlers = &router.PagoHandlers{
			RegistrarSimple:      pagoHandler.RegistrarSimple,
			RegistrarComprobante: pagoHandler.RegistrarConComprobante,
			Verificar:            pagoHandler.Verificar,
			MisPagos:             pagoHandler.MisPagos,
			PaymentData:          paymentDataHandler.Get,
			SubirComprobante:     pagoHandler.SubirComprobante,
			AgregarStoreItems:    pagoHandler.AgregarStoreItems,
		}

		walletHandlers = &router.WalletHandlers{
			Get:           walletHandler.GetWallet,
			Activar:       walletHandler.Activar,
			Recarga:       walletHandler.Recarga,
			Transacciones: walletHandler.Transacciones,
		}

		metodoPagoRepo := repository.NewMetodoPagoRepo(db)
		metodoPagoSvc := service.NewMetodoPagoService(metodoPagoRepo)
		metodoPagoH := handler.NewMetodoPagoHandler(metodoPagoSvc)

		metodoPagoHandlers = &router.MetodoPagoHandlers{
			List:     metodoPagoH.List,
			Crear:    metodoPagoH.Crear,
			Eliminar: metodoPagoH.Eliminar,
		}

		resenaRepo := repository.NewResenaRepo(db)
		resenaSvc := service.NewResenaService(resenaRepo)
		resenaH := handler.NewResenaHandler(resenaSvc)

		resenaHandlers = &router.ResenaHandlers{
			Crear:           resenaH.Crear,
			Responder:       resenaH.Responder,
			ListByPropiedad: resenaH.ListByPropiedad,
		}

		verifRepo := repository.NewVerificacionRepo(db)
		verifSvc := service.NewVerificacionService(verifRepo)
		verifH := handler.NewVerificacionHandler(verifSvc)
		verifH.WithStorage(authClient, cfg.SupabaseURL, cfg.SupabaseSecretKey)

		verifHandlers = &router.VerificacionHandlers{
			GetByUser:      verifH.GetByUser,
			IniciarMetaMap: verifH.IniciarMetaMap,
			SubirDocumento: verifH.SubirDocumento,
			ListAll:        verifH.ListAll,
			Revisar:        verifH.Revisar,
			AdminCounts:    verifH.AdminCounts,
		}

		chatRepo := repository.NewChatRepo(db)
		ofertaRepo := repository.NewOfertaRepo(db)
		tiendaRepo := repository.NewTiendaRepo(db)

		chatSvc := service.NewChatService(chatRepo)
		ofertaSvc := service.NewOfertaService(ofertaRepo)
		tiendaSvc := service.NewTiendaService(tiendaRepo)

		chatH := handler.NewChatHandler(chatSvc)
		chatH.WithStorage(authClient, cfg.SupabaseURL, cfg.SupabaseSecretKey)
		ofertaH := handler.NewOfertaHandler(ofertaSvc)
		tiendaH := handler.NewTiendaHandler(tiendaSvc)

		chatHandlers = &router.ChatHandlers{
			GetConversaciones:       chatH.GetConversaciones,
			GetOrCreateConversacion: chatH.GetOrCreateConversacion,
			GetMensajes:             chatH.GetMensajes,
			EnviarMensaje:           chatH.EnviarMensaje,
			CountNoLeidos:           chatH.CountNoLeidos,
			GetConversacionInfo:     chatH.GetConversacionInfo,
			GetMensajesRapidos:      chatH.GetMensajesRapidos,
			CrearMensajeRapido:      chatH.CrearMensajeRapido,
			ActualizarMensajeRapido: chatH.ActualizarMensajeRapido,
			EliminarMensajeRapido:   chatH.EliminarMensajeRapido,
			SeedMensajesRapidos:     chatH.SeedMensajesRapidos,
			SubirImagen:             chatH.SubirImagen,
		}

		ofertaHandlers = &router.OfertaHandlers{
			Crear:        ofertaH.Crear,
			Responder:    ofertaH.Responder,
			GetByID:      ofertaH.GetByID,
			GetRecibidas: ofertaH.GetRecibidas,
			GetEnviadas:  ofertaH.GetEnviadas,
		}

		tiendaHandlers = &router.TiendaHandlers{
			GetProductos:    tiendaH.GetProductos,
			GetServicios:    tiendaH.GetServicios,
			GetAllProductos: tiendaH.GetAllProductos,
			GetAllServicios: tiendaH.GetAllServicios,
		}

		adminRepo := repository.NewAdminRepo(db)
		adminSvc := service.NewAdminService(adminRepo)
		adminH := handler.NewAdminHandler(adminSvc, tiendaSvc)
		adminH.WithStorage(authClient, cfg.SupabaseURL, cfg.SupabaseSecretKey)

		adminHandlers = &router.AdminHandlers{
			GetDashboard:            adminH.GetDashboard,
			GetReservas:             adminH.GetReservas,
			GetReservasStats:        adminH.GetReservasStats,
			AccionReserva:           adminH.AccionReserva,
			GetReservaByID:          adminH.GetReservaByID,
			GetPagos:                adminH.GetPagos,
			GetPagosStats:           adminH.GetPagosStats,
			VerificarPago:           adminH.VerificarPago,
			GetPropiedades:          adminH.GetPropiedades,
			GetPropiedadByID:        adminH.GetPropiedadByID,
			UpdatePropiedad:         adminH.UpdatePropiedad,
			DeletePropiedad:         adminH.DeletePropiedad,
			GetCiudades:             adminH.GetCiudades,
			GetPropiedadIngresos:    adminH.GetPropiedadIngresos,
			GetResenas:              adminH.GetResenas,
			ModerarResena:           adminH.ModerarResena,
			GetUsuarios:             adminH.GetUsuarios,
			CrearUsuario:            adminH.CrearUsuario,
			UpdateUsuario:           adminH.UpdateUsuario,
			DeleteUsuario:           adminH.DeleteUsuario,
			GetCupones:              adminH.GetCupones,
			GetCuponByID:            adminH.GetCuponByID,
			CrearCupon:              adminH.CrearCupon,
			EditarCupon:             adminH.EditarCupon,
			ToggleCuponActivo:       adminH.ToggleCuponActivo,
			DeleteCupon:             adminH.DeleteCupon,
			GetCuponUsos:            adminH.GetCuponUsos,
			GetComisiones:           adminH.GetComisiones,
			UpdateComisiones:        adminH.UpdateComisiones,
			GetAuditLog:             adminH.GetAuditLog,
			GetNotificaciones:       adminH.GetNotificaciones,
			EnviarNotificacion:      adminH.EnviarNotificacion,
			CrearProductoStore:      adminH.CrearProductoStore,
			ActualizarProductoStore: adminH.ActualizarProductoStore,
			EliminarProductoStore:   adminH.EliminarProductoStore,
			CrearServicioStore:      adminH.CrearServicioStore,
			ActualizarServicioStore: adminH.ActualizarServicioStore,
			EliminarServicioStore:   adminH.EliminarServicioStore,
			SubirImagenStore:        adminH.SubirImagenStore,
		}

		propiedadesRepo := repository.NewPropiedadesRepo(db)
		propiedadesSvc := service.NewPropiedadesService(propiedadesRepo, 2)
		propiedadesH := handler.NewPropiedadesHandler(propiedadesSvc)

		propiedadesHandlers = &router.PropiedadesHandlers{
			Search:             propiedadesH.Search,
			GetByID:            propiedadesH.GetByID,
			MisPropiedades:     propiedadesH.MisPropiedades,
			UpdateEstado:       propiedadesH.UpdateEstado,
			Delete:             propiedadesH.Delete,
			Crear:              propiedadesH.Crear,
			Actualizar:         propiedadesH.Actualizar,
			AgregarImagenes:    propiedadesH.AgregarImagenes,
			ActualizarImagenes: propiedadesH.ActualizarImagenes,
		}

		canchasH := handler.NewCanchasHandler(propiedadesRepo, propiedadesSvc)

		canchasHandlers = &router.CanchasHandlers{
			GetDisponibilidad: canchasH.GetDisponibilidad,
		}

		dashboardRepo := repository.NewDashboardRepo(db)
		dashboardSvc := service.NewDashboardService(dashboardRepo)
		dashboardH := handler.NewDashboardHandler(dashboardSvc, propiedadesSvc)

		dashboardHandlers = &router.DashboardHandlers{
			GetDashboard:  dashboardH.GetDashboard,
			CrearGasto:    dashboardH.CrearGasto,
			EliminarGasto: dashboardH.EliminarGasto,
		}

		seccionesRepo := repository.NewSeccionesRepo(db)
		seccionesSvc := service.NewSeccionesService(seccionesRepo)
		seccionesH := handler.NewSeccionesHandler(seccionesSvc)

		seccionesHandlers = &router.SeccionesHandlers{
			GetPublicas:         seccionesH.GetPublicas,
			GetAdmin:            seccionesH.GetAdmin,
			Upsert:              seccionesH.Upsert,
			Delete:              seccionesH.Delete,
			SearchPropiedades:   seccionesH.SearchPropiedades,
			GetPropiedadesByIDs: seccionesH.GetPropiedadesByIDs,
			PreviewPropiedades:  seccionesH.PreviewPropiedades,
		}

		reservaRepo := repository.NewReservaRepo(db)
		reservaDisponSvc := service.NewReservaDisponibilidad(db)
		reservaSvc := service.NewReservaService(reservaRepo, reservaDisponSvc, cfg.ComisionPlataformaHuesped, cfg.ComisionPlataformaAnfitrion)
		reservaH := handler.NewReservaHandler(reservaSvc, reservaDisponSvc)

		reservaHandlers = &router.ReservaHandlers{
			Crear:                  reservaH.Crear,
			CrearConPago:           reservaH.CrearConPago,
			GetByID:                reservaH.GetByID,
			MisReservas:            reservaH.MisReservas,
			ReservasRecibidas:      reservaH.ReservasRecibidas,
			ConfirmarORechazar:     reservaH.ConfirmarORechazar,
			Cancelar:               reservaH.Cancelar,
			Disponibilidad:         reservaH.Disponibilidad,
			FechasOcupadas:         reservaH.FechasOcupadas,
			CalcularReembolso:      reservaH.CalcularReembolso,
			AutoConfirmarExpiradas: reservaH.AutoConfirmarExpiradas,
		}
	}

	srv := &http.Server{
		Addr: fmt.Sprintf(":%s", cfg.Port),
		Handler: router.New(&router.RouterOpts{
			Handlers: &router.Handlers{
				Healthz:                  handler.Healthz,
				Exchange:                 exchangeHandler.Get,
				Ubicaciones:              ubicacionesHandler.Search,
				CryptoCreate:             safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.Create }),
				CryptoCallback:           safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.Callback }),
				CryptoCallbackPost:       safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.CallbackPost }),
				CryptoVerificar:          safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.Verificar }),
				CryptoVerificacionManual: safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.SolicitarVerificacionManual }),
				CryptoCancelarFallida:    safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.CancelarFallida }),
				CryptoExpirarAbandonados: safeHandler(cryptoHandler, func(h *handler.CryptoHandler) http.HandlerFunc { return h.ExpirarAbandonados }),
				MetamapWebhook:           safeHandlerMetamap(metamapHandler),
			},
			PagoHandlers:         pagoHandlers,
			WalletHandlers:       walletHandlers,
			MetodoPagoHandlers:   metodoPagoHandlers,
			ResenaHandlers:       resenaHandlers,
			VerificacionHandlers: verifHandlers,
			ChatHandlers:         chatHandlers,
			OfertaHandlers:       ofertaHandlers,
			TiendaHandlers:       tiendaHandlers,
			AdminHandlers:        adminHandlers,
			AuthHandlers:         authHandlers,
			PropiedadesHandlers:  propiedadesHandlers,
			CanchasHandlers:      canchasHandlers,
			DashboardHandlers:    dashboardHandlers,
			SeccionesHandlers:    seccionesHandlers,
			ReservaHandlers:      reservaHandlers,
			AuthVerifier:         verifier,
			AppURL:               cfg.AppURL,
			ExchangeLimiter:      router.NewExchangeLimiter(),
			UbicacionesLimiter:   router.NewUbicacionesLimiter(),
		}),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server listening", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	go startExpiryWorker(db)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server forced shutdown", "error", err)
	}

	if db != nil {
		db.Close()
	}

	slog.Info("server exited")
}

func safeHandler(h *handler.CryptoHandler, fn func(*handler.CryptoHandler) http.HandlerFunc) http.HandlerFunc {
	if h == nil {
		return func(w http.ResponseWriter, r *http.Request) {
			handler.ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Database not connected")
		}
	}
	return fn(h)
}

func safeHandlerMetamap(h *handler.MetamapHandler) http.HandlerFunc {
	if h == nil {
		return func(w http.ResponseWriter, r *http.Request) {
			handler.ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Database not connected")
		}
	}
	return h.Webhook
}

func startExpiryWorker(pool *pgxpool.Pool) {
	if pool == nil {
		return
	}
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		tag, err := pool.Exec(context.Background(), `
			UPDATE reservas SET estado = 'ANULADA'
			WHERE estado = 'PENDIENTE_PAGO'
			  AND fecha_creacion < NOW() - INTERVAL '30 minutes'
		`)
		if err != nil {
			slog.Error("[expiry-worker] error", "error", err)
			continue
		}
		if tag.RowsAffected() > 0 {
			slog.Info("[expiry-worker] reservas anuladas", "count", tag.RowsAffected())
		}
	}
}
