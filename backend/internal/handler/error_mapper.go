package handler

import (
	"errors"
	"log/slog"
	"net/http"

	bizerrors "github.com/boogie/backend/internal/domain/errors"
)

func mapError(w http.ResponseWriter, err error, logPrefix string, logArgs ...interface{}) {
	var bizErr *bizerrors.BusinessError
	if errors.As(err, &bizErr) {
		status, code := bizCodeToHTTP(bizErr.Code)
		args := append([]interface{}{"error", err, "code", bizErr.Code}, logArgs...)
		slog.Error(logPrefix, args...)
		ErrorJSON(w, status, code, bizErr.Message)
		return
	}
	args := append([]interface{}{"error", err}, logArgs...)
	slog.Error(logPrefix, args...)
	ErrorJSON(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Error interno del servidor")
}

func bizCodeToHTTP(code bizerrors.Code) (int, string) {
	switch code {
	case bizerrors.CodeNotFound:
		return http.StatusNotFound, "NOT_FOUND"
	case bizerrors.CodeForbidden:
		return http.StatusForbidden, "FORBIDDEN"
	case bizerrors.CodeValidation:
		return http.StatusBadRequest, "VALIDATION_ERROR"
	case bizerrors.CodeBadRequest:
		return http.StatusBadRequest, "BAD_REQUEST"
	case bizerrors.CodeConflict:
		return http.StatusConflict, "CONFLICT"
	case bizerrors.CodeStateConflict:
		return http.StatusBadRequest, "STATE_ERROR"
	case bizerrors.CodePaymentRequired:
		return http.StatusPaymentRequired, "PAYMENT_REQUIRED"
	default:
		return http.StatusBadRequest, "BAD_REQUEST"
	}
}
