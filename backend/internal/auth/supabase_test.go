package auth

import (
	"testing"

	"github.com/golang-jwt/jwt/v5"
)

func makeTestToken(secret string, claims jwt.MapClaims) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, _ := token.SignedString([]byte(secret))
	return s
}

func TestSupabaseVerifier_ValidToken(t *testing.T) {
	secret := "test-secret-key-1234567890"
	v := NewSupabaseVerifier(secret)

	token := makeTestToken(secret, jwt.MapClaims{
		"sub":   "user-123",
		"email": "test@example.com",
		"app_metadata": map[string]interface{}{
			"rol": "BOOGER",
		},
	})

	claims, err := v.VerifyToken(token)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if claims.ID != "user-123" {
		t.Errorf("expected ID user-123, got %s", claims.ID)
	}

	if claims.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", claims.Email)
	}

	if claims.Role != "BOOGER" {
		t.Errorf("expected role BOOGER, got %s", claims.Role)
	}
}

func TestSupabaseVerifier_InvalidSecret(t *testing.T) {
	v := NewSupabaseVerifier("correct-secret")

	token := makeTestToken("wrong-secret", jwt.MapClaims{
		"sub": "user-123",
	})

	_, err := v.VerifyToken(token)
	if err == nil {
		t.Error("expected error for wrong secret")
	}
}

func TestSupabaseVerifier_ExpiredToken(t *testing.T) {
	v := NewSupabaseVerifier("test-secret")

	claims := jwt.MapClaims{
		"sub": "user-123",
		"exp": float64(1),
		"iat": float64(0),
	}
	token := makeTestToken("test-secret", claims)

	_, err := v.VerifyToken(token)
	if err == nil {
		t.Error("expected error for expired token")
	}
}
