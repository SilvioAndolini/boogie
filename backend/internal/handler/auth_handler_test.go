package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/boogie/backend/internal/auth"
)

func newAuthHandler() *AuthHandler {
	authClient := auth.NewSupabaseAuthClient("http://localhost:54321", "anon-key")
	verifier := auth.NewSupabaseVerifier("test-secret")
	return NewAuthHandler(authClient, verifier, nil, "http://localhost:54321", "service-key", "http://localhost:3000")
}

func TestAuthLogin_InvalidBody(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Login(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthLogin_MissingParams(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Login(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_PARAMS", errBody["code"])
}

func TestAuthLoginAdmin_MissingParams(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"admin@test.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login-admin", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.LoginAdmin(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthSendOtpEmail_MissingEmail(t *testing.T) {
	h := newAuthHandler()
	body := `{}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/otp/email", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SendOtpEmail(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "MISSING_EMAIL", errBody["code"])
}

func TestAuthSendOtpEmail_InvalidBody(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/otp/email", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SendOtpEmail(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthSendOtpSms_MissingPhone(t *testing.T) {
	h := newAuthHandler()
	body := `{}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/otp/sms", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.SendOtpSms(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthVerifyOtp_MissingParams(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/otp/verify", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.VerifyOtp(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthRegister_MissingParams(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthRegister_PasswordMismatch(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com","password":"pass123","confirmPassword":"pass456","otp":"123456"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "PASSWORD_MISMATCH", errBody["code"])
}

func TestAuthRegister_MissingName(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com","password":"pass123","confirmPassword":"pass123","otp":"123456"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthRegister_InvalidOtp(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com","password":"pass123","confirmPassword":"pass123","otp":"123","nombre":"Test","apellido":"User"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthResetPassword_MissingEmail(t *testing.T) {
	h := newAuthHandler()
	body := `{}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/reset-password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ResetPassword(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthResetPassword_InvalidBody(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/reset-password", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ResetPassword(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthGoogleOAuthURL(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google", nil)
	w := httptest.NewRecorder()
	h.GoogleOAuthURL(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	assert.Contains(t, data["url"], "google")
}

func TestAuthGoogleCallback_MissingCode(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/google/callback", nil)
	w := httptest.NewRecorder()
	h.GoogleCallback(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthCompletarPerfil_Unauthorized(t *testing.T) {
	h := newAuthHandler()
	body := `{"nombre":"Test","apellido":"User","numeroDocumento":"12345678","telefono":"4121234567"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/completar-perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CompletarPerfil(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthCompletarPerfil_MissingName(t *testing.T) {
	h := newAuthHandler()
	body := `{"apellido":"User","numeroDocumento":"12345678","telefono":"4121234567"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/completar-perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	h.CompletarPerfil(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthCompletarPerfil_InvalidDocument(t *testing.T) {
	h := newAuthHandler()
	body := `{"nombre":"Test","apellido":"User","numeroDocumento":"12","telefono":"4121234567"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/completar-perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), auth.UserIDKey, "user-1")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	h.CompletarPerfil(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAuthMe_Unauthorized(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	w := httptest.NewRecorder()
	h.Me(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestAuthMe_OK(t *testing.T) {
	t.Skip("requires repo mock — Me handler calls h.repo.GetUserProfile which is nil in tests")
}
