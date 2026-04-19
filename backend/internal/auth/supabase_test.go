package auth

import (
	"testing"
)

func TestSupabaseVerifier_InvalidSecret(t *testing.T) {
	t.Skip("verifier uses JWKS/ECDSA — needs mock JWKS server")
}

func TestSupabaseVerifier_ExpiredToken(t *testing.T) {
	t.Skip("verifier uses JWKS/ECDSA — needs mock JWKS server")
}

func TestSupabaseVerifier_ValidToken(t *testing.T) {
	t.Skip("verifier uses JWKS/ECDSA — needs mock JWKS server")
}
