package handler

import (
	"context"
	"net"
	"net/http"
	"reflect"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisRateLimiter struct {
	client   redis.Cmdable
	requests int
	window   time.Duration
}

func NewRedisRateLimiter(client redis.Cmdable, requests int, window time.Duration) *RedisRateLimiter {
	return &RedisRateLimiter{
		client:   client,
		requests: requests,
		window:   window,
	}
}

func (l *RedisRateLimiter) Allow(ctx context.Context, key string) (bool, error) {
	if l.client == nil {
		return true, nil
	}
	v := reflect.ValueOf(l.client)
	if !v.IsValid() || (v.Kind() == reflect.Ptr && v.IsNil()) {
		return true, nil
	}
	fullKey := "ratelimit:" + key
	count, err := l.client.Incr(ctx, fullKey).Result()
	if err != nil {
		return true, nil
	}
	if count == 1 {
		l.client.Expire(ctx, fullKey, l.window)
	}
	return count <= int64(l.requests), nil
}

func RateLimitMiddleware(limiter *RedisRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := GetClientIP(r)
			group := "general"
			if strings.HasPrefix(r.URL.Path, "/api/v1/auth/") {
				group = "auth"
			}
			allowed, err := limiter.Allow(r.Context(), group+":"+ip)
			if err != nil || !allowed {
				w.Header().Set("Retry-After", "60")
				ErrorJSON(w, http.StatusTooManyRequests, "RATE_LIMITED", "Demasiadas solicitudes. Intenta mas tarde.")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func GetClientIP(r *http.Request) string {
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
