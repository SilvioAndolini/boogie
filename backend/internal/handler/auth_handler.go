package handler

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/boogie/backend/internal/auth"
)

type AuthHandler struct {
	authClient  *auth.SupabaseAuthClient
	verifier    *auth.SupabaseVerifier
	repo        AuthRepository
	supabaseURL string
	serviceKey  string
	appURL      string
}

func NewAuthHandler(
	authClient *auth.SupabaseAuthClient,
	verifier *auth.SupabaseVerifier,
	repo AuthRepository,
	supabaseURL, serviceKey, appURL string,
) *AuthHandler {
	return &AuthHandler{
		authClient:  authClient,
		verifier:    verifier,
		repo:        repo,
		supabaseURL: supabaseURL,
		serviceKey:  serviceKey,
		appURL:      appURL,
	}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" || req.Password == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "email y password son requeridos")
		return
	}

	resp, err := h.authClient.SignInWithPassword(r.Context(), req.Email, req.Password)
	if err != nil {
		slog.Error("[auth/login] error", "error", err)
		ErrorJSON(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Credenciales invalidas")
		return
	}

	JSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) LoginAdmin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" || req.Password == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "email y password son requeridos")
		return
	}

	resp, err := h.authClient.SignInWithPassword(r.Context(), req.Email, req.Password)
	if err != nil {
		slog.Error("[auth/login-admin] error", "error", err)
		ErrorJSON(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Credenciales invalidas")
		return
	}

	if h.repo == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Base de datos no disponible")
		return
	}

	if resp.User == nil {
		ErrorJSON(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Credenciales invalidas")
		return
	}

	rol, err := h.repo.GetUserRole(r.Context(), resp.User.ID)
	if err != nil || rol != "ADMIN" {
		ErrorJSON(w, http.StatusForbidden, "NOT_ADMIN", "No tienes permisos de administrador")
		return
	}

	JSON(w, http.StatusOK, resp)
}

type sendOtpEmailRequest struct {
	Email string `json:"email"`
}

func (h *AuthHandler) SendOtpEmail(w http.ResponseWriter, r *http.Request) {
	var req sendOtpEmailRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_EMAIL", "email es requerido")
		return
	}

	if err := h.authClient.SendOTP(r.Context(), req.Email); err != nil {
		slog.Error("[auth/otp-email] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "OTP_ERROR", "No pudimos enviar el codigo")
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Codigo enviado"})
}

type sendOtpSmsRequest struct {
	Telefono   string `json:"telefono"`
	CodigoPais string `json:"codigoPais"`
}

func (h *AuthHandler) SendOtpSms(w http.ResponseWriter, r *http.Request) {
	var req sendOtpSmsRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Telefono == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PHONE", "telefono es requerido")
		return
	}

	telefono := normalizarTelefono(req.Telefono, req.CodigoPais)

	if err := h.authClient.SendOTPSms(r.Context(), telefono); err != nil {
		slog.Error("[auth/otp-sms] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "OTP_ERROR", "No pudimos enviar el codigo SMS")
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Codigo SMS enviado"})
}

type verifyOtpRequest struct {
	Email string `json:"email"`
	Token string `json:"token"`
	Type  string `json:"type"`
}

func (h *AuthHandler) VerifyOtp(w http.ResponseWriter, r *http.Request) {
	var req verifyOtpRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" || req.Token == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "email y token son requeridos")
		return
	}

	otpType := req.Type
	if otpType == "" {
		otpType = "email"
	}

	resp, err := h.authClient.VerifyOTP(r.Context(), req.Email, req.Token, otpType)
	if err != nil {
		slog.Error("[auth/verify-otp] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "OTP_INVALID", "Codigo de verificacion invalido")
		return
	}

	JSON(w, http.StatusOK, resp)
}

type registerRequest struct {
	Nombre          string `json:"nombre"`
	Apellido        string `json:"apellido"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
	TipoDocumento   string `json:"tipoDocumento"`
	NumeroDocumento string `json:"numeroDocumento"`
	Telefono        string `json:"telefono"`
	CodigoPais      string `json:"codigoPais"`
	Otp             string `json:"otp"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" || req.Password == "" || req.Otp == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_PARAMS", "email, password y otp son requeridos")
		return
	}
	if len(req.Password) < 8 {
		ErrorJSON(w, http.StatusBadRequest, "PASSWORD_TOO_SHORT", "La contrasena debe tener al menos 8 caracteres")
		return
	}
	if req.Password != req.ConfirmPassword {
		ErrorJSON(w, http.StatusBadRequest, "PASSWORD_MISMATCH", "Las contrasenas no coinciden")
		return
	}
	if req.Nombre == "" || req.Apellido == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_NAME", "nombre y apellido son requeridos")
		return
	}
	if len(req.Otp) < 6 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_OTP", "Codigo de verificacion invalido")
		return
	}

	otpResp, err := h.authClient.VerifyOTP(r.Context(), req.Email, req.Otp, "email")
	if err != nil {
		slog.Error("[auth/register] OTP verify error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "OTP_INVALID", "Codigo de verificacion invalido")
		return
	}
	if otpResp.User == nil || otpResp.User.ID == "" {
		ErrorJSON(w, http.StatusBadRequest, "VERIFY_ERROR", "Error de verificacion")
		return
	}
	userID := otpResp.User.ID

	telefonoCompleto := normalizarTelefono(req.Telefono, req.CodigoPais)
	documento := normalizarDocumento(req.NumeroDocumento, req.TipoDocumento)

	if h.repo == nil {
		slog.Error("[auth/register] no database available for profile creation")
		ErrorJSON(w, http.StatusInternalServerError, "DB_ERROR", "Error al crear perfil de usuario")
		return
	}
	if err := h.repo.CreateUserProfile(r.Context(), userID, req.Email, req.Nombre, req.Apellido, telefonoCompleto, documento); err != nil {
		mapError(w, err, "[auth/register] profile error", "userId", userID)
		return
	}

	if err := h.authClient.UpdateUserMetadata(r.Context(), h.serviceKey, userID, map[string]interface{}{
		"cedula":  documento,
		"telefono": telefonoCompleto,
	}); err != nil {
		slog.Warn("[auth/register] user_metadata update failed", "error", err)
	}

	if err := h.authClient.UpdateAppMetadata(r.Context(), h.serviceKey, userID, map[string]interface{}{
		"rol": "BOOGER",
	}); err != nil {
		slog.Warn("[auth/register] app_metadata update failed", "error", err)
	}

	JSON(w, http.StatusCreated, RegisterResponse{
		Ok:      true,
		UserID:  userID,
		Mensaje: "Registro exitoso",
	})
}

type resetPasswordRequest struct {
	Email string `json:"email"`
}

func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetPasswordRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Email == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_EMAIL", "email es requerido")
		return
	}

	redirectTo := h.appURL + "/recuperar-contrasena"
	if err := h.authClient.ResetPasswordForEmail(r.Context(), req.Email, redirectTo); err != nil {
		slog.Error("[auth/reset-password] error", "error", err)
		ErrorJSON(w, http.StatusBadRequest, "RESET_ERROR", "No pudimos enviar el correo")
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Correo de recuperacion enviado"})
}

type googleOAuthRequest struct {
	RedirectTo string `json:"redirectTo"`
}

func (h *AuthHandler) GoogleOAuthURL(w http.ResponseWriter, r *http.Request) {
	redirectTo := r.URL.Query().Get("redirectTo")
	if redirectTo == "" {
		redirectTo = h.appURL + "/auth/callback"
	}
	url := h.authClient.GetOAuthURL("google", redirectTo)
	JSON(w, http.StatusOK, OAuthURLResponse{URL: url})
}

type googleCallbackRequest struct {
	Code string `json:"code"`
}

func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_CODE", "codigo de autorizacion requerido")
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Callback recibido. El frontend debe intercambiar el code con Supabase directamente."})
}

type completarPerfilRequest struct {
	Nombre          string `json:"nombre"`
	Apellido        string `json:"apellido"`
	TipoDocumento   string `json:"tipoDocumento"`
	NumeroDocumento string `json:"numeroDocumento"`
	Telefono        string `json:"telefono"`
	CodigoPais      string `json:"codigoPais"`
}

func (h *AuthHandler) CompletarPerfil(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req completarPerfilRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Nombre == "" || req.Apellido == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_NAME", "nombre y apellido son requeridos")
		return
	}
	if req.NumeroDocumento == "" || len(req.NumeroDocumento) < 4 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_DOCUMENT", "numeroDocumento invalido")
		return
	}
	if req.Telefono == "" || len(req.Telefono) < 7 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_PHONE", "telefono invalido")
		return
	}

	telefonoCompleto := normalizarTelefono(req.Telefono, req.CodigoPais)
	documento := normalizarDocumento(req.NumeroDocumento, req.TipoDocumento)

	if h.repo == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Base de datos no disponible")
		return
	}
	if err := h.repo.UpdateProfile(r.Context(), userID, req.Nombre, req.Apellido, documento, telefonoCompleto); err != nil {
		mapError(w, err, "[auth/completar-perfil]", "userId", userID)
		return
	}

	if err := h.authClient.UpdateUserMetadata(r.Context(), h.serviceKey, userID, map[string]interface{}{
		"cedula":  documento,
		"telefono": telefonoCompleto,
	}); err != nil {
		slog.Warn("[auth/completar-perfil] metadata update failed", "error", err)
	}

	if err := h.authClient.UpdateAppMetadata(r.Context(), h.serviceKey, userID, map[string]interface{}{
		"rol": "BOOGER",
	}); err != nil {
		slog.Warn("[auth/completar-perfil] app_metadata update failed", "error", err)
	}

	JSON(w, http.StatusOK, OKResponse{Ok: true})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	if h.repo == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Base de datos no disponible")
		return
	}

	profile, err := h.repo.GetUserProfile(r.Context(), userID)
	if err != nil {
		mapError(w, err, "[auth/me]", "userId", userID)
		return
	}

	JSON(w, http.StatusOK, profile)
}

type actualizarPerfilRequest struct {
	Nombre              string  `json:"nombre"`
	Apellido            string  `json:"apellido"`
	Telefono            *string `json:"telefono"`
	Bio                 *string `json:"bio"`
	MetodoPagoPreferido *string `json:"metodoPagoPreferido"`
	Tiktok              *string `json:"tiktok"`
	Instagram           *string `json:"instagram"`
}

func (h *AuthHandler) ActualizarPerfil(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req actualizarPerfilRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.Nombre == "" || req.Apellido == "" {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_NAME", "nombre y apellido son requeridos")
		return
	}

	if h.repo == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Base de datos no disponible")
		return
	}

	if err := h.repo.UpdatePerfilCompleto(r.Context(), userID, map[string]interface{}{
		"nombre":                req.Nombre,
		"apellido":              req.Apellido,
		"telefono":              req.Telefono,
		"bio":                   req.Bio,
		"metodo_pago_preferido": req.MetodoPagoPreferido,
		"tiktok":                req.Tiktok,
		"instagram":             req.Instagram,
	}); err != nil {
		mapError(w, err, "[auth/perfil] update", "userId", userID)
		return
	}

	if err := h.authClient.UpdateUserMetadata(r.Context(), h.serviceKey, userID, map[string]interface{}{
		"nombre":   req.Nombre,
		"apellido": req.Apellido,
		"telefono": req.Telefono,
	}); err != nil {
		slog.Warn("[auth/perfil] metadata update failed", "error", err)
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Perfil actualizado"})
}

type cambiarContrasenaRequest struct {
	PasswordNueva string `json:"passwordNueva"`
}

func (h *AuthHandler) CambiarContrasena(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	var req cambiarContrasenaRequest
	if err := DecodeJSON(r, &req); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_BODY", "JSON invalido")
		return
	}
	if req.PasswordNueva == "" || len(req.PasswordNueva) < 8 {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_PASSWORD", "La contrasena debe tener al menos 8 caracteres")
		return
	}

	if err := h.authClient.UpdateUserPassword(r.Context(), h.serviceKey, userID, req.PasswordNueva); err != nil {
		mapError(w, err, "[auth/password] error", "userID", userID)
		return
	}

	JSON(w, http.StatusOK, OKMensajeResponse{Ok: true, Mensaje: "Contrasena actualizada"})
}

const avatarMaxSize = 2 << 20

func (h *AuthHandler) SubirAvatar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r.Context())
	if userID == "" {
		ErrorJSON(w, http.StatusUnauthorized, "AUTH_REQUIRED", "No autenticado")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, avatarMaxSize+1024)
	if err := r.ParseMultipartForm(avatarMaxSize); err != nil {
		ErrorJSON(w, http.StatusBadRequest, "FILE_TOO_LARGE", "La imagen no debe superar 2 MB")
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		ErrorJSON(w, http.StatusBadRequest, "MISSING_FILE", "No se selecciono ninguna imagen")
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	allowed := map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true}
	if !allowed[contentType] {
		ErrorJSON(w, http.StatusBadRequest, "INVALID_TYPE", "Formato no permitido. Usa JPG, PNG o WebP")
		return
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".webp"
	}
	storagePath := fmt.Sprintf("avatares/%s/%d%s", userID, r.Context().Value("requestID"), ext)

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		ErrorJSON(w, http.StatusInternalServerError, "READ_ERROR", "Error al leer archivo")
		return
	}

	publicURL, err := h.authClient.UploadStorage(r.Context(), h.supabaseURL, h.serviceKey, "imagenes", storagePath, fileBytes, contentType)
	if err != nil {
		mapError(w, err, "[auth/avatar] upload", "userId", userID)
		return
	}

	if h.repo == nil {
		ErrorJSON(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Base de datos no disponible")
		return
	}
	if err := h.repo.UpdateAvatarURL(r.Context(), userID, publicURL); err != nil {
		mapError(w, err, "[auth/avatar] db update", "userId", userID)
		return
	}

	if err := h.authClient.UpdateUserMetadata(r.Context(), h.serviceKey, userID, map[string]interface{}{
		"avatar_url": publicURL,
	}); err != nil {
		slog.Warn("[auth/avatar] metadata update failed", "error", err)
	}

	JSON(w, http.StatusOK, AvatarUploadResponse{
		Ok:  true,
		URL: fmt.Sprintf("%s?t=%d", publicURL, time.Now().Unix()),
	})
}

// normalizarTelefono combines codigo pais + telefono, stripping dashes.
func normalizarTelefono(telefono, codigoPais string) string {
	pais := codigoPais
	if pais == "" {
		pais = "+58"
	}
	return pais + strings.ReplaceAll(telefono, "-", "")
}

// normalizarDocumento normalizes a document number based on type.
func normalizarDocumento(numero, tipo string) string {
	if tipo == "PASAPORTE" {
		return strings.ToUpper(numero)
	}
	return normalizarCedula(numero)
}

func normalizarCedula(valor string) string {
	limpio := strings.ToUpper(strings.TrimSpace(valor))
	limpio = strings.Map(func(r rune) rune {
		if (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			return r
		}
		return -1
	}, limpio)
	if len(limpio) > 0 && (limpio[0] == 'V' || limpio[0] == 'E' || limpio[0] == 'P' || limpio[0] == 'G' || limpio[0] == 'J') {
		return string(limpio[0]) + "-" + limpio[1:]
	}
	return "V-" + limpio
}
