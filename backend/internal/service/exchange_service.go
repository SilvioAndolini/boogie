package service

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/boogie/backend/internal/domain/models"
)

type ExchangeService struct {
	mu         sync.RWMutex
	cached     *models.CotizacionEuro
	cachedAt   time.Time
	cacheTTL   time.Duration
	httpClient *http.Client
}

func NewExchangeService() *ExchangeService {
	return &ExchangeService{
		cacheTTL: 15 * time.Minute,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *ExchangeService) GetCotizacion() (*models.CotizacionEuro, error) {
	s.mu.RLock()
	if s.cached != nil && time.Since(s.cachedAt) < s.cacheTTL {
		result := s.cached
		s.mu.RUnlock()
		return result, nil
	}
	s.mu.RUnlock()

	cotizacion, err := s.fetchCotizacion()
	if err != nil {
		slog.Error("failed to fetch exchange rate", "error", err)
		s.mu.RLock()
		stale := s.cached
		s.mu.RUnlock()
		if stale != nil {
			return stale, nil
		}
		return &models.CotizacionEuro{
			Tasa:              78.39,
			Fuente:            "Ref.",
			UltimaActualizacion: time.Now(),
		}, nil
	}

	s.mu.Lock()
	s.cached = cotizacion
	s.cachedAt = time.Now()
	s.mu.Unlock()

	return cotizacion, nil
}

func (s *ExchangeService) fetchCotizacion() (*models.CotizacionEuro, error) {
	if c, err := s.fetchFromERApi(); err == nil {
		return c, nil
	}
	slog.Warn("ER-API failed, trying fallback")

	if c, err := s.fetchFromExchangeRateAPI(); err == nil {
		return c, nil
	}
	slog.Warn("ExchangeRate-API failed too")

	return nil, fmt.Errorf("all exchange rate sources failed")
}

func (s *ExchangeService) fetchFromERApi() (*models.CotizacionEuro, error) {
	resp, err := s.httpClient.Get("https://open.er-api.com/v6/latest/EUR")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ER-API status: %d", resp.StatusCode)
	}

	var data struct {
		Result             string             `json:"result"`
		Rates              map[string]float64 `json:"rates"`
		TimeLastUpdateUnix int64              `json:"time_last_update_unix"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if data.Result != "success" {
		return nil, fmt.Errorf("ER-API result: %s", data.Result)
	}

	ves, ok := data.Rates["VES"]
	if !ok {
		return nil, fmt.Errorf("VES rate not found")
	}

	return &models.CotizacionEuro{
		Tasa:              ves,
		Fuente:            "BCV",
		UltimaActualizacion: time.Unix(data.TimeLastUpdateUnix, 0),
	}, nil
}

func (s *ExchangeService) fetchFromExchangeRateAPI() (*models.CotizacionEuro, error) {
	resp, err := s.httpClient.Get("https://api.exchangerate-api.com/v4/latest/EUR")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ExchangeRate-API status: %d", resp.StatusCode)
	}

	var data struct {
		Rates map[string]float64 `json:"rates"`
		Date  string             `json:"date"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	ves, ok := data.Rates["VES"]
	if !ok {
		return nil, fmt.Errorf("VES rate not found")
	}

	lastUpdate := time.Now()
	if data.Date != "" {
		if t, err := time.Parse("2006-01-02", data.Date); err == nil {
			lastUpdate = t
		}
	}

	return &models.CotizacionEuro{
		Tasa:              ves,
		Fuente:            "BCV",
		UltimaActualizacion: lastUpdate,
	}, nil
}
