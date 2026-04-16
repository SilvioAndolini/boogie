package service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type StorageService struct {
	supabaseURL string
	serviceKey  string
	client      *http.Client
}

func NewStorageService(supabaseURL, serviceKey string) *StorageService {
	return &StorageService{
		supabaseURL: strings.TrimRight(supabaseURL, "/"),
		serviceKey:  serviceKey,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (s *StorageService) Upload(ctx context.Context, bucket, path string, fileData []byte, contentType string) (string, error) {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, path)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(fileData))
	if err != nil {
		return "", fmt.Errorf("create storage request: %w", err)
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("apikey", s.serviceKey)
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage upload request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("storage upload failed: status %d, body: %s", resp.StatusCode, string(body))
	}

	return s.GetPublicURL(bucket, path), nil
}

func (s *StorageService) Delete(ctx context.Context, bucket, path string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.supabaseURL, bucket, path)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("create delete request: %w", err)
	}
	req.Header.Set("apikey", s.serviceKey)
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("storage delete request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("storage delete failed: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (s *StorageService) GetPublicURL(bucket, path string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.supabaseURL, bucket, path)
}

func (s *StorageService) UploadStorage(ctx context.Context, supabaseURL, serviceKey, bucket, path string, fileData []byte, contentType string) (string, error) {
	if supabaseURL != "" && supabaseURL != s.supabaseURL {
		slog.Warn("[storage] ignoring passed supabaseURL, using configured value", "passed", supabaseURL, "configured", s.supabaseURL)
	}
	if serviceKey != "" && serviceKey != s.serviceKey {
		slog.Warn("[storage] ignoring passed serviceKey, using configured value")
	}
	return s.Upload(ctx, bucket, path, fileData, contentType)
}
