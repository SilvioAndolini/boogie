package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/boogie/backend/internal/auth"
)

type mockAuthRepo struct {
	getUserRoleFn         func(ctx context.Context, userID string) (string, error)
	createUserProfileFn   func(ctx context.Context, userID, email, nombre, apellido, telefono, cedula string) error
	updateProfileFn       func(ctx context.Context, userID, nombre, apellido, cedula, telefono string) error
	getUserProfileFn      func(ctx context.Context, userID string) (map[string]interface{}, error)
	updatePerfilCompletoFn func(ctx context.Context, userID string, campos map[string]interface{}) error
	updateAvatarURLFn     func(ctx context.Context, userID, avatarURL string) error
}

func (m *mockAuthRepo) GetUserRole(ctx context.Context, userID string) (string, error) {
	if m.getUserRoleFn != nil {
		return m.getUserRoleFn(ctx, userID)
	}
	return "", errors.New("not implemented")
}

func (m *mockAuthRepo) CreateUserProfile(ctx context.Context, userID, email, nombre, apellido, telefono, cedula string) error {
	if m.createUserProfileFn != nil {
		return m.createUserProfileFn(ctx, userID, email, nombre, apellido, telefono, cedula)
	}
	return errors.New("not implemented")
}

func (m *mockAuthRepo) UpdateProfile(ctx context.Context, userID, nombre, apellido, cedula, telefono string) error {
	if m.updateProfileFn != nil {
		return m.updateProfileFn(ctx, userID, nombre, apellido, cedula, telefono)
	}
	return errors.New("not implemented")
}

func (m *mockAuthRepo) GetUserProfile(ctx context.Context, userID string) (map[string]interface{}, error) {
	if m.getUserProfileFn != nil {
		return m.getUserProfileFn(ctx, userID)
	}
	return nil, errors.New("not implemented")
}

func (m *mockAuthRepo) UpdatePerfilCompleto(ctx context.Context, userID string, campos map[string]interface{}) error {
	if m.updatePerfilCompletoFn != nil {
		return m.updatePerfilCompletoFn(ctx, userID, campos)
	}
	return errors.New("not implemented")
}

func (m *mockAuthRepo) UpdateAvatarURL(ctx context.Context, userID, avatarURL string) error {
	if m.updateAvatarURLFn != nil {
		return m.updateAvatarURLFn(ctx, userID, avatarURL)
	}
	return errors.New("not implemented")
}

func newAuthHandler() *AuthHandler {
	authClient := auth.NewSupabaseAuthClient("http://localhost:54321", "anon-key")
	verifier := auth.NewSupabaseVerifier("test-secret")
	return NewAuthHandler(authClient, verifier, nil, "http://localhost:54321", "service-key", "http://localhost:3000")
}

func newAuthHandlerWithMockRepo(mockRepo *mockAuthRepo) *AuthHandler {
	authClient := auth.NewSupabaseAuthClient("http://localhost:54321", "anon-key")
	verifier := auth.NewSupabaseVerifier("test-secret")
	return NewAuthHandler(authClient, verifier, mockRepo, "http://localhost:54321", "service-key", "http://localhost:3000")
}

func withAuthContext(r *http.Request, userID string) *http.Request {
	ctx := context.WithValue(r.Context(), auth.UserIDKey, userID)
	return r.WithContext(ctx)
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
	body := `{"email":"test@test.com","password":"password123","confirmPassword":"password456","otp":"123456"}`
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

func TestAuthRegister_PasswordTooShort(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com","password":"short","confirmPassword":"short","otp":"123456"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Register(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "PASSWORD_TOO_SHORT", errBody["code"])
}

func TestAuthRegister_MissingName(t *testing.T) {
	h := newAuthHandler()
	body := `{"email":"test@test.com","password":"password123","confirmPassword":"password123","otp":"123456"}`
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
	telefono := "+584121234567"
	repo := &mockAuthRepo{
		getUserProfileFn: func(ctx context.Context, userID string) (map[string]interface{}, error) {
			return map[string]interface{}{
				"nombre":     "Test",
				"apellido":   "User",
				"email":      "test@test.com",
				"rol":        "HUESPED",
				"telefono":   &telefono,
				"cedula":     nil,
				"verificado": true,
			}, nil
		},
	}
	h := newAuthHandlerWithMockRepo(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()

	h.Me(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, "Test", data["nombre"])
	assert.Equal(t, "User", data["apellido"])
	assert.Equal(t, "test@test.com", data["email"])
	assert.Equal(t, "HUESPED", data["rol"])
	assert.Equal(t, true, data["verificado"])
}

func TestAuthMe_ProfileError(t *testing.T) {
	repo := &mockAuthRepo{
		getUserProfileFn: func(ctx context.Context, userID string) (map[string]interface{}, error) {
			return nil, errors.New("db error")
		},
	}
	h := newAuthHandlerWithMockRepo(repo)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()

	h.Me(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "INTERNAL_ERROR", errBody["code"])
}

func TestAuthMe_RepoNil(t *testing.T) {
	h := newAuthHandler()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()

	h.Me(w, req)
	assert.Equal(t, http.StatusServiceUnavailable, w.Code)
}

func TestAuthCompletarPerfil_OK(t *testing.T) {
	var capturedNombre, capturedApellido, capturedCedula, capturedTelefono string
	var capturedUserID string
	repo := &mockAuthRepo{
		updateProfileFn: func(ctx context.Context, userID, nombre, apellido, cedula, telefono string) error {
			capturedUserID = userID
			capturedNombre = nombre
			capturedApellido = apellido
			capturedCedula = cedula
			capturedTelefono = telefono
			return nil
		},
	}
	h := newAuthHandlerWithMockRepo(repo)

	body := `{"nombre":"Juan","apellido":"Perez","numeroDocumento":"12345678","telefono":"4121234567"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/completar-perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-42")
	w := httptest.NewRecorder()

	h.CompletarPerfil(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	data := resp["data"].(map[string]interface{})
	assert.Equal(t, true, data["ok"])

	assert.Equal(t, "user-42", capturedUserID)
	assert.Equal(t, "Juan", capturedNombre)
	assert.Equal(t, "Perez", capturedApellido)
	assert.Contains(t, capturedCedula, "12345678")
	assert.Contains(t, capturedTelefono, "4121234567")
}

func TestAuthCompletarPerfil_UpdateError(t *testing.T) {
	repo := &mockAuthRepo{
		updateProfileFn: func(ctx context.Context, userID, nombre, apellido, cedula, telefono string) error {
			return errors.New("db error")
		},
	}
	h := newAuthHandlerWithMockRepo(repo)

	body := `{"nombre":"Juan","apellido":"Perez","numeroDocumento":"12345678","telefono":"4121234567"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/completar-perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()

	h.CompletarPerfil(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAuthCompletarPerfil_InvalidPhone(t *testing.T) {
	h := newAuthHandler()
	body := `{"nombre":"Test","apellido":"User","numeroDocumento":"12345678","telefono":"123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/completar-perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()
	h.CompletarPerfil(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestActualizarPerfil_Unauthorized(t *testing.T) {
	h := newAuthHandler()
	body := `{"nombre":"Test","apellido":"User"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ActualizarPerfil(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestActualizarPerfil_MissingName(t *testing.T) {
	repo := &mockAuthRepo{}
	h := newAuthHandlerWithMockRepo(repo)
	body := `{"apellido":"User"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()
	h.ActualizarPerfil(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestActualizarPerfil_OK(t *testing.T) {
	var capturedUserID string
	var capturedCampos map[string]interface{}
	repo := &mockAuthRepo{
		updatePerfilCompletoFn: func(ctx context.Context, userID string, campos map[string]interface{}) error {
			capturedUserID = userID
			capturedCampos = campos
			return nil
		},
	}
	h := newAuthHandlerWithMockRepo(repo)

	body := `{"nombre":"Ana","apellido":"Garcia","bio":"Hola mundo","instagram":"@ana"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-99")
	w := httptest.NewRecorder()

	h.ActualizarPerfil(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	assert.Equal(t, "user-99", capturedUserID)
	assert.Equal(t, "Ana", capturedCampos["nombre"])
	assert.Equal(t, "Garcia", capturedCampos["apellido"])
}

func TestActualizarPerfil_UpdateError(t *testing.T) {
	repo := &mockAuthRepo{
		updatePerfilCompletoFn: func(ctx context.Context, userID string, campos map[string]interface{}) error {
			return errors.New("db error")
		},
	}
	h := newAuthHandlerWithMockRepo(repo)

	body := `{"nombre":"Ana","apellido":"Garcia"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/perfil", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()

	h.ActualizarPerfil(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCambiarContrasena_Unauthorized(t *testing.T) {
	h := newAuthHandler()
	body := `{"passwordNueva":"newpass123"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.CambiarContrasena(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestCambiarContrasena_PasswordTooShort(t *testing.T) {
	h := newAuthHandler()
	body := `{"passwordNueva":"short"}`
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()
	h.CambiarContrasena(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	errBody := resp["error"].(map[string]interface{})
	assert.Equal(t, "INVALID_PASSWORD", errBody["code"])
}

func TestCambiarContrasena_InvalidBody(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/auth/password", strings.NewReader("not json"))
	req.Header.Set("Content-Type", "application/json")
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()
	h.CambiarContrasena(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSubirAvatar_Unauthorized(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/avatar", nil)
	w := httptest.NewRecorder()
	h.SubirAvatar(w, req)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestSubirAvatar_MissingFile(t *testing.T) {
	h := newAuthHandler()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/avatar", nil)
	req = withAuthContext(req, "user-1")
	w := httptest.NewRecorder()
	h.SubirAvatar(w, req)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
