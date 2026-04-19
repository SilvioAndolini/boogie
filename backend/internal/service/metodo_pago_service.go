package service

import (
	"context"
	"fmt"

	"github.com/boogie/backend/internal/repository"
)

type MetodoPagoRepository interface {
	ListByUsuario(ctx context.Context, usuarioID string) ([]repository.MetodoPago, error)
	ExistsByTipo(ctx context.Context, usuarioID, tipo string) (bool, error)
	Insert(ctx context.Context, usuarioID string, input *repository.CrearMetodoPagoInput) (*repository.MetodoPago, error)
	Delete(ctx context.Context, id, usuarioID string) error
}

type MetodoPagoService struct {
	repo MetodoPagoRepository
}

func NewMetodoPagoService(repo MetodoPagoRepository) *MetodoPagoService {
	return &MetodoPagoService{repo: repo}
}

type CrearMetodoPagoInput struct {
	Tipo          string
	Banco         *string
	Telefono      *string
	Cedula        *string
	NumeroCuenta  *string
	Titular       *string
	EmailZelle    *string
	DireccionUSDT *string
}

func (s *MetodoPagoService) List(ctx context.Context, usuarioID string) ([]repository.MetodoPago, error) {
	return s.repo.ListByUsuario(ctx, usuarioID)
}

func (s *MetodoPagoService) Crear(ctx context.Context, usuarioID string, input *CrearMetodoPagoInput) (*repository.MetodoPago, error) {
	if input.Tipo == "" {
		return nil, fmt.Errorf("tipo es requerido")
	}

	exists, err := s.repo.ExistsByTipo(ctx, usuarioID, input.Tipo)
	if err != nil {
		return nil, fmt.Errorf("error al verificar metodo existente")
	}
	if exists {
		return nil, fmt.Errorf("ya tienes un metodo de este tipo configurado")
	}

	return s.repo.Insert(ctx, usuarioID, &repository.CrearMetodoPagoInput{
		Tipo:          input.Tipo,
		Banco:         input.Banco,
		Telefono:      input.Telefono,
		Cedula:        input.Cedula,
		NumeroCuenta:  input.NumeroCuenta,
		Titular:       input.Titular,
		EmailZelle:    input.EmailZelle,
		DireccionUSDT: input.DireccionUSDT,
	})
}

func (s *MetodoPagoService) Eliminar(ctx context.Context, id, usuarioID string) error {
	return s.repo.Delete(ctx, id, usuarioID)
}
