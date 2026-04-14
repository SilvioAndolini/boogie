package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"time"
)

type SupabaseAuthClient struct {
	baseURL    string
	anonKey    string
	httpClient *http.Client
}

func NewSupabaseAuthClient(baseURL, anonKey string) *SupabaseAuthClient {
	return &SupabaseAuthClient{
		baseURL: baseURL,
		anonKey: anonKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// doRequest sends an HTTP request to the Supabase Auth API.
// If serviceRoleKey is non-empty, it is sent as the Authorization Bearer token.
func (c *SupabaseAuthClient) doRequest(ctx context.Context, method, path string, body interface{}, serviceRoleKey string) ([]byte, int, error) {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, 0, err
		}
		reqBody = bytes.NewReader(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+"/auth/v1"+path, reqBody)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.anonKey)
	if serviceRoleKey != "" {
		req.Header.Set("Authorization", "Bearer "+serviceRoleKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, resp.StatusCode, fmt.Errorf("read response body: %w", err)
	}
	return data, resp.StatusCode, nil
}

type AuthResponse struct {
	AccessToken  string    `json:"access_token"`
	TokenType    string    `json:"token_type"`
	ExpiresIn    int       `json:"expires_in"`
	RefreshToken string    `json:"refresh_token"`
	User         *AuthUser `json:"user"`
}

type AuthUser struct {
	ID           string                 `json:"id"`
	Email        string                 `json:"email"`
	Phone        string                 `json:"phone"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
}

type AuthError struct {
	StatusCode int    `json:"-"`
	Code       string `json:"error_code"`
	Message    string `json:"msg"`
}

func (e *AuthError) Error() string {
	return e.Message
}

func parseAuthError(data []byte, statusCode int) *AuthError {
	var errBody struct {
		Code    string `json:"error_code"`
		Message string `json:"msg"`
	}
	if err := json.Unmarshal(data, &errBody); err != nil {
		slog.Error("[auth] parse auth error body", "error", err)
	}
	if errBody.Message == "" {
		var fallback struct {
			Message string `json:"message"`
		}
		if err := json.Unmarshal(data, &fallback); err != nil {
			slog.Error("[auth] parse auth fallback error", "error", err)
		}
		errBody.Message = fallback.Message
	}
	return &AuthError{
		StatusCode: statusCode,
		Code:       errBody.Code,
		Message:    errBody.Message,
	}
}

func (c *SupabaseAuthClient) SignInWithPassword(ctx context.Context, email, password string) (*AuthResponse, error) {
	body := map[string]string{
		"email":                email,
		"password":             password,
		"gotrue_meta_security": "",
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/token?grant_type=password", body, "")
	if err != nil {
		return nil, err
	}
	if status != http.StatusOK {
		return nil, parseAuthError(data, status)
	}
	var resp AuthResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("error parsing response")
	}
	return &resp, nil
}

func (c *SupabaseAuthClient) SendOTP(ctx context.Context, email string) error {
	body := map[string]string{
		"email": email,
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/otp", body, "")
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return parseAuthError(data, status)
	}
	return nil
}

func (c *SupabaseAuthClient) SendOTPSms(ctx context.Context, phone string) error {
	body := map[string]string{
		"phone": phone,
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/otp", body, "")
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return parseAuthError(data, status)
	}
	return nil
}

func (c *SupabaseAuthClient) VerifyOTP(ctx context.Context, email, token, otpType string) (*AuthResponse, error) {
	body := map[string]string{
		"email": email,
		"token": token,
		"type":  otpType,
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/verify", body, "")
	if err != nil {
		return nil, err
	}
	if status != http.StatusOK {
		return nil, parseAuthError(data, status)
	}
	var resp AuthResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("error parsing response")
	}
	return &resp, nil
}

func (c *SupabaseAuthClient) SignUp(ctx context.Context, email, password string, metadata map[string]interface{}) (*AuthResponse, error) {
	body := map[string]interface{}{
		"email":    email,
		"password": password,
		"data":     metadata,
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/signup", body, "")
	if err != nil {
		return nil, err
	}
	if status != http.StatusOK && status != http.StatusCreated {
		return nil, parseAuthError(data, status)
	}
	var resp AuthResponse
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, fmt.Errorf("error parsing response")
	}
	return &resp, nil
}

func (c *SupabaseAuthClient) ResetPasswordForEmail(ctx context.Context, email, redirectTo string) error {
	body := map[string]string{
		"email": email,
	}
	if redirectTo != "" {
		body["redirect_to"] = redirectTo
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/recover", body, "")
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return parseAuthError(data, status)
	}
	return nil
}

func (c *SupabaseAuthClient) GetUser(ctx context.Context, accessToken string) (*AuthUser, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/auth/v1/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.anonKey)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read user response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, parseAuthError(data, resp.StatusCode)
	}
	var user AuthUser
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, fmt.Errorf("error parsing user")
	}
	return &user, nil
}

func (c *SupabaseAuthClient) AdminCreateUser(ctx context.Context, serviceRoleKey string, email, password string, emailConfirm bool, metadata map[string]interface{}) (*AuthUser, error) {
	body := map[string]interface{}{
		"email":         email,
		"password":      password,
		"email_confirm": emailConfirm,
		"user_metadata": metadata,
	}
	data, status, err := c.doRequest(ctx, http.MethodPost, "/admin/users", body, serviceRoleKey)
	if err != nil {
		return nil, err
	}
	if status != http.StatusOK && status != http.StatusCreated {
		return nil, parseAuthError(data, status)
	}
	var result struct {
		ID string `json:"id"`
		AuthUser
	}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("error parsing response")
	}
	u := result.AuthUser
	u.ID = result.ID
	return &u, nil
}

func (c *SupabaseAuthClient) AdminDeleteUser(ctx context.Context, serviceRoleKey, userID string) error {
	_, status, err := c.doRequest(ctx, http.MethodDelete, "/admin/users/"+userID, nil, serviceRoleKey)
	if err != nil {
		return err
	}
	if status != http.StatusOK && status != http.StatusNoContent {
		return fmt.Errorf("error deleting user: status %d", status)
	}
	return nil
}

func (c *SupabaseAuthClient) GetOAuthURL(provider, redirectTo string) string {
	return fmt.Sprintf("%s/auth/v1/authorize?provider=%s&redirect_to=%s", c.baseURL, provider, url.QueryEscape(redirectTo))
}

func (c *SupabaseAuthClient) UpdateUserMetadata(ctx context.Context, serviceRoleKey, userID string, metadata map[string]interface{}) error {
	body := map[string]interface{}{
		"user_metadata": metadata,
	}
	data, status, err := c.doRequest(ctx, http.MethodPut, "/admin/users/"+userID, body, serviceRoleKey)
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return parseAuthError(data, status)
	}
	return nil
}

func (c *SupabaseAuthClient) UpdateUserPassword(ctx context.Context, serviceRoleKey, userID, password string) error {
	body := map[string]interface{}{
		"password": password,
	}
	data, status, err := c.doRequest(ctx, http.MethodPut, "/admin/users/"+userID, body, serviceRoleKey)
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return parseAuthError(data, status)
	}
	return nil
}

func (c *SupabaseAuthClient) UploadStorage(ctx context.Context, supabaseURL, serviceRoleKey, bucket, path string, fileData []byte, contentType string) (string, error) {
	storageURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseURL, bucket, path)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, storageURL, bytes.NewReader(fileData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("apikey", serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+serviceRoleKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage upload failed: status %d, body: %s", resp.StatusCode, string(body))
	}

	publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", supabaseURL, bucket, path)
	return publicURL, nil
}
