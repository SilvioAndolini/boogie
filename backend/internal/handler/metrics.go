package handler

import (
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/boogie/backend/internal/metrics"
)

var (
	reUUID  = regexp.MustCompile(`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`)
	reNumID = regexp.MustCompile(`/\d+`)
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
	path = reUUID.ReplaceAllString(path, ":id")
	path = reNumID.ReplaceAllString(path, "/:id")
	if len(path) > 64 {
		return path[:64]
	}
	return path
}
