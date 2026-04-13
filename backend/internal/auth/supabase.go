package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
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
}

func NewSupabaseVerifier(supabaseURL string) *SupabaseVerifier {
	v := &SupabaseVerifier{
		supabaseURL: strings.TrimRight(supabaseURL, "/"),
		keys:        make(map[string]*ecdsa.PublicKey),
	}
	v.fetchKeys()
	return v
}

func (v *SupabaseVerifier) fetchKeys() {
	url := v.supabaseURL + "/auth/v1/jwks"

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	var jwks jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return
	}

	newKeys := make(map[string]*ecdsa.PublicKey)
	for _, k := range jwks.Keys {
		pubKey, err := parseECDSAPublicKey(k.X, k.Y)
		if err != nil {
			continue
		}
		newKeys[k.Kid] = pubKey
	}

	v.mu.Lock()
	v.keys = newKeys
	v.fetchedAt = time.Now()
	v.mu.Unlock()
}

func (v *SupabaseVerifier) getKey(kid string) *ecdsa.PublicKey {
	v.mu.RLock()
	if time.Since(v.fetchedAt) > 1*time.Hour {
		v.mu.RUnlock()
		v.fetchKeys()
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
		if r, ok := appMeta["rol"].(string); ok {
			role = r
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
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":{"code":"AUTH_MISSING_TOKEN","message":"Authorization header required"}}`))
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":{"code":"AUTH_INVALID_TOKEN","message":"Invalid authorization format"}}`))
			return
		}

		claims, err := v.VerifyToken(tokenString)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":{"code":"AUTH_INVALID_TOKEN","message":"Invalid or expired token"}}`))
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.ID)
		ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
		ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
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
		role := GetUserRole(r.Context())
		if role != "ADMIN" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":{"code":"AUTH_NOT_ADMIN","message":"Admin access required"}}`))
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
