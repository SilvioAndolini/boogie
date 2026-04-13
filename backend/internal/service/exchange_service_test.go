package service

import (
	"testing"
	"time"

	"github.com/boogie/backend/internal/domain/models"
)

func TestExchangeService_GetCotizacion_ReturnsFallbackOnFailure(t *testing.T) {
	svc := NewExchangeService()

	cot, err := svc.GetCotizacion()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if cot.Tasa <= 0 {
		t.Errorf("expected positive tasa, got %f", cot.Tasa)
	}

	if cot.Fuente == "" {
		t.Error("expected non-empty fuente")
	}
}

func TestExchangeService_CacheWorks(t *testing.T) {
	svc := NewExchangeService()

	cot1, _ := svc.GetCotizacion()

	svc.mu.Lock()
	svc.cached = &models.CotizacionEuro{
		Tasa:              99.99,
		Fuente:            "test",
		UltimaActualizacion: time.Now(),
	}
	svc.cachedAt = time.Now()
	svc.mu.Unlock()

	cot2, _ := svc.GetCotizacion()

	if cot2.Tasa != 99.99 {
		t.Errorf("expected cached tasa 99.99, got %f", cot2.Tasa)
	}

	_ = cot1
}

func TestExchangeService_CacheExpires(t *testing.T) {
	svc := NewExchangeService()

	svc.mu.Lock()
	svc.cached = &models.CotizacionEuro{
		Tasa:              50.00,
		Fuente:            "expired",
		UltimaActualizacion: time.Now(),
	}
	svc.cachedAt = time.Now().Add(-20 * time.Minute)
	svc.cacheTTL = 15 * time.Minute
	svc.mu.Unlock()

	cot, err := svc.GetCotizacion()
	if err != nil {
		t.Logf("GetCotizacion returned error (expected on no API): %v", err)
	}

	if cot.Fuente == "expired" {
		t.Error("cache should have expired")
	}
}
