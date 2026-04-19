package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/boogie/backend/internal/repository"
)

type ChatRepository interface {
	GetConversaciones(ctx context.Context, userID string) ([]repository.Conversacion, error)
	GetOrCreateConversacion(ctx context.Context, userID, otroID string, propiedadID *string) (*repository.Conversacion, error)
	IsParticipant(ctx context.Context, conversacionID, userID string) bool
	GetMensajes(ctx context.Context, conversacionID string, limit, offset int) ([]repository.Mensaje, error)
	MarkAsRead(ctx context.Context, conversacionID, userID string) error
	InsertMensaje(ctx context.Context, conversacionID, remitenteID, contenido, tipo string, imagenURL *string) (*repository.Mensaje, error)
	CountNoLeidos(ctx context.Context, userID string) (int, error)
	GetConversacionInfo(ctx context.Context, convID, userID string) (*repository.ConversacionInfo, error)
	GetMensajesRapidos(ctx context.Context, userID string) ([]repository.MensajeRapido, error)
	ExistsMensajesRapidos(ctx context.Context, userID string) (bool, error)
	SeedMensajesRapidos(ctx context.Context, userID, tipo string, mensajes []string) error
	GetMaxOrdenMensajeRapido(ctx context.Context, userID string) (int, error)
	InsertMensajeRapido(ctx context.Context, userID, contenido, tipo string, orden int) (*repository.MensajeRapido, error)
	UpdateMensajeRapido(ctx context.Context, id, userID, contenido string) error
	DeleteMensajeRapido(ctx context.Context, id, userID string) error
}

type ChatService struct {
	repo ChatRepository
}

func NewChatService(repo ChatRepository) *ChatService {
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

func (s *ChatService) EnviarMensaje(ctx context.Context, conversacionID, userID, contenido, tipo string, imagenURL *string) (*repository.Mensaje, error) {
	if !s.repo.IsParticipant(ctx, conversacionID, userID) {
		return nil, fmt.Errorf("sin permisos")
	}
	if contenido == "" && imagenURL == nil {
		return nil, fmt.Errorf("mensaje vacío")
	}
	return s.repo.InsertMensaje(ctx, conversacionID, userID, contenido, tipo, imagenURL)
}

func (s *ChatService) CountNoLeidos(ctx context.Context, userID string) (int, error) {
	return s.repo.CountNoLeidos(ctx, userID)
}

func (s *ChatService) GetConversacionInfo(ctx context.Context, convID, userID string) (*repository.ConversacionInfo, error) {
	return s.repo.GetConversacionInfo(ctx, convID, userID)
}

func (s *ChatService) GetMensajesRapidos(ctx context.Context, userID string) ([]repository.MensajeRapido, error) {
	return s.repo.GetMensajesRapidos(ctx, userID)
}

func (s *ChatService) SeedMensajesRapidos(ctx context.Context, userID, rol string) error {
	exists, err := s.repo.ExistsMensajesRapidos(ctx, userID)
	if err != nil {
		return fmt.Errorf("error al verificar mensajes rapidos")
	}
	if exists {
		return nil
	}

	var mensajes []string
	var tipo string
	if rol == "ANFITRION" || rol == "AMBOS" {
		tipo = "anfitrion"
		mensajes = []string{
			"Bienvenido a mi propiedad",
			"Gracias por tu estancia",
			"El check-in es a las 3pm",
			"El check-out es a las 11am",
			"Cualquier duda estoy disponible",
		}
	} else {
		tipo = "booger"
		mensajes = []string{
			"Hola, me interesa tu propiedad",
			"Gracias por la informacion",
			"Confirmo mi reserva",
			"En camino al alojamiento",
			"Excelente estancia, gracias",
		}
	}
	return s.repo.SeedMensajesRapidos(ctx, userID, tipo, mensajes)
}

func (s *ChatService) CrearMensajeRapido(ctx context.Context, userID, contenido, tipo string) (*repository.MensajeRapido, error) {
	if contenido == "" {
		return nil, fmt.Errorf("contenido es requerido")
	}
	maxOrden, err := s.repo.GetMaxOrdenMensajeRapido(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener orden")
	}
	return s.repo.InsertMensajeRapido(ctx, userID, contenido, tipo, maxOrden+1)
}

func (s *ChatService) ActualizarMensajeRapido(ctx context.Context, id, userID, contenido string) error {
	if contenido == "" {
		return fmt.Errorf("contenido es requerido")
	}
	return s.repo.UpdateMensajeRapido(ctx, id, userID, contenido)
}

func (s *ChatService) EliminarMensajeRapido(ctx context.Context, id, userID string) error {
	return s.repo.DeleteMensajeRapido(ctx, id, userID)
}
