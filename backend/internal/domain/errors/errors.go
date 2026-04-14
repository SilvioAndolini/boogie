// Package errors defines typed business errors used across the backend.
//
// Handlers use errors.As to match these types and return appropriate HTTP status codes,
// replacing the fragile substring-matching approach.
package errors

import "fmt"

// Code identifies the category of a business error.
// Handlers map codes to HTTP status codes.
type Code string

const (
	CodeNotFound          Code = "NOT_FOUND"
	CodeForbidden         Code = "FORBIDDEN"
	CodeBadRequest        Code = "BAD_REQUEST"
	CodeValidation        Code = "VALIDATION_ERROR"
	CodeConflict          Code = "CONFLICT"
	CodePaymentRequired   Code = "PAYMENT_REQUIRED"
	CodeStateConflict     Code = "STATE_CONFLICT"
)

// BusinessError represents a domain-level error with a structured code.
// Use this for all expected business-rule violations so handlers can
// respond with the correct HTTP status without parsing error messages.
type BusinessError struct {
	Code    Code
	Message string
	Err     error
}

func (e *BusinessError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s", e.Message, e.Err.Error())
	}
	return e.Message
}

func (e *BusinessError) Unwrap() error {
	return e.Err
}

// New creates a BusinessError with the given code and message.
func New(code Code, msg string) *BusinessError {
	return &BusinessError{Code: code, Message: msg}
}

// Wrap creates a BusinessError wrapping an underlying error.
func Wrap(code Code, msg string, err error) *BusinessError {
	return &BusinessError{Code: code, Message: msg, Err: err}
}

// PropiedadNoEncontrada returns a not-found error for a propiedad.
func PropiedadNoEncontrada() *BusinessError {
	return New(CodeNotFound, "propiedad no encontrada")
}

// PropiedadNoPublicada returns a validation error when propiedad is not published.
func PropiedadNoPublicada() *BusinessError {
	return New(CodeValidation, "la propiedad no esta publicada")
}

// PropiedadPropia returns a forbidden error when user tries to book their own property.
func PropiedadPropia() *BusinessError {
	return New(CodeForbidden, "no puedes reservar tu propia propiedad")
}

// CapacidadExcedida returns a validation error for guest count.
func CapacidadExcedida(max int) *BusinessError {
	return New(CodeValidation, fmt.Sprintf("capacidad maxima es %d huespedes", max))
}

// EstanciaInvalida returns a validation error for night count.
func EstanciaInvalida(msg string) *BusinessError {
	return New(CodeValidation, msg)
}

// FechaPasada returns a validation error for past dates.
func FechaPasada() *BusinessError {
	return New(CodeValidation, "la fecha de entrada no puede ser en el pasado")
}

// FechaSalidaInvalida returns a validation error for exit date.
func FechaSalidaInvalida() *BusinessError {
	return New(CodeValidation, "la fecha de salida debe ser posterior a la de entrada")
}

// NochesFueraDeRango returns a validation error for night range.
func NochesFueraDeRango() *BusinessError {
	return New(CodeValidation, "estancia debe ser entre 1 y 365 noches")
}

// DisponibilidadConflict returns a conflict error when dates are taken.
func DisponibilidadConflict(msg string) *BusinessError {
	return New(CodeConflict, msg)
}

// Permisos returns a forbidden error for unauthorized actions.
func Permisos(msg string) *BusinessError {
	return New(CodeForbidden, msg)
}

// EstadoInvalido returns a state conflict error when the reserva is in the wrong state.
func EstadoInvalido(msg string) *BusinessError {
	return New(CodeStateConflict, msg)
}

// ReservaNoEncontrada returns a not-found error for a reserva.
func ReservaNoEncontrada() *BusinessError {
	return New(CodeNotFound, "reserva no encontrada")
}

// AccionInvalida returns a bad-request error for invalid actions.
func AccionInvalida(msg string) *BusinessError {
	return New(CodeBadRequest, msg)
}

// PagoSoloHuesped returns a forbidden error when non-guest tries to pay.
func PagoSoloHuesped() *BusinessError {
	return New(CodeForbidden, "solo el huesped puede registrar pagos")
}
