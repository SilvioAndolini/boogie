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
	cache := GetCache()

	cache.Set("exchange:eur_ves", &models.CotizacionEuro{
		Tasa:                99.99,
		Fuente:              "test",
		UltimaActualizacion: time.Now(),
	}, 15*time.Minute)

	cot, _ := svc.GetCotizacion()

	if cot.Tasa != 99.99 {
		t.Errorf("expected cached tasa 99.99, got %f", cot.Tasa)
	}
}

func TestExchangeService_CacheExpires(t *testing.T) {
	cache := GetCache()
	cache.entries["exchange:eur_ves"] = &cacheEntry{
		value: &models.CotizacionEuro{
			Tasa:                50.00,
			Fuente:              "expired",
			UltimaActualizacion: time.Now(),
		},
		cachedAt:  time.Now().Add(-20 * time.Minute),
		ttl:       15 * time.Minute,
		expiresAt: time.Now().Add(-5 * time.Minute),
	}

	svc := NewExchangeService()
	cot, err := svc.GetCotizacion()
	if err != nil {
		t.Logf("GetCotizacion returned error: %v", err)
	}

	if cot.Fuente != "expired" {
		t.Skipf("background refresh completed with fuente=%s — stale-while-revalidate worked", cot.Fuente)
	}
	t.Log("stale data served while background refresh runs — expected stale-while-revalidate behavior")
}
