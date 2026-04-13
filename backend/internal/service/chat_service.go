package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/boogie/backend/internal/repository"
)

type ChatService struct {
	repo *repository.ChatRepo
}

func NewChatService(repo *repository.ChatRepo) *ChatService {
	return &ChatService{repo: repo}
}

func (s *ChatService) GetConversaciones(ctx context.Context, userID string) ([]repository.Conversacion, error) {
	convs, err := s.repo.GetConversaciones(ctx, userID)
	if err != nil {
		return nil, err
	}
	if convs == nil {
		convs = []repository.Conversacion{}
	}
	return convs, nil
}

func (s *ChatService) GetOrCreateConversacion(ctx context.Context, userID, otroID string, propiedadID *string) (*repository.Conversacion, error) {
	if otroID == userID {
		return nil, fmt.Errorf("no puedes chatear contigo mismo")
	}
	return s.repo.GetOrCreateConversacion(ctx, userID, otroID, propiedadID)
}

func (s *ChatService) GetMensajes(ctx context.Context, conversacionID, userID string, limit, offset int) ([]repository.Mensaje, error) {
	if !s.repo.IsParticipant(ctx, conversacionID, userID) {
		return nil, fmt.Errorf("sin permisos")
	}
	msgs, err := s.repo.GetMensajes(ctx, conversacionID, limit, offset)
	if err != nil {
		return nil, err
	}
	if err := s.repo.MarkAsRead(ctx, conversacionID, userID); err != nil {
		slog.Error("[chat] markAsRead error", "error", err)
	}
	if msgs == nil {
		msgs = []repository.Mensaje{}
	}
	return msgs, nil
}

func (s *ChatService) EnviarMensaje(ctx context.Context, conversacionID, userID, contenido, tipo string, imagenURL *string) (string, error) {
	if !s.repo.IsParticipant(ctx, conversacionID, userID) {
		return "", fmt.Errorf("sin permisos")
	}
	if contenido == "" && imagenURL == nil {
		return "", fmt.Errorf("mensaje vacío")
	}
	return s.repo.InsertMensaje(ctx, conversacionID, userID, contenido, tipo, imagenURL)
}

func (s *ChatService) CountNoLeidos(ctx context.Context, userID string) (int, error) {
	return s.repo.CountNoLeidos(ctx, userID)
}
