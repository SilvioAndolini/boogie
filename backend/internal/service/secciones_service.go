package service

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/repository"
)

type SeccionesService struct {
	repo  *repository.SeccionesRepo
	cache *CacheService
}

func NewSeccionesService(repo *repository.SeccionesRepo) *SeccionesService {
	return &SeccionesService{repo: repo, cache: GetCache()}
}

func (s *SeccionesService) GetPublicas(ctx context.Context) ([]repository.SeccionConPropiedades, error) {
	const key = "secciones:publicas"
	const ttl = 5 * time.Minute

	var secciones []repository.SeccionConPropiedades
	err := s.cache.GetOrFetchInto(key, ttl, &secciones, func() (interface{}, error) {
		return s.fetchPublicas(ctx)
	})
	if err != nil {
		return nil, err
	}
	return secciones, nil
}

func (s *SeccionesService) fetchPublicas(ctx context.Context) ([]repository.SeccionConPropiedades, error) {
	secciones, err := s.repo.GetPublicas(ctx)
	if err != nil {
		return nil, err
	}

	var results []repository.SeccionConPropiedades
	for _, sec := range secciones {
		var propiedades []repository.PropiedadResumen

		if sec.TipoFiltro == "MANUAL" && len(sec.PropiedadIDs) > 0 {
			propiedades, _ = s.repo.GetPropiedadesByIDs(ctx, sec.PropiedadIDs)
		} else {
			propiedades, _ = s.repo.GetPropiedadesFiltradas(ctx, sec.TipoFiltro, sec.FiltroEstado, sec.FiltroCiudad, 10)
		}

		if propiedades == nil {
			propiedades = []repository.PropiedadResumen{}
		}

		results = append(results, repository.SeccionConPropiedades{
			SeccionDestacada: sec,
			Propiedades:      propiedades,
		})
	}
	if results == nil {
		results = []repository.SeccionConPropiedades{}
	}
	return results, nil
}

func (s *SeccionesService) GetAdmin(ctx context.Context) ([]repository.SeccionDestacada, error) {
	return s.repo.GetAdmin(ctx)
}

func (s *SeccionesService) Upsert(ctx context.Context, sec *repository.SeccionDestacada) error {
	if sec.Titulo == "" {
		return fmt.Errorf("el titulo es obligatorio")
	}
	if sec.TipoFiltro == "MANUAL" {
		sec.FiltroEstado = nil
		sec.FiltroCiudad = nil
	} else {
		sec.PropiedadIDs = nil
	}

	if sec.ID == "" {
		return s.repo.Insert(ctx, sec)
	}
	return s.repo.Update(ctx, sec)
}

func (s *SeccionesService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *SeccionesService) SearchPropiedades(ctx context.Context, query string) ([]repository.PropiedadSearchResult, error) {
	return s.repo.SearchPropiedades(ctx, query)
}

func (s *SeccionesService) GetPropiedadesByIDs(ctx context.Context, ids []string) ([]repository.PropiedadResumen, error) {
	return s.repo.GetPropiedadesByIDs(ctx, ids)
}

func (s *SeccionesService) PreviewPropiedades(ctx context.Context, tipoFiltro string, filtroEstado, filtroCiudad *string) ([]repository.PropiedadPreview, error) {
	return s.repo.PreviewPropiedades(ctx, tipoFiltro, filtroEstado, filtroCiudad)
}
