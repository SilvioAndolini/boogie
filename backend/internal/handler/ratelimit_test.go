package handler

import (
	"context"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func TestGetClientIP_Forwarded(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-Forwarded-For", "1.2.3.4, 5.6.7.8")

	ip := GetClientIP(req)
	if ip != "1.2.3.4" {
		t.Errorf("expected 1.2.3.4, got %s", ip)
	}
}

func TestRateLimiter_NilClient_Denies(t *testing.T) {
	limiter := NewRedisRateLimiter(nil, 5, time.Minute)
	allowed, err := limiter.Allow(context.Background(), "test:key")
	if allowed {
		t.Fatal("expected denied (false) with nil client, got allowed (true)")
	}
	if err == nil {
		t.Fatal("expected error with nil client, got nil")
	}
}

func TestRateLimiter_RedisError_Denies(t *testing.T) {
	client := redis.NewClient(&redis.Options{
		Addr: "127.0.0.1:1",
	})
	defer client.Close()

	limiter := NewRedisRateLimiter(client, 5, time.Minute)
	allowed, err := limiter.Allow(context.Background(), "test:key")
	if allowed {
		t.Fatal("expected denied (false) on Redis error, got allowed (true)")
	}
	if err == nil {
		t.Fatal("expected error on Redis failure, got nil")
	}
}
