package handler

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type ipEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPRateLimiter struct {
	ips   map[string]*ipEntry
	mu    sync.RWMutex
	rate  rate.Limit
	burst int
}

func NewIPRateLimiter(r rate.Limit, burst int) *IPRateLimiter {
	l := &IPRateLimiter{
		ips:   make(map[string]*ipEntry),
		rate:  r,
		burst: burst,
	}
	go l.cleanupLoop()
	return l
}

func (l *IPRateLimiter) cleanupLoop() {
	for range time.NewTicker(10 * time.Minute).C {
		l.Cleanup()
	}
}

func (l *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	l.mu.Lock()
	defer l.mu.Unlock()

	entry, exists := l.ips[ip]
	if !exists {
		entry = &ipEntry{
			limiter:  rate.NewLimiter(l.rate, l.burst),
			lastSeen: time.Now(),
		}
		l.ips[ip] = entry
	} else {
		entry.lastSeen = time.Now()
	}
	return entry.limiter
}

func (l *IPRateLimiter) Cleanup() {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	for ip, entry := range l.ips {
		if now.Sub(entry.lastSeen) > 30*time.Minute {
			delete(l.ips, ip)
		}
	}
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
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		parts := strings.Split(fwd, ",")
		return strings.TrimSpace(parts[len(parts)-1])
	}
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	return ip
}
