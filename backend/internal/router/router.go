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
	Healthz     http.HandlerFunc
	Exchange    http.HandlerFunc
	Ubicaciones http.HandlerFunc
}

type RouterOpts struct {
	Handlers           *Handlers
	AuthVerifier       *auth.SupabaseVerifier
	AppURL             string
	ExchangeLimiter    *handlermw.IPRateLimiter
	UbicacionesLimiter *handlermw.IPRateLimiter
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
