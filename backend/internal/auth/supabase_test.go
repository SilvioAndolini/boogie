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

func TestSupabaseVerifier_InvalidSecret(t *testing.T) {
	t.Skip("verifier uses JWKS/ECDSA — needs mock JWKS server")
}

func TestSupabaseVerifier_ExpiredToken(t *testing.T) {
	t.Skip("verifier uses JWKS/ECDSA — needs mock JWKS server")
}

func TestSupabaseVerifier_ValidToken(t *testing.T) {
	t.Skip("verifier uses JWKS/ECDSA — needs mock JWKS server")
}
