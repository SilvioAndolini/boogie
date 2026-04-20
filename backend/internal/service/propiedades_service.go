package service

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/repository"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PropiedadesRepository interface {
	SearchPublic(ctx context.Context, f *repository.PropiedadesFiltros) ([]repository.PropiedadListado, int, error)
	GetByID(ctx context.Context, id string) (*repository.PropiedadDetalleFull, error)
	GetBySlug(ctx context.Context, slug string) (*repository.PropiedadDetalleFull, error)
	ListByPropietario(ctx context.Context, propietarioID string) ([]repository.PropiedadListado, error)
	CountByPropietario(ctx context.Context, propietarioID string) (int, error)
	UpdateEstadoWithOwner(ctx context.Context, id, estado, propietarioID string) error
	DeleteWithOwner(ctx context.Context, id, propietarioID string) error
	GetUserPlan(ctx context.Context, userID string) (string, error)
	GetPropiedadOwner(ctx context.Context, propiedadID string) (string, error)
	FindAmenidadesByNombres(ctx context.Context, nombres []string) ([]string, error)
	GetAmenidades(ctx context.Context, propiedadID string) ([]repository.AmenidadInfo, error)
	CrearPropiedadWithDB(ctx context.Context, db repository.DBTX, propietarioID string, input repository.CrearPropiedadInput, amenidadIDs []string) (*repository.CrearPropiedadResult, error)
	ActualizarPropiedadWithDB(ctx context.Context, db repository.DBTX, propiedadID, propietarioID string, input repository.CrearPropiedadInput, amenidadIDs []string) error
	AgregarImagenesWithDB(ctx context.Context, db repository.DBTX, propiedadID string, imagenes []repository.ImagenInput) error
	ActualizarImagenes(ctx context.Context, propiedadID string, updates []repository.ImagenUpdate) error
	Pool() *pgxpool.Pool
}

type PropiedadesService struct {
	repo    PropiedadesRepository
	maxFree int
	cache   Cache
}

func NewPropiedadesService(repo PropiedadesRepository, maxFree int, cache Cache) *PropiedadesService {
	return &PropiedadesService{repo: repo, maxFree: maxFree, cache: cache}
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

	var result propiedadesSearchResult
	err := s.cache.GetOrFetchInto(ctx, key, ttl, &result, func() (interface{}, error) {
		items, total, e := s.repo.SearchPublic(ctx, filtros)
		return propiedadesSearchResult{Items: items, Total: total}, e
	})
	if err != nil {
		return nil, 0, err
	}

	return result.Items, result.Total, nil
}

type propiedadesSearchResult struct {
	Items []repository.PropiedadListado
	Total int
}

func (s *PropiedadesService) GetByID(ctx context.Context, id string) (*repository.PropiedadDetalleFull, error) {
	key := "propiedades:detail:" + id
	ttl := 5 * time.Minute

	var result repository.PropiedadDetalleFull
	err := s.cache.GetOrFetchInto(ctx, key, ttl, &result, func() (interface{}, error) {
		return s.repo.GetByID(ctx, id)
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *PropiedadesService) GetBySlug(ctx context.Context, slug string) (*repository.PropiedadDetalleFull, error) {
	key := "propiedades:slug:" + slug
	ttl := 5 * time.Minute

	var result repository.PropiedadDetalleFull
	err := s.cache.GetOrFetchInto(ctx, key, ttl, &result, func() (interface{}, error) {
		return s.repo.GetBySlug(ctx, slug)
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *PropiedadesService) GetByIDOrSlug(ctx context.Context, idOrSlug string) (*repository.PropiedadDetalleFull, error) {
	key := "propiedades:lookup:" + idOrSlug
	ttl := 5 * time.Minute

	var result repository.PropiedadDetalleFull
	err := s.cache.GetOrFetchInto(ctx, key, ttl, &result, func() (interface{}, error) {
		if isUUID(idOrSlug) || isULID(idOrSlug) {
			return s.repo.GetByID(ctx, idOrSlug)
		}
		result, err := s.repo.GetBySlug(ctx, idOrSlug)
		if err != nil {
			return s.repo.GetByID(ctx, idOrSlug)
		}
		return result, nil
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
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
	if err := s.repo.UpdateEstadoWithOwner(ctx, id, estado, propietarioID); err != nil {
		return err
	}
	s.invalidatePropiedadAndSearch(ctx, id)
	return nil
}

func (s *PropiedadesService) Delete(ctx context.Context, id, propietarioID string) error {
	if err := s.repo.DeleteWithOwner(ctx, id, propietarioID); err != nil {
		return err
	}
	s.invalidatePropiedadAndSearch(ctx, id)
	return nil
}

func (s *PropiedadesService) invalidatePropiedad(ctx context.Context, id string) {
	s.cache.Delete(ctx, "propiedades:detail:"+id)
	s.cache.Delete(ctx, "propiedades:lookup:"+id)
}

func (s *PropiedadesService) invalidatePropiedadAndSearch(ctx context.Context, id string) {
	s.invalidatePropiedad(ctx, id)
	s.cache.DeleteByPrefix(ctx, "propiedades:search:")
	s.cache.DeleteByPrefix(ctx, "propiedades:slug:")
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
			if (c < '0' || c > '9') && (c < 'a' || c > 'f') && (c < 'A' || c > 'F') {
				return false
			}
		}
	}
	return true
}

func isULID(s string) bool {
	if len(s) != 24 {
		return false
	}
	for _, c := range s {
		if (c < '0' || c > '9') && (c < 'a' || c > 'z') && (c < 'A' || c > 'Z') {
			return false
		}
	}
	return true
}

var _ = math.Pi
var _ = enums.PlanFree

var validTipoPropiedad = map[string]bool{
	"APARTAMENTO": true, "CASA": true, "VILLA": true, "CABANA": true,
	"ESTUDIO": true, "HABITACION": true, "LOFT": true, "PENTHOUSE": true,
	"FINCA": true, "OTRO": true,
}

var validMoneda = map[string]bool{"USD": true, "VES": true}
var validPolitica = map[string]bool{"FLEXIBLE": true, "MODERADA": true, "ESTRICTA": true}
var validCategoria = map[string]bool{"ALOJAMIENTO": true, "DEPORTE": true}

var validTipoCancha = map[string]bool{
	"FUTBOL": true, "BALONCESTO": true, "TENIS": true,
	"PADDLE": true, "TENIS_DE_MESA": true, "MULTIDEPORTE": true,
}

func validarCrearInput(input *repository.CrearPropiedadInput) error {
	input.Titulo = strings.TrimSpace(input.Titulo)
	input.Descripcion = strings.TrimSpace(input.Descripcion)
	input.Direccion = strings.TrimSpace(input.Direccion)
	input.Ciudad = strings.TrimSpace(input.Ciudad)
	input.Estado = strings.TrimSpace(input.Estado)

	if input.Titulo == "" || len(input.Titulo) > 120 {
		return fmt.Errorf("titulo requerido (max 120 caracteres)")
	}
	if input.Descripcion == "" || len(input.Descripcion) > 5000 {
		return fmt.Errorf("descripcion requerida (max 5000 caracteres)")
	}
	if !validTipoPropiedad[input.TipoPropiedad] {
		return fmt.Errorf("tipo_propiedad invalido: %s", input.TipoPropiedad)
	}
	if input.Categoria != "DEPORTE" && input.PrecioPorNoche <= 0 {
		return fmt.Errorf("precio_por_noche debe ser mayor a 0")
	}
	if !validMoneda[input.Moneda] {
		return fmt.Errorf("moneda invalida: %s", input.Moneda)
	}
	if input.CapacidadMaxima < 1 || input.CapacidadMaxima > 50 {
		return fmt.Errorf("capacidad_maxima debe estar entre 1 y 50")
	}
	if input.Habitaciones < 0 || input.Habitaciones > 50 {
		return fmt.Errorf("habitaciones debe estar entre 0 y 50")
	}
	if input.Banos < 0 || input.Banos > 50 {
		return fmt.Errorf("banos debe estar entre 0 y 50")
	}
	if input.Camas < 0 || input.Camas > 50 {
		return fmt.Errorf("camas debe estar entre 0 y 50")
	}
	if input.Direccion == "" {
		return fmt.Errorf("direccion requerida")
	}
	if input.Ciudad == "" {
		return fmt.Errorf("ciudad requerida")
	}
	if input.Estado == "" {
		return fmt.Errorf("estado requerido")
	}
	if !validPolitica[input.PoliticaCancelacion] {
		return fmt.Errorf("politica_cancelacion invalida: %s", input.PoliticaCancelacion)
	}
	if !validCategoria[input.Categoria] {
		return fmt.Errorf("categoria invalida: %s", input.Categoria)
	}
	if input.Categoria == "DEPORTE" {
		if input.TipoCancha == nil || !validTipoCancha[*input.TipoCancha] {
			return fmt.Errorf("tipo_cancha requerido y valido para categoria DEPORTE")
		}
		if input.PrecioPorHora == nil || *input.PrecioPorHora <= 0 {
			return fmt.Errorf("precio_por_hora requerido para categoria DEPORTE")
		}
	}
	if input.EsExpress {
		if input.PrecioExpress == nil || *input.PrecioExpress <= 0 {
			return fmt.Errorf("precio_express requerido cuando es_express es true")
		}
	}
	if input.EstanciaMinima < 1 {
		input.EstanciaMinima = 1
	}
	if input.HorarioCheckIn == "" {
		input.HorarioCheckIn = "14:00"
	}
	if input.HorarioCheckOut == "" {
		input.HorarioCheckOut = "11:00"
	}
	if input.PoliticaCancelacion == "" {
		input.PoliticaCancelacion = "MODERADA"
	}
	return nil
}

func (s *PropiedadesService) Crear(ctx context.Context, userID string, input *repository.CrearPropiedadInput, amenidadNombres []string) (*repository.CrearPropiedadResult, error) {
	if err := validarCrearInput(input); err != nil {
		return nil, fmt.Errorf("validacion: %w", err)
	}

	plan, err := s.repo.GetUserPlan(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener plan: %w", err)
	}
	if err := s.CanCreate(ctx, userID, plan); err != nil {
		return nil, err
	}

	var amenidadIDs []string
	if len(amenidadNombres) > 0 {
		amenidadIDs, err = s.repo.FindAmenidadesByNombres(ctx, amenidadNombres)
		if err != nil {
			return nil, fmt.Errorf("error al buscar amenidades: %w", err)
		}
	}

	var result *repository.CrearPropiedadResult

	err = repository.WithTx(ctx, s.repo.Pool(), func(tx pgx.Tx) error {
		var txErr error
		result, txErr = s.repo.CrearPropiedadWithDB(ctx, tx, userID, *input, amenidadIDs)
		if txErr != nil {
			return fmt.Errorf("error al crear propiedad: %w", txErr)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	s.cache.DeleteByPrefix(ctx, "propiedades:search:")

	return result, nil
}

func (s *PropiedadesService) Actualizar(ctx context.Context, userID, propiedadID string, input *repository.CrearPropiedadInput, amenidadNombres []string) (*repository.PropiedadDetalleFull, error) {
	if err := validarCrearInput(input); err != nil {
		return nil, fmt.Errorf("validacion: %w", err)
	}

	ownerID, err := s.repo.GetPropiedadOwner(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("propiedad no encontrada")
	}
	if ownerID != userID {
		return nil, fmt.Errorf("no eres el propietario de esta propiedad")
	}

	var amenidadIDs []string
	if len(amenidadNombres) > 0 {
		amenidadIDs, err = s.repo.FindAmenidadesByNombres(ctx, amenidadNombres)
		if err != nil {
			return nil, fmt.Errorf("error al buscar amenidades: %w", err)
		}
	}

	err = repository.WithTx(ctx, s.repo.Pool(), func(tx pgx.Tx) error {
		if txErr := s.repo.ActualizarPropiedadWithDB(ctx, tx, propiedadID, userID, *input, amenidadIDs); txErr != nil {
			return fmt.Errorf("error al actualizar propiedad: %w", txErr)
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("error al actualizar propiedad: %w", err)
	}

	s.invalidatePropiedadAndSearch(ctx, propiedadID)

	detalle, err := s.repo.GetByID(ctx, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener propiedad actualizada: %w", err)
	}

	return detalle, nil
}

func (s *PropiedadesService) GetAmenidades(ctx context.Context, propiedadID string) ([]repository.AmenidadInfo, error) {
	return s.repo.GetAmenidades(ctx, propiedadID)
}

func (s *PropiedadesService) AgregarImagenes(ctx context.Context, userID, propiedadID string, imagenes []repository.ImagenInput) error {
	ownerID, err := s.repo.GetPropiedadOwner(ctx, propiedadID)
	if err != nil {
		return fmt.Errorf("propiedad no encontrada")
	}
	if ownerID != userID {
		return fmt.Errorf("no eres el propietario de esta propiedad")
	}

	for i := range imagenes {
		if imagenes[i].URL == "" {
			return fmt.Errorf("url de imagen requerida")
		}
		if !strings.HasPrefix(imagenes[i].URL, "https://") && !strings.HasPrefix(imagenes[i].URL, "http://") {
			return fmt.Errorf("url de imagen debe ser HTTPS")
		}
	}

	return repository.WithTx(ctx, s.repo.Pool(), func(tx pgx.Tx) error {
		return s.repo.AgregarImagenesWithDB(ctx, tx, propiedadID, imagenes)
	})
}

func (s *PropiedadesService) ActualizarImagenes(ctx context.Context, userID, propiedadID string, updates []repository.ImagenUpdate) error {
	ownerID, err := s.repo.GetPropiedadOwner(ctx, propiedadID)
	if err != nil {
		return fmt.Errorf("propiedad no encontrada")
	}
	if ownerID != userID {
		return fmt.Errorf("no eres el propietario de esta propiedad")
	}

	if err := s.repo.ActualizarImagenes(ctx, propiedadID, updates); err != nil {
		return err
	}

	s.invalidatePropiedad(ctx, propiedadID)
	return nil
}
