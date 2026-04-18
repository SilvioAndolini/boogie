package handler

import (
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"

	boogiesentry "github.com/boogie/backend/internal/sentry"
	sentrysdk "github.com/getsentry/sentry-go"
)

func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("panic recovered",
					"error", err,
					"path", r.URL.Path,
					"method", r.Method,
					"stack", string(debug.Stack()),
				)
			sentrysdk.ConfigureScope(func(scope *sentrysdk.Scope) {
				scope.SetTag("request_path", r.URL.Path)
				scope.SetTag("request_method", r.Method)
			})
				boogiesentry.Recover()
				boogiesentry.Flush()
				ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
	ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(ww, r)

		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.statusCode,
			"duration", time.Since(start).String(),
			"ip", r.RemoteAddr,
		)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
