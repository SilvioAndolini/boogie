package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	sentrysdk "github.com/getsentry/sentry-go"
)

// APIResponse wraps successful responses in a {data: ...} envelope.
type APIResponse struct {
	Data interface{} `json:"data,omitempty"`
	Meta *Meta       `json:"meta,omitempty"`
}

// APIError wraps error responses in an {error: ...} envelope.
type APIError struct {
	Error ErrorBody `json:"error"`
}

// ErrorBody contains structured error details.
type ErrorBody struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Meta contains pagination metadata.
type Meta struct {
	Page    int `json:"page,omitempty"`
	PerPage int `json:"perPage,omitempty"`
	Total   int `json:"total,omitempty"`
}

// JSON writes a successful JSON response wrapped in the {data: ...} envelope.
func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(APIResponse{Data: data}); err != nil {
		slog.Error("[response] JSON encode error", "error", err, "status", status)
	}
}

// JSONWithMeta writes a successful JSON response with pagination metadata.
func JSONWithMeta(w http.ResponseWriter, status int, data interface{}, meta Meta) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(APIResponse{Data: data, Meta: &meta}); err != nil {
		slog.Error("[response] JSON encode error", "error", err, "status", status)
	}
}

// ErrorJSON writes an error JSON response.
func ErrorJSON(w http.ResponseWriter, status int, code string, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(APIError{
		Error: ErrorBody{Code: code, Message: message},
	}); err != nil {
		slog.Error("[response] error JSON encode", "error", err, "status", status)
	}
}

// CaptureError sends err to Sentry (when status >= 500) and writes an error JSON response.
func CaptureError(w http.ResponseWriter, r *http.Request, status int, code string, message string, err error) {
	if status >= 500 && err != nil {
		if hub := sentrysdk.GetHubFromContext(r.Context()); hub != nil {
			hub.Scope().SetTag("http.status", http.StatusText(status))
			hub.Scope().SetTag("error_code", code)
			hub.CaptureException(err)
		} else {
			sentrysdk.CaptureException(err)
		}
	}
	ErrorJSON(w, status, code, message)
}

// ErrorJSONWithDetails writes an error JSON response with extra details.
func ErrorJSONWithDetails(w http.ResponseWriter, status int, code string, message string, details interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(APIError{
		Error: ErrorBody{Code: code, Message: message, Details: details},
	}); err != nil {
		slog.Error("[response] error JSON encode", "error", err, "status", status)
	}
}

// DecodeJSON decodes request body with DisallowUnknownFields.
func DecodeJSON(r *http.Request, v interface{}) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}
