package config

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port                        string
	AppURL                      string
	SupabaseURL                 string
	SupabaseSecretKey           string
	DatabaseURL                 string
	SentryDSN                   string
	RedisAddr                   string
	RedisPassword               string
	CryptapiWalletAddress       string
	CryptapiCallbackSecret      string
	CronSecret                  string
	MetamapWebhookSecret        string
	ComisionPlataformaHuesped   float64
	ComisionPlataformaAnfitrion float64
}

// Load reads configuration from environment variables and validates required fields.
func Load() (*Config, error) {
	c := &Config{
		Port:                        getEnv("PORT", "8080"),
		AppURL:                      getEnv("APP_URL", "http://localhost:3000"),
		SupabaseURL:                 os.Getenv("SUPABASE_URL"),
		SupabaseSecretKey:           os.Getenv("SUPABASE_SECRET_KEY"),
		DatabaseURL:                 os.Getenv("DATABASE_URL"),
		SentryDSN:                   os.Getenv("SENTRY_DSN"),
		RedisAddr:                   getEnv("REDIS_ADDR", ""),
		RedisPassword:               os.Getenv("REDIS_PASSWORD"),
		CryptapiWalletAddress:       os.Getenv("CRYPTAPI_WALLET_ADDRESS"),
		CryptapiCallbackSecret:      os.Getenv("CRYPTAPI_CALLBACK_SECRET"),
		CronSecret:                  os.Getenv("CRON_SECRET"),
		MetamapWebhookSecret:        os.Getenv("METAMAP_WEBHOOK_SECRET"),
		ComisionPlataformaHuesped:   getEnvFloat("COMISION_PLATAFORMA_HUESPED", 0.0975),
		ComisionPlataformaAnfitrion: getEnvFloat("COMISION_PLATAFORMA_ANFITRION", 0.0525),
	}

	if c.SupabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required")
	}
	if c.SupabaseSecretKey == "" {
		return nil, fmt.Errorf("SUPABASE_SECRET_KEY is required")
	}
	if c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return c, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvFloat(key string, fallback float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		slog.Warn("[config] invalid float env, using fallback", "key", key, "value", v, "fallback", fallback)
		return fallback
	}
	return f
}
