package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/boogie/backend/internal/metrics"
)

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		path := normalizePath(r.URL.Path)
		method := r.Method

		metrics.HttpRequestsInFlight.WithLabelValues(method).Inc()
		defer metrics.HttpRequestsInFlight.WithLabelValues(method).Dec()

		rec := &statusRecorder{ResponseWriter: w, status: 200}
		next.ServeHTTP(rec, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(rec.status)

		metrics.HttpRequestDuration.WithLabelValues(method, path).Observe(duration)
		metrics.HttpRequestsTotal.WithLabelValues(method, path, status).Inc()
	})
}

func normalizePath(path string) string {
	if len(path) > 32 {
		return path[:32]
	}
	return path
}
