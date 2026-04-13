package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRateLimitMiddleware_AllowsRequests(t *testing.T) {
	limiter := NewIPRateLimiter(100, 5)
	mw := RateLimitMiddleware(limiter)

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("GET", "/", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("request %d: expected 200, got %d", i, w.Code)
		}
	}
}

func TestRateLimitMiddleware_BlocksExcessRequests(t *testing.T) {
	limiter := NewIPRateLimiter(100, 2)
	mw := RateLimitMiddleware(limiter)

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:1234"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		if i < 2 && w.Code != http.StatusOK {
			t.Errorf("request %d: expected 200, got %d", i, w.Code)
		}

		if i == 2 && w.Code != http.StatusTooManyRequests {
			t.Errorf("request %d: expected 429, got %d", i, w.Code)
		}
	}
}

func TestGetClientIP_Forwarded(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("X-Forwarded-For", "1.2.3.4, 5.6.7.8")

	ip := GetClientIP(req)
	if ip != "1.2.3.4" {
		t.Errorf("expected 1.2.3.4, got %s", ip)
	}
}
