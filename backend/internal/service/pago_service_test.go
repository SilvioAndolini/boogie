package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEnvOrDefault(t *testing.T) {
	assert.Equal(t, "fallback", envOrDefault("NONEXISTENT_VAR_XYZ", "fallback"))
}

func TestPaymentDataService(t *testing.T) {
	svc := NewPaymentDataService()
	data := svc.GetPaymentData()

	assert.NotNil(t, data)
	assert.Contains(t, data, "TRANSFERENCIA_BANCARIA")
	assert.Contains(t, data, "PAGO_MOVIL")
	assert.Contains(t, data, "ZELLE")
	assert.Contains(t, data, "EFECTIVO_FARMATODO")
	assert.Contains(t, data, "USDT")

	tb := data["TRANSFERENCIA_BANCARIA"]
	assert.Contains(t, tb, "banco")
	assert.Contains(t, tb, "cuenta")
	assert.Contains(t, tb, "titular")
	assert.Contains(t, tb, "cedula")
}
