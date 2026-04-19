package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/boogie/backend/internal/repository"
)

type VerificacionRepository interface {
	GetLatestByUser(ctx context.Context, userID string) (*repository.VerificacionDocumento, error)
	GetActiveByUser(ctx context.Context, userID string) (*repository.VerificacionDocumento, error)
	Insert(ctx context.Context, userID, metodo, estado string, fotoFrontal, fotoTrasera, fotoSelfie *string) (string, error)
	ListAll(ctx context.Context) ([]repository.VerificacionConUsuario, error)
	GetByID(ctx context.Context, id string) (*repository.VerificacionDocumento, error)
	Revisar(ctx context.Context, verifID, accion, revisadoPor string, motivoRechazo *string) error
	SetUsuarioVerificado(ctx context.Context, userID string, verificado bool) error
	CountPendientes(ctx context.Context, tabla string) (int, error)
}

type VerificacionService struct {
	repo VerificacionRepository
}

func NewVerificacionService(repo VerificacionRepository) *VerificacionService {
	return &VerificacionService{repo: repo}
}

func (s *VerificacionService) GetByUser(ctx context.Context, userID string) (*repository.VerificacionDocumento, error) {
	v, err := s.repo.GetLatestByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return v, nil
}

func (s *VerificacionService) IniciarMetaMap(ctx context.Context, userID string) (string, error) {
	existing, err := s.repo.GetActiveByUser(ctx, userID)
	if err == nil && existing != nil {
		if existing.Estado == "APROBADA" {
			return "", fmt.Errorf("ya estás verificado")
		}
		return "", fmt.Errorf("ya tienes una verificación en proceso")
	}

	id, err := s.repo.Insert(ctx, userID, "METAMAP", "PENDIENTE", nil, nil, nil)
	if err != nil {
		return "", fmt.Errorf("error al crear verificación: %w", err)
	}
	return id, nil
}

func (s *VerificacionService) SubirDocumento(ctx context.Context, userID string, fotoFrontal, fotoTrasera, fotoSelfie string) (string, error) {
	existing, err := s.repo.GetActiveByUser(ctx, userID)
	if err == nil && existing != nil {
		if existing.Estado == "APROBADA" {
			return "", fmt.Errorf("ya estás verificado")
		}
		return "", fmt.Errorf("ya tienes una verificación en proceso")
	}

	id, err := s.repo.Insert(ctx, userID, "MANUAL", "PENDIENTE", &fotoFrontal, &fotoTrasera, &fotoSelfie)
	if err != nil {
		return "", fmt.Errorf("error al registrar verificación: %w", err)
	}
	return id, nil
}

func (s *VerificacionService) ListAll(ctx context.Context) ([]repository.VerificacionConUsuario, error) {
	verifs, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}
	if verifs == nil {
		verifs = []repository.VerificacionConUsuario{}
	}
	return verifs, nil
}

type RevisarInput struct {
	VerificacionID string
	AdminID        string
	Accion         string
	MotivoRechazo  *string
}

func (s *VerificacionService) Revisar(ctx context.Context, input *RevisarInput) error {
	if input.Accion != "APROBADA" && input.Accion != "RECHAZADA" {
		return fmt.Errorf("accion debe ser APROBADA o RECHAZADA")
	}

	if input.Accion == "RECHAZADA" {
		if input.MotivoRechazo == nil || *input.MotivoRechazo == "" {
			return fmt.Errorf("motivo de rechazo es requerido")
		}
		if len(*input.MotivoRechazo) < 5 {
			return fmt.Errorf("motivo de rechazo debe tener al menos 5 caracteres")
		}
	}

	verif, err := s.repo.GetByID(ctx, input.VerificacionID)
	if err != nil {
		return fmt.Errorf("verificación no encontrada")
	}

	if err := s.repo.Revisar(ctx, input.VerificacionID, input.Accion, input.AdminID, input.MotivoRechazo); err != nil {
		return fmt.Errorf("error al actualizar verificación: %w", err)
	}

	if input.Accion == "APROBADA" {
		if err := s.repo.SetUsuarioVerificado(ctx, verif.UsuarioID, true); err != nil {
			slog.Error("[verificacion/revisar] error setting user verified", "error", err, "userId", verif.UsuarioID)
			return fmt.Errorf("error al marcar usuario como verificado: %w", err)
		}
	}

	return nil
}

type AdminCounts struct {
	VerificacionesPendientes int `json:"verificacionesPendientes"`
	ReservasPendientes       int `json:"reservasPendientes"`
	PagosPendientes          int `json:"pagosPendientes"`
}

func (s *VerificacionService) GetAdminCounts(ctx context.Context) (*AdminCounts, error) {
	v, err := s.repo.CountPendientes(ctx, "verificaciones_documento")
	if err != nil {
		return nil, fmt.Errorf("error counting verificaciones: %w", err)
	}
	r, err := s.repo.CountPendientes(ctx, "reservas")
	if err != nil {
		return nil, fmt.Errorf("error counting reservas: %w", err)
	}
	p, err := s.repo.CountPendientes(ctx, "pagos")
	if err != nil {
		return nil, fmt.Errorf("error counting pagos: %w", err)
	}

	return &AdminCounts{
		VerificacionesPendientes: v,
		ReservasPendientes:       r,
		PagosPendientes:          p,
	}, nil
}
