package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/domain/idgen"
	bizerrors "github.com/boogie/backend/internal/domain/errors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SeccionesRepo struct {
	pool *pgxpool.Pool
}

func NewSeccionesRepo(pool *pgxpool.Pool) *SeccionesRepo {
	return &SeccionesRepo{pool: pool}
}

type SeccionDestacada struct {
	ID                 string    `json:"id"`
	Titulo             string    `json:"titulo"`
	Subtitulo          *string   `json:"subtitulo"`
	TipoFiltro         string    `json:"tipo_filtro"`
	FiltroEstado       *string   `json:"filtro_estado"`
	FiltroCiudad       *string   `json:"filtro_ciudad"`
	PropiedadIDs       []string  `json:"propiedad_ids"`
	Orden              int       `json:"orden"`
	Activa             bool      `json:"activa"`
	FechaCreacion      time.Time `json:"fecha_creacion"`
	FechaActualizacion time.Time `json:"fecha_actualizacion"`
}

type PropiedadResumen struct {
	ID              string   `json:"id"`
	Titulo          string   `json:"titulo"`
	TipoPropiedad   *string  `json:"tipo_propiedad"`
	PrecioPorNoche  float64  `json:"precio_por_noche"`
	Moneda          string   `json:"moneda"`
	Ciudad          *string  `json:"ciudad"`
	Estado          *string  `json:"estado"`
	Slug            *string  `json:"slug"`
	Habitaciones    int      `json:"habitaciones"`
	Camas           int      `json:"camas"`
	Banos           int      `json:"banos"`
	RatingPromedio  float64  `json:"rating_promedio"`
	TotalResenas    int      `json:"total_resenas"`
	Imagenes        []string `json:"imagenes"`
	PlanPropietario string   `json:"plan_propietario"`
}

type SeccionConPropiedades struct {
	SeccionDestacada
	Propiedades []PropiedadResumen `json:"propiedades"`
}

func (r *SeccionesRepo) GetPublicas(ctx context.Context) ([]SeccionDestacada, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, titulo, subtitulo, tipo_filtro, filtro_estado, filtro_ciudad,
		       propiedad_ids, orden, activa, fecha_creacion, fecha_actualizacion
		FROM secciones_destacadas
		WHERE activa = true
		ORDER BY orden ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("get secciones publicas: %w", err)
	}
	defer rows.Close()

	var results []SeccionDestacada
	for rows.Next() {
		var s SeccionDestacada
		if err := rows.Scan(&s.ID, &s.Titulo, &s.Subtitulo, &s.TipoFiltro, &s.FiltroEstado,
			&s.FiltroCiudad, &s.PropiedadIDs, &s.Orden, &s.Activa, &s.FechaCreacion, &s.FechaActualizacion); err != nil {
			return nil, fmt.Errorf("scan seccion: %w", err)
		}
		results = append(results, s)
	}
	if results == nil {
		results = []SeccionDestacada{}
	}
	return results, nil
}

func (r *SeccionesRepo) GetAdmin(ctx context.Context) ([]SeccionDestacada, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, titulo, subtitulo, tipo_filtro, filtro_estado, filtro_ciudad,
		       propiedad_ids, orden, activa, fecha_creacion, fecha_actualizacion
		FROM secciones_destacadas
		ORDER BY orden ASC
	`)
	if err != nil {
		return nil, fmt.Errorf("get secciones admin: %w", err)
	}
	defer rows.Close()

	var results []SeccionDestacada
	for rows.Next() {
		var s SeccionDestacada
		if err := rows.Scan(&s.ID, &s.Titulo, &s.Subtitulo, &s.TipoFiltro, &s.FiltroEstado,
			&s.FiltroCiudad, &s.PropiedadIDs, &s.Orden, &s.Activa, &s.FechaCreacion, &s.FechaActualizacion); err != nil {
			return nil, fmt.Errorf("scan seccion: %w", err)
		}
		results = append(results, s)
	}
	if results == nil {
		results = []SeccionDestacada{}
	}
	return results, nil
}

func (r *SeccionesRepo) Insert(ctx context.Context, s *SeccionDestacada) error {
	s.ID = idgen.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO secciones_destacadas (id, titulo, subtitulo, tipo_filtro, filtro_estado, filtro_ciudad,
		                                  propiedad_ids, orden, activa)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, s.ID, s.Titulo, s.Subtitulo, s.TipoFiltro, s.FiltroEstado, s.FiltroCiudad,
		s.PropiedadIDs, s.Orden, s.Activa)
	if err != nil {
		return fmt.Errorf("insert seccion: %w", err)
	}
	return nil
}

func (r *SeccionesRepo) Update(ctx context.Context, s *SeccionDestacada) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE secciones_destacadas SET
			titulo = $1, subtitulo = $2, tipo_filtro = $3, filtro_estado = $4,
			filtro_ciudad = $5, propiedad_ids = $6, orden = $7, activa = $8,
			fecha_actualizacion = NOW()
		WHERE id = $9
	`, s.Titulo, s.Subtitulo, s.TipoFiltro, s.FiltroEstado, s.FiltroCiudad,
		s.PropiedadIDs, s.Orden, s.Activa, s.ID)
	if err != nil {
		return fmt.Errorf("update seccion: %w", err)
	}
	return nil
}

func (r *SeccionesRepo) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM secciones_destacadas WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete seccion: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.SeccionNoEncontrada()
	}
	return nil
}

func (r *SeccionesRepo) GetPropiedadesByIDs(ctx context.Context, ids []string) ([]PropiedadResumen, error) {
	if len(ids) == 0 {
		return []PropiedadResumen{}, nil
	}
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.titulo, p.tipo_propiedad, p.precio_por_noche, p.moneda,
		       p.ciudad, p.estado, p.slug,
		       COALESCE(p.habitaciones, 1), COALESCE(p.camas, 1), COALESCE(p.banos, 1),
		       COALESCE(p.rating_promedio, 0), COALESCE(p.total_resenas, 0),
		       u.plan_suscripcion
		FROM propiedades p
		LEFT JOIN usuarios u ON u.id = p.propietario_id
		WHERE p.id = ANY($1) AND p.estado_publicacion = 'PUBLICADA'
	`, ids)
	if err != nil {
		return nil, fmt.Errorf("get propiedades by ids: %w", err)
	}
	defer rows.Close()

	return scanPropiedadesResumen(rows, r.pool, ctx)
}

func (r *SeccionesRepo) GetPropiedadesFiltradas(ctx context.Context, tipoFiltro string, filtroEstado, filtroCiudad *string, limit int) ([]PropiedadResumen, error) {
	query := `
		SELECT p.id, p.titulo, p.tipo_propiedad, p.precio_por_noche, p.moneda,
		       p.ciudad, p.estado, p.slug,
		       COALESCE(p.habitaciones, 1), COALESCE(p.camas, 1), COALESCE(p.banos, 1),
		       COALESCE(p.rating_promedio, 0), COALESCE(p.total_resenas, 0),
		       u.plan_suscripcion
		FROM propiedades p
		LEFT JOIN usuarios u ON u.id = p.propietario_id
		WHERE p.estado_publicacion = 'PUBLICADA'`

	args := []interface{}{}
	argIdx := 1

	if filtroCiudad != nil && *filtroCiudad != "" {
		query += fmt.Sprintf(" AND p.ciudad = $%d", argIdx)
		args = append(args, *filtroCiudad)
		argIdx++
	} else if filtroEstado != nil && *filtroEstado != "" {
		query += fmt.Sprintf(" AND p.estado = $%d", argIdx)
		args = append(args, *filtroEstado)
		argIdx++
	}

	if tipoFiltro == "RATING" {
		query += " ORDER BY p.rating_promedio DESC NULLS LAST"
	} else {
		query += " ORDER BY p.total_resenas DESC NULLS LAST"
	}

	query += fmt.Sprintf(" LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("get propiedades filtradas: %w", err)
	}
	defer rows.Close()

	return scanPropiedadesResumen(rows, r.pool, ctx)
}

func scanPropiedadesResumen(rows pgx.Rows, pool *pgxpool.Pool, ctx context.Context) ([]PropiedadResumen, error) {
	var results []PropiedadResumen
	var ids []string

	for rows.Next() {
		var p PropiedadResumen
		var plan *string
		if err := rows.Scan(&p.ID, &p.Titulo, &p.TipoPropiedad, &p.PrecioPorNoche, &p.Moneda,
			&p.Ciudad, &p.Estado, &p.Slug,
			&p.Habitaciones, &p.Camas, &p.Banos,
			&p.RatingPromedio, &p.TotalResenas, &plan); err != nil {
			return nil, fmt.Errorf("scan propiedad resumen: %w", err)
		}
		if plan != nil {
			p.PlanPropietario = *plan
		} else {
			p.PlanPropietario = "FREE"
		}
		results = append(results, p)
		ids = append(ids, p.ID)
	}

	if results == nil {
		return []PropiedadResumen{}, nil
	}

	imgMap, _ := getImagenesByPropiedades(pool, ctx, ids)
	for i := range results {
		results[i].Imagenes = imgMap[results[i].ID]
		if results[i].Imagenes == nil {
			results[i].Imagenes = []string{}
		}
	}

	return results, nil
}

func getImagenesByPropiedades(pool *pgxpool.Pool, ctx context.Context, ids []string) (map[string][]string, error) {
	if len(ids) == 0 {
		return map[string][]string{}, nil
	}
	rows, err := pool.Query(ctx, `
		SELECT propiedad_id, url FROM imagenes_propiedad
		WHERE propiedad_id = ANY($1)
		ORDER BY orden ASC
	`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string][]string{}
	for rows.Next() {
		var propID, url string
		if err := rows.Scan(&propID, &url); err != nil {
			return nil, err
		}
		result[propID] = append(result[propID], url)
	}
	return result, nil
}

type PropiedadSearchResult struct {
	ID     string  `json:"id"`
	Titulo string  `json:"titulo"`
	Ciudad *string `json:"ciudad"`
	Estado *string `json:"estado"`
	Imagen *string `json:"imagen"`
}

func (r *SeccionesRepo) SearchPropiedades(ctx context.Context, query string) ([]PropiedadSearchResult, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.titulo, p.ciudad, p.estado, i.url
		FROM propiedades p
		LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) i ON true
		WHERE p.estado_publicacion = 'PUBLICADA'
		  AND ($1 = '' OR p.titulo ILIKE '%' || $1 || '%' OR p.ciudad ILIKE '%' || $1 || '%' OR p.estado ILIKE '%' || $1 || '%')
		ORDER BY p.titulo
		LIMIT 50
	`, query)
	if err != nil {
		return nil, fmt.Errorf("search propiedades: %w", err)
	}
	defer rows.Close()

	var results []PropiedadSearchResult
	for rows.Next() {
		var p PropiedadSearchResult
		if err := rows.Scan(&p.ID, &p.Titulo, &p.Ciudad, &p.Estado, &p.Imagen); err != nil {
			return nil, fmt.Errorf("scan propiedad search: %w", err)
		}
		results = append(results, p)
	}
	if results == nil {
		results = []PropiedadSearchResult{}
	}
	return results, nil
}

type PropiedadPreview struct {
	ID             string  `json:"id"`
	Titulo         string  `json:"titulo"`
	Ciudad         *string `json:"ciudad"`
	Estado         *string `json:"estado"`
	PrecioPorNoche float64 `json:"precio_por_noche"`
	Moneda         string  `json:"moneda"`
	Imagen         *string `json:"imagen"`
	RatingPromedio float64 `json:"rating_promedio"`
	TotalResenas   int     `json:"total_resenas"`
}

func (r *SeccionesRepo) PreviewPropiedades(ctx context.Context, tipoFiltro string, filtroEstado, filtroCiudad *string) ([]PropiedadPreview, error) {
	query := `
		SELECT p.id, p.titulo, p.ciudad, p.estado, p.precio_por_noche, p.moneda,
		       COALESCE(p.rating_promedio, 0), COALESCE(p.total_resenas, 0), i.url
		FROM propiedades p
		LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) i ON true
		WHERE p.estado_publicacion = 'PUBLICADA'`

	args := []interface{}{}
	argIdx := 1

	if filtroCiudad != nil && *filtroCiudad != "" {
		query += fmt.Sprintf(" AND p.ciudad = $%d", argIdx)
		args = append(args, *filtroCiudad)
		argIdx++
	} else if filtroEstado != nil && *filtroEstado != "" {
		query += fmt.Sprintf(" AND p.estado = $%d", argIdx)
		args = append(args, *filtroEstado)
		argIdx++
	}

	if tipoFiltro == "RATING" {
		query += " ORDER BY p.rating_promedio DESC NULLS LAST"
	} else {
		query += " ORDER BY p.total_resenas DESC NULLS LAST"
	}

	query += " LIMIT 10"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("preview propiedades: %w", err)
	}
	defer rows.Close()

	var results []PropiedadPreview
	for rows.Next() {
		var p PropiedadPreview
		if err := rows.Scan(&p.ID, &p.Titulo, &p.Ciudad, &p.Estado, &p.PrecioPorNoche, &p.Moneda,
			&p.RatingPromedio, &p.TotalResenas, &p.Imagen); err != nil {
			return nil, fmt.Errorf("scan preview: %w", err)
		}
		results = append(results, p)
	}
	if results == nil {
		results = []PropiedadPreview{}
	}
	return results, nil
}
