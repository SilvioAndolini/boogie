package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
)

type PropiedadesService struct {
	repo    *repository.PropiedadesRepo
	maxFree int
	cache   *CacheService
}

func NewPropiedadesService(repo *repository.PropiedadesRepo, maxFree int) *PropiedadesService {
	return &PropiedadesService{repo: repo, maxFree: maxFree, cache: GetCache()}
}

func (s *PropiedadesService) Search(ctx context.Context, filtros *repository.PropiedadesFiltros) ([]repository.PropiedadListado, int, error) {
	if filtros.PorPagina <= 0 {
		filtros.PorPagina = 12
	}
	if filtros.Pagina <= 0 {
		filtros.Pagina = 1
	}

	key := fmt.Sprintf("propiedades:search:%s", filtros.CacheKey())
	ttl := 2 * time.Minute

	val, err := s.cache.GetOrFetch(key, ttl, func() (interface{}, error) {
		items, total, e := s.repo.SearchPublic(ctx, filtros)
		return propiedadesSearchResult{Items: items, Total: total}, e
	})
	if err != nil {
		return nil, 0, err
	}

	r := val.(propiedadesSearchResult)
	return r.Items, r.Total, nil
}

type propiedadesSearchResult struct {
	Items []repository.PropiedadListado
	Total int
}

func (s *PropiedadesService) GetByID(ctx context.Context, id string) (*repository.PropiedadDetalleFull, error) {
	key := "propiedades:detail:" + id
	ttl := 5 * time.Minute

	val, err := s.cache.GetOrFetch(key, ttl, func() (interface{}, error) {
		return s.repo.GetByID(ctx, id)
	})
	if err != nil {
		return nil, err
	}
	return val.(*repository.PropiedadDetalleFull), nil
}

func (s *PropiedadesService) GetBySlug(ctx context.Context, slug string) (*repository.PropiedadDetalleFull, error) {
	key := "propiedades:slug:" + slug
	ttl := 5 * time.Minute

	val, err := s.cache.GetOrFetch(key, ttl, func() (interface{}, error) {
		return s.repo.GetBySlug(ctx, slug)
	})
	if err != nil {
		return nil, err
	}
	return val.(*repository.PropiedadDetalleFull), nil
}

func (s *PropiedadesService) GetByIDOrSlug(ctx context.Context, idOrSlug string) (*repository.PropiedadDetalleFull, error) {
	if isID(idOrSlug) {
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

func (s *PropiedadesService) UpdateEstado(ctx context.Context, id, estado, propietarioID string) error {
	return s.repo.UpdateEstadoWithOwner(ctx, id, estado, propietarioID)
}

func (s *PropiedadesService) Delete(ctx context.Context, id, propietarioID string) error {
	return s.repo.DeleteWithOwner(ctx, id, propietarioID)
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

func isID(s string) bool {
	if len(s) == 0 || len(s) > 64 {
		return false
	}
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '-') {
			return false
		}
	}
	return len(s) >= 20
}

var _ = math.Pi
var _ = enums.PlanFree
