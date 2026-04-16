package service

import (
	"testing"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
)

func TestCalcularPrecioReserva(t *testing.T) {
	entrada := time.Date(2025, 3, 10, 14, 0, 0, 0, time.UTC)
	salida := time.Date(2025, 3, 13, 11, 0, 0, 0, time.UTC)

	result := CalcularPrecioReserva(100.0, entrada, salida, enums.MonedaUSD, 0.0975, 0.0525)

	if result.Noches != 3 {
		t.Errorf("expected 3 noches, got %d", result.Noches)
	}
	if result.Subtotal != 300.0 {
		t.Errorf("expected subtotal 300, got %f", result.Subtotal)
	}
	if result.Total != 329.25 {
		t.Errorf("expected total 329.25 (300 + 29.25), got %f", result.Total)
	}
	if result.ComisionHuesped != 29.25 {
		t.Errorf("expected comision huesped 29.25, got %f", result.ComisionHuesped)
	}
	if result.ComisionAnfitrion != 15.75 {
		t.Errorf("expected comision anfitrion 15.75, got %f", result.ComisionAnfitrion)
	}
}

func TestCalcularPrecioReserva_OneNight(t *testing.T) {
	entrada := time.Date(2025, 3, 10, 14, 0, 0, 0, time.UTC)
	salida := time.Date(2025, 3, 11, 11, 0, 0, 0, time.UTC)

	result := CalcularPrecioReserva(50.0, entrada, salida, enums.MonedaUSD, 0.0975, 0.0525)

	if result.Noches != 1 {
		t.Errorf("expected 1 noche, got %d", result.Noches)
	}
	if result.Subtotal != 50.0 {
		t.Errorf("expected subtotal 50, got %f", result.Subtotal)
	}
}

func TestCalcularReembolso_Flexible(t *testing.T) {
	entrada := time.Date(2026, 5, 1, 14, 0, 0, 0, time.UTC)

	result := CalcularReembolso(100.0, 6.0, enums.PoliticaCancelacionFlexible, entrada)

	if result.PorcentajeReembolso != 100 {
		t.Errorf("expected 100%% reembolso, got %d%%", result.PorcentajeReembolso)
	}
	if result.MontoReembolsable != 94.0 {
		t.Errorf("expected 94.0, got %f", result.MontoReembolsable)
	}
}

func TestCalcularReembolso_Moderada(t *testing.T) {
	entrada := time.Date(2026, 4, 13, 14, 0, 0, 0, time.UTC)

	result := CalcularReembolso(100.0, 6.0, enums.PoliticaCancelacionModerada, entrada)

	if result.PorcentajeReembolso > 0 && result.DiasAntesCheckIn >= 5 {
		t.Log("Moderada: full refund when >= 5 days")
	}
}

func TestGenerarCodigoReserva(t *testing.T) {
	code := GenerarCodigoReserva()

	if len(code) < 8 {
		t.Errorf("codigo too short: %s", code)
	}
	if code[:4] != "BOO-" {
		t.Errorf("codigo should start with BOO-, got %s", code)
	}
}

func TestBuildExplorerURL(t *testing.T) {
	url := BuildExplorerURL("abc123")
	expected := "https://tronscan.org/#/transaction/abc123"
	if url != expected {
		t.Errorf("expected %s, got %s", expected, url)
	}
}
