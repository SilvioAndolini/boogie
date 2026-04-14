package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserIDKey    contextKey = "user_id"
	UserEmailKey contextKey = "user_email"
	UserRoleKey  contextKey = "user_role"
)

type UserClaims struct {
	ID    string
	Email string
	Role  string
}

type jwksKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

type jwksResponse struct {
	Keys []jwksKey `json:"keys"`
}

type SupabaseVerifier struct {
	supabaseURL string
	keys        map[string]*ecdsa.PublicKey
	mu          sync.RWMutex
	fetchedAt   time.Time
	FetchRole   func(ctx context.Context, userID string) string
}

func NewSupabaseVerifier(supabaseURL string) *SupabaseVerifier {
	v := &SupabaseVerifier{
		supabaseURL: strings.TrimRight(supabaseURL, "/"),
		keys:        make(map[string]*ecdsa.PublicKey),
	}
	if err := v.fetchKeysWithRetry(); err != nil {
		slog.Error("[auth] JWKS fetch failed after retries — server cannot verify tokens", "error", err)
	}
	return v
}

func (v *SupabaseVerifier) fetchKeysWithRetry() error {
	var lastErr error
	for attempt := 0; attempt < 5; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(attempt) * 2 * time.Second
			slog.Warn("[auth] JWKS retry", "attempt", attempt+1, "backoff", backoff)
			time.Sleep(backoff)
		}
		if err := v.fetchKeys(); err != nil {
			lastErr = err
			continue
		}
		if len(v.keysSnapshot()) > 0 {
			return nil
		}
		lastErr = fmt.Errorf("JWKS returned 0 keys")
	}
	return lastErr
}

func (v *SupabaseVerifier) keysSnapshot() map[string]*ecdsa.PublicKey {
	v.mu.RLock()
	defer v.mu.RUnlock()
	snapshot := make(map[string]*ecdsa.PublicKey, len(v.keys))
	for k, pub := range v.keys {
		snapshot[k] = pub
	}
	return snapshot
}

func (v *SupabaseVerifier) fetchKeys() error {
	url := v.supabaseURL + "/auth/v1/.well-known/jwks.json"

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("JWKS HTTP request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("JWKS HTTP status %d", resp.StatusCode)
	}

	var jwks jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("JWKS JSON decode: %w", err)
	}

	newKeys := make(map[string]*ecdsa.PublicKey)
	for _, k := range jwks.Keys {
		pubKey, err := parseECDSAPublicKey(k.X, k.Y)
		if err != nil {
			slog.Warn("[auth] skipping JWKS key", "kid", k.Kid, "error", err)
			continue
		}
		newKeys[k.Kid] = pubKey
	}

	if len(newKeys) == 0 {
		return fmt.Errorf("JWKS returned 0 valid keys")
	}

	v.mu.Lock()
	v.keys = newKeys
	v.fetchedAt = time.Now()
	v.mu.Unlock()

	slog.Info("[auth] JWKS keys loaded", "count", len(newKeys))
	return nil
}

func (v *SupabaseVerifier) getKey(kid string) *ecdsa.PublicKey {
	v.mu.RLock()
	if time.Since(v.fetchedAt) > 1*time.Hour {
		v.mu.RUnlock()
		if err := v.fetchKeys(); err != nil {
			slog.Error("[auth] JWKS background refresh failed", "error", err)
		}
		v.mu.RLock()
	}
	defer v.mu.RUnlock()
	return v.keys[kid]
}

func (v *SupabaseVerifier) VerifyToken(tokenString string) (*UserClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodECDSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}

		kid, _ := t.Header["kid"].(string)
		key := v.getKey(kid)
		if key == nil {
			v.fetchKeys()
			key = v.getKey(kid)
		}
		if key == nil {
			return nil, fmt.Errorf("key not found for kid: %s", kid)
		}
		return key, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	sub, _ := claims.GetSubject()
	email, _ := claims["email"].(string)

	role := ""
	if appMeta, ok := claims["app_metadata"].(map[string]interface{}); ok {
		for _, key := range []string{"rol", "role"} {
			if r, ok := appMeta[key].(string); ok && r != "" {
				role = r
				break
			}
		}
	}
	if role == "" {
		if r, ok := claims["role"].(string); ok {
			role = r
		}
	}

	return &UserClaims{
		ID:    sub,
		Email: email,
		Role:  role,
	}, nil
}

func (v *SupabaseVerifier) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeAuthError(w, http.StatusUnauthorized, "AUTH_MISSING_TOKEN", "Authorization header required")
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			writeAuthError(w, http.StatusUnauthorized, "AUTH_INVALID_TOKEN", "Invalid authorization format")
			return
		}

		claims, err := v.VerifyToken(tokenString)
		if err != nil {
			slog.Warn("[auth] token verify failed", "error", err)
			writeAuthError(w, http.StatusUnauthorized, "AUTH_INVALID_TOKEN", "Invalid or expired token")
			return
		}

		role := claims.Role
		if v.FetchRole != nil {
			if dbRole := v.FetchRole(r.Context(), claims.ID); dbRole != "" {
				role = dbRole
			}
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.ID)
		ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
		ctx = context.WithValue(ctx, UserRoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func writeAuthError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if _, err := w.Write([]byte(fmt.Sprintf(`{"error":{"code":"%s","message":"%s"}}`, code, message))); err != nil {
		slog.Error("[auth] failed to write error response", "error", err)
	}
}

func GetUserID(ctx context.Context) string {
	if v, ok := ctx.Value(UserIDKey).(string); ok {
		return v
	}
	return ""
}

func GetUserEmail(ctx context.Context) string {
	if v, ok := ctx.Value(UserEmailKey).(string); ok {
		return v
	}
	return ""
}

func GetUserRole(ctx context.Context) string {
	if v, ok := ctx.Value(UserRoleKey).(string); ok {
		return v
	}
	return ""
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := strings.ToUpper(GetUserRole(r.Context()))
		if role != "ADMIN" && role != "CEO" {
			writeAuthError(w, http.StatusForbidden, "AUTH_NOT_ADMIN", "Admin access required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func parseECDSAPublicKey(xStr, yStr string) (*ecdsa.PublicKey, error) {
	xBytes, err := base64.RawURLEncoding.DecodeString(xStr)
	if err != nil {
		return nil, fmt.Errorf("failed to decode x: %w", err)
	}
	yBytes, err := base64.RawURLEncoding.DecodeString(yStr)
	if err != nil {
		return nil, fmt.Errorf("failed to decode y: %w", err)
	}

	x := new(big.Int).SetBytes(xBytes)
	y := new(big.Int).SetBytes(yBytes)

	return &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     x,
		Y:     y,
	}, nil
}
