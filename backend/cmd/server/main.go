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
)

func main() {
	slog.Info("starting boogie-backend")

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config error", "error", err)
		os.Exit(1)
	}

	_ = auth.NewSupabaseVerifier(cfg.SupabaseJWTSecret)

	db, err := repository.NewPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		slog.Warn("database connection skipped", "error", err)
	}

	exchangeSvc := service.NewExchangeService()
	ubicacionesSvc := service.NewUbicacionesService()

	exchangeHandler := handler.NewExchangeHandler(exchangeSvc)
	ubicacionesHandler := handler.NewUbicacionesHandler(ubicacionesSvc)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler: router.New(&router.RouterOpts{
			Handlers: &router.Handlers{
				Healthz:     handler.Healthz,
				Exchange:    exchangeHandler.Get,
				Ubicaciones: ubicacionesHandler.Search,
			},
			AppURL:             cfg.AppURL,
			ExchangeLimiter:    router.NewExchangeLimiter(),
			UbicacionesLimiter: router.NewUbicacionesLimiter(),
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

	_ = db

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server forced shutdown", "error", err)
	}

	slog.Info("server exited")
}
