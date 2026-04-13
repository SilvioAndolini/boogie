package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMapMoonPayStatus(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"completed", "VERIFICADO"},
		{"pending", "EN_VERIFICACION"},
		{"waitingAuthorization", "EN_VERIFICACION"},
		{"waitingPayment", "EN_VERIFICACION"},
		{"paymentInProgress", "EN_VERIFICACION"},
		{"cryptoTransferInProgress", "EN_VERIFICACION"},
		{"failed", "RECHAZADO"},
		{"refunded", "RECHAZADO"},
		{"unknown", "PENDIENTE"},
		{"", "PENDIENTE"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := mapMoonPayStatus(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

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
	assert.Contains(t, data, "TARJETA_INTERNACIONAL")

	tb := data["TRANSFERENCIA_BANCARIA"]
	assert.Contains(t, tb, "banco")
	assert.Contains(t, tb, "cuenta")
	assert.Contains(t, tb, "titular")
	assert.Contains(t, tb, "cedula")
}
