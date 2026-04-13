package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port                     string
	AppURL                   string
	SupabaseURL              string
	SupabaseSecretKey        string
	SupabaseJWTSecret        string
	DatabaseURL              string
	CryptapiWalletAddress    string
	CryptapiCallbackSecret   string
	MetamapWebhookSecret     string
	ComisionPlataformaHuesped float64
	ComisionPlataformaAnfitrion float64
}

func Load() (*Config, error) {
	c := &Config{
		Port:                     getEnv("PORT", "8080"),
		AppURL:                   getEnv("APP_URL", "http://localhost:3000"),
		SupabaseURL:              os.Getenv("SUPABASE_URL"),
		SupabaseSecretKey:        os.Getenv("SUPABASE_SECRET_KEY"),
		SupabaseJWTSecret:        os.Getenv("SUPABASE_JWT_SECRET"),
		DatabaseURL:              os.Getenv("DATABASE_URL"),
		CryptapiWalletAddress:    os.Getenv("CRYPTAPI_WALLET_ADDRESS"),
		CryptapiCallbackSecret:   os.Getenv("CRYPTAPI_CALLBACK_SECRET"),
		MetamapWebhookSecret:     os.Getenv("METAMAP_WEBHOOK_SECRET"),
		ComisionPlataformaHuesped: getEnvFloat("COMISION_PLATAFORMA_HUESPED", 0.06),
		ComisionPlataformaAnfitrion: getEnvFloat("COMISION_PLATAFORMA_ANFITRION", 0.03),
	}

	if c.SupabaseURL == "" {
		return nil, fmt.Errorf("SUPABASE_URL is required")
	}
	if c.SupabaseSecretKey == "" {
		return nil, fmt.Errorf("SUPABASE_SECRET_KEY is required")
	}
	if c.SupabaseJWTSecret == "" {
		return nil, fmt.Errorf("SUPABASE_JWT_SECRET is required")
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
		return fallback
	}
	return f
}
