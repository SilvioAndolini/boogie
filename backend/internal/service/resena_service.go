package service

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/repository"
)

type ResenaService struct {
	repo  *repository.ResenaRepo
	cache *CacheService
}

func NewResenaService(repo *repository.ResenaRepo) *ResenaService {
	return &ResenaService{repo: repo, cache: GetCache()}
}

type CrearResenaInput struct {
	ReservaID    string
	Calificacion int
	Limpieza     *int
	Comunicacion *int
	Ubicacion    *int
	Valor        *int
	Comentario   string
}

func (s *ResenaService) Crear(ctx context.Context, userID string, input *CrearResenaInput) (string, error) {
	if input.Calificacion < 1 || input.Calificacion > 5 {
		return "", fmt.Errorf("la calificacion debe ser entre 1 y 5")
	}
	subRatings := []struct {
		val  *int
		name string
	}{
		{input.Limpieza, "limpieza"},
		{input.Comunicacion, "comunicacion"},
		{input.Ubicacion, "ubicacion"},
		{input.Valor, "valor"},
	}
	for _, sr := range subRatings {
		if sr.val != nil && (*sr.val < 1 || *sr.val > 5) {
			return "", fmt.Errorf("%s debe ser entre 1 y 5", sr.name)
		}
	}

	reserva, err := s.repo.GetReservaForResena(ctx, input.ReservaID, userID)
	if err != nil {
		return "", fmt.Errorf("no puedes reseñar esta reserva")
	}

	exists, err := s.repo.ExistsByReserva(ctx, input.ReservaID)
	if err != nil {
		return "", fmt.Errorf("error al verificar reseña existente")
	}
	if exists {
		return "", fmt.Errorf("ya escribiste una reseña para esta reserva")
	}

	anfitrionID, err := s.repo.GetPropietarioID(ctx, reserva.PropiedadID)
	if err != nil {
		return "", fmt.Errorf("error al obtener propietario de la propiedad")
	}

	resenaID, err := s.repo.Insert(ctx, input.ReservaID, reserva.PropiedadID, userID, anfitrionID,
		input.Calificacion, input.Limpieza, input.Comunicacion, input.Ubicacion, input.Valor, input.Comentario)
	if err != nil {
		return "", fmt.Errorf("error al crear reseña: %w", err)
	}

	_ = s.repo.UpdatePropiedadRating(ctx, reserva.PropiedadID)

	return resenaID, nil
}

type ResponderInput struct {
	ResenaID  string
	UserID    string
	Respuesta string
}

func (s *ResenaService) Responder(ctx context.Context, input *ResponderInput) error {
	anfitrionID, err := s.repo.GetAnfitrionIDForResena(ctx, input.ResenaID)
	if err != nil {
		return fmt.Errorf("reseña no encontrada")
	}

	if anfitrionID != input.UserID {
		return fmt.Errorf("sin permisos para responder esta reseña")
	}

	resena, err := s.repo.GetByID(ctx, input.ResenaID)
	if err != nil {
		return fmt.Errorf("reseña no encontrada")
	}

	if resena.Respuesta != nil && *resena.Respuesta != "" {
		return fmt.Errorf("ya respondiste esta reseña")
	}

	return s.repo.SetRespuesta(ctx, input.ResenaID, input.Respuesta)
}

func (s *ResenaService) ListByPropiedad(ctx context.Context, propiedadID string, page, perPage int) ([]repository.ResenaConAutor, int, error) {
	key := fmt.Sprintf("resenas:%s:page=%d:pp=%d", propiedadID, page, perPage)
	ttl := 5 * time.Minute

	var result resenasListResult
	err := s.cache.GetOrFetchInto(key, ttl, &result, func() (interface{}, error) {
		resenas, total, e := s.repo.GetByPropiedad(ctx, propiedadID, page, perPage)
		if e != nil {
			return nil, e
		}
		if resenas == nil {
			resenas = []repository.ResenaConAutor{}
		}
		return resenasListResult{Items: resenas, Total: total}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Items, result.Total, nil
}

type resenasListResult struct {
	Items []repository.ResenaConAutor
	Total int
}
