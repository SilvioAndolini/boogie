package service

import (
	"context"
	"fmt"
	"math"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
)

type PropiedadesService struct {
	repo        *repository.PropiedadesRepo
	maxFree     int
}

func NewPropiedadesService(repo *repository.PropiedadesRepo, maxFree int) *PropiedadesService {
	return &PropiedadesService{repo: repo, maxFree: maxFree}
}

func (s *PropiedadesService) Search(ctx context.Context, filtros *repository.PropiedadesFiltros) ([]repository.PropiedadListado, int, error) {
	if filtros.PorPagina <= 0 {
		filtros.PorPagina = 12
	}
	if filtros.Pagina <= 0 {
		filtros.Pagina = 1
	}
	return s.repo.SearchPublic(ctx, filtros)
}

func (s *PropiedadesService) GetByID(ctx context.Context, id string) (*repository.PropiedadDetalleFull, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *PropiedadesService) GetBySlug(ctx context.Context, slug string) (*repository.PropiedadDetalleFull, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *PropiedadesService) GetByIDOrSlug(ctx context.Context, idOrSlug string) (*repository.PropiedadDetalleFull, error) {
	if isUUID(idOrSlug) {
		return s.repo.GetByID(ctx, idOrSlug)
	}
	return s.repo.GetBySlug(ctx, idOrSlug)
}

func (s *PropiedadesService) ListByPropietario(ctx context.Context, propietarioID string) ([]repository.PropiedadListado, error) {
	return s.repo.ListByPropietario(ctx, propietarioID)
}

func (s *PropiedadesService) CanCreate(ctx context.Context, propietarioID, plan string) error {
	if plan == string(enums.PlanUltra) {
		return nil
	}
	count, err := s.repo.CountByPropietario(ctx, propietarioID)
	if err != nil {
		return fmt.Errorf("error al contar propiedades: %w", err)
	}
	if count >= s.maxFree {
		return fmt.Errorf("limite de %d propiedades alcanzado para plan FREE", s.maxFree)
	}
	return nil
}

func (s *PropiedadesService) UpdateEstado(ctx context.Context, id, estado string) error {
	return s.repo.UpdateEstado(ctx, id, estado)
}

func (s *PropiedadesService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func FilterByDistance(results []repository.PropiedadListado, lat, lng, radiusKm float64) []repository.PropiedadListado {
	var filtered []repository.PropiedadListado
	for _, p := range results {
		if p.Latitud == nil || p.Longitud == nil {
			continue
		}
		dist := repository.HaversineDistance(lat, lng, *p.Latitud, *p.Longitud)
		if dist <= radiusKm {
			filtered = append(filtered, p)
		}
	}
	return filtered
}

func isUUID(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
		} else {
			if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
				return false
			}
		}
	}
	return true
}

var _ = math.Pi
var _ = enums.PlanFree
