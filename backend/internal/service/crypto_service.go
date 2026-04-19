package service

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/domain/idgen"
	"github.com/boogie/backend/internal/domain/util"
)

const (
	CryptapiBase             = "https://api.cryptapi.io"
	CryptapiTicker           = "trc20/usdt"
	CryptapiNetwork          = "TRC20"
	CryptapiCurrency         = "USDT"
	CryptapiMinConfirmations = 1
)

type CryptapiConfig struct {
	WalletAddress   string
	CallbackSecret  string
	CallbackBaseURL string
}

type CryptAPIResult struct {
	AddressIn string `json:"address_in"`
	Status    string `json:"status"`
}

type PrecioReserva struct {
	Noches            int          `json:"noches"`
	PrecioPorNoche    float64      `json:"precio_por_noche"`
	Subtotal          float64      `json:"subtotal"`
	ComisionHuesped   float64      `json:"comision_huesped"`
	ComisionAnfitrion float64      `json:"comision_anfitrion"`
	Total             float64      `json:"total"`
	Moneda            enums.Moneda `json:"moneda"`
}

type ReembolsoCalculado struct {
	TotalReserva        float64 `json:"total_reserva"`
	ComisionPlataforma  float64 `json:"comision_plataforma"`
	MontoReembolsable   float64 `json:"monto_reembolsable"`
	MontoNoReembolsable float64 `json:"monto_no_reembolsable"`
	PorcentajeReembolso int     `json:"porcentaje_reembolso"`
	PoliticaAplicable   string  `json:"politica_aplicable"`
	DiasAntesCheckIn    int     `json:"dias_antes_check_in"`
	Mensaje             string  `json:"mensaje"`
}

type CryptoService struct {
	Config     CryptapiConfig
	comisionH  float64
	comisionA  float64
	httpClient *http.Client
}

func NewCryptoService(cfg CryptapiConfig, comisionH, comisionA float64) *CryptoService {
	return &CryptoService{
		Config:    cfg,
		comisionH: comisionH,
		comisionA: comisionA,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (s *CryptoService) CreateAddress(callbackURL string) (*CryptAPIResult, error) {
	apiURL := fmt.Sprintf("%s/%s/create/?callback=%s&address=%s&pending=1",
		CryptapiBase, CryptapiTicker, url.QueryEscape(callbackURL), s.Config.WalletAddress,
	)

	resp, err := s.httpClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("cryptapi request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("cryptapi read body: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("cryptapi status %d: %s", resp.StatusCode, string(body))
	}

	var data struct {
		Status    string `json:"status"`
		AddressIn string `json:"address_in"`
	}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("cryptapi parse error: %w", err)
	}

	if data.Status != "success" {
		return nil, fmt.Errorf("cryptapi error: %s", string(body))
	}

	return &CryptAPIResult{
		AddressIn: data.AddressIn,
		Status:    data.Status,
	}, nil
}

func (s *CryptoService) BuildCallbackURL(params map[string]string) string {
	parts := []string{}
	for k, v := range params {
		parts = append(parts, fmt.Sprintf("%s=%s", k, url.QueryEscape(v)))
	}
	return fmt.Sprintf("%s/api/crypto/callback?%s",
		s.Config.CallbackBaseURL, strings.Join(parts, "&"),
	)
}

func (s *CryptoService) VerifyCallbackSecret(secret string) bool {
	return subtle.ConstantTimeCompare([]byte(secret), []byte(s.Config.CallbackSecret)) == 1
}

func (s *CryptoService) Comisiones() (huesped, anfitrion float64) {
	return s.comisionH, s.comisionA
}

func CalcularPrecioReserva(precioPorNoche float64, fechaEntrada, fechaSalida time.Time, moneda enums.Moneda, comisionH, comisionA float64) PrecioReserva {
	dEntrada := time.Date(fechaEntrada.Year(), fechaEntrada.Month(), fechaEntrada.Day(), 0, 0, 0, 0, time.UTC)
	dSalida := time.Date(fechaSalida.Year(), fechaSalida.Month(), fechaSalida.Day(), 0, 0, 0, 0, time.UTC)
	noches := int(dSalida.Sub(dEntrada).Hours() / 24)
	if noches < 1 {
		noches = 1
	}

	subtotal := util.Round2(precioPorNoche * float64(noches))
	cH := util.Round2(subtotal * comisionH)
	cA := util.Round2(subtotal * comisionA)
	total := util.Round2(subtotal + cH)

	return PrecioReserva{
		Noches:            noches,
		PrecioPorNoche:    precioPorNoche,
		Subtotal:          subtotal,
		ComisionHuesped:   cH,
		ComisionAnfitrion: cA,
		Total:             total,
		Moneda:            moneda,
	}
}

func CalcularReembolso(totalReserva, comisionPlataforma float64, politica enums.PoliticaCancelacion, fechaEntrada time.Time) ReembolsoCalculado {
	now := time.Now()
	hoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	checkIn := time.Date(fechaEntrada.Year(), fechaEntrada.Month(), fechaEntrada.Day(), 14, 0, 0, 0, fechaEntrada.Location())

	diasAntes := int(checkIn.Sub(hoy).Hours() / 24)

	var porcentaje int
	var montoReembolsable float64

	switch politica {
	case enums.PoliticaCancelacionFlexible:
		if diasAntes >= 1 {
			porcentaje = 100
			montoReembolsable = totalReserva - comisionPlataforma
		}
	case enums.PoliticaCancelacionModerada:
		if diasAntes >= 5 {
			porcentaje = 100
			montoReembolsable = totalReserva - comisionPlataforma
		} else if diasAntes >= 1 {
			porcentaje = 50
			montoReembolsable = (totalReserva * 0.5) - comisionPlataforma
		}
	case enums.PoliticaCancelacionEstricta:
		if diasAntes >= 14 {
			porcentaje = 100
			montoReembolsable = totalReserva - comisionPlataforma
		} else if diasAntes >= 7 {
			porcentaje = 50
			montoReembolsable = (totalReserva * 0.5) - comisionPlataforma
		}
	}

	montoReembolsable = util.Round2(max(0, montoReembolsable))

	var mensaje string
	switch {
	case porcentaje == 100:
		mensaje = fmt.Sprintf("Reembolso completo de $%.2f", montoReembolsable)
	case porcentaje > 0:
		mensaje = fmt.Sprintf("Reembolso parcial del %d%%: $%.2f", porcentaje, montoReembolsable)
	default:
		mensaje = "No aplica para reembolso segun la politica de cancelacion"
	}

	return ReembolsoCalculado{
		TotalReserva:        totalReserva,
		ComisionPlataforma:  comisionPlataforma,
		MontoReembolsable:   montoReembolsable,
		MontoNoReembolsable: util.Round2(totalReserva - montoReembolsable),
		PorcentajeReembolso: porcentaje,
		PoliticaAplicable:   string(politica),
		DiasAntesCheckIn:    diasAntes,
		Mensaje:             mensaje,
	}
}

func GenerarCodigoReserva() string {
	return idgen.CodigoReserva()
}

func BuildExplorerURL(txHash string) string {
	return "https://tronscan.org/#/transaction/" + txHash
}

func (s *CryptoService) GetLogs(callbackURL string) []interface{} {
	apiURL := fmt.Sprintf("%s/%s/logs/?callback=%s", CryptapiBase, CryptapiTicker, callbackURL)
	resp, err := s.httpClient.Get(apiURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		slog.Warn("cryptapi logs fetch failed", "error", err)
		return nil
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil
	}

	if logs, ok := data["logs"].([]interface{}); ok {
		return logs
	}
	return nil
}
