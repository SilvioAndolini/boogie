package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/boogie/backend/internal/sentry"
)

func Healthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func SentryTest(w http.ResponseWriter, r *http.Request) {
	sentry.CaptureException(errors.New("sentry test — integration verified"))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "error_sent",
		"message": "check sentry dashboard",
	})
}
