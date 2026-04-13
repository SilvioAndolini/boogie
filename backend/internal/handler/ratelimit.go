package handler

import (
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

type IPRateLimiter struct {
	ips     map[string]*rate.Limiter
	mu      sync.RWMutex
	rate    rate.Limit
	burst   int
}

func NewIPRateLimiter(r rate.Limit, burst int) *IPRateLimiter {
	return &IPRateLimiter{
		ips:   make(map[string]*rate.Limiter),
		rate:  r,
		burst: burst,
	}
}

func (l *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	limiter, exists := l.ips[ip]
	if !exists {
		limiter = rate.NewLimiter(l.rate, l.burst)
		l.ips[ip] = limiter
	}
	return limiter
}

func (l *IPRateLimiter) Cleanup() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.ips = make(map[string]*rate.Limiter)
}

func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := GetClientIP(r)
			l := limiter.GetLimiter(ip)

			if !l.Allow() {
				w.Header().Set("Retry-After", "60")
				ErrorJSON(w, http.StatusTooManyRequests, "RATE_LIMITED", "Demasiadas solicitudes. Intenta mas tarde.")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetClientIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded[:min(len(forwarded), 45)]
	}
	realIP := r.Header.Get("X-Real-Ip")
	if realIP != "" {
		return realIP
	}
	return r.RemoteAddr
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
