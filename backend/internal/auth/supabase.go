package auth

import (
	"context"
	"net/http"
	"strings"

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

type SupabaseVerifier struct {
	jwtSecret string
}

func NewSupabaseVerifier(jwtSecret string) *SupabaseVerifier {
	return &SupabaseVerifier{jwtSecret: jwtSecret}
}

func (v *SupabaseVerifier) VerifyToken(tokenString string) (*UserClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(v.jwtSecret), nil
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
