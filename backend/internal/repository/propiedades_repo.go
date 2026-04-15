package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/domain/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PropiedadesRepo struct {
	pool *pgxpool.Pool
}

func NewPropiedadesRepo(pool *pgxpool.Pool) *PropiedadesRepo {
	return &PropiedadesRepo{pool: pool}
}

type PropiedadListado struct {
	ID              string   `json:"id"`
	Titulo          string   `json:"titulo"`
	Slug            string   `json:"slug"`
	TipoPropiedad   string   `json:"tipo_propiedad"`
	PrecioPorNoche  float64  `json:"precio_por_noche"`
	Moneda          string   `json:"moneda"`
	Capacidad       int      `json:"capacidad"`
	Dormitorios     int      `json:"dormitorios"`
	Banos           int      `json:"banos"`
	Ciudad          string   `json:"ciudad"`
	Estado          string   `json:"estado"`
	Latitud         *float64 `json:"latitud"`
	Longitud        *float64 `json:"longitud"`
	Calificacion    float64  `json:"calificacion"`
	TotalResenas    int      `json:"total_resenas"`
	ImagenPrincipal *string  `json:"imagen_principal"`
	PlanSuscripcion *string  `json:"plan_suscripcion"`
}

type PropiedadDetalleFull struct {
	models.Propiedad
	Propietario *PropietarioInfo `json:"propietario"`
	Amenidades  []AmenidadInfo   `json:"amenidades"`
}

type PropietarioInfo struct {
	ID              string  `json:"id"`
	Nombre          string  `json:"nombre"`
	Apellido        string  `json:"apellido"`
	AvatarURL       *string `json:"avatar_url"`
	Verificado      bool    `json:"verificado"`
	PlanSuscripcion string  `json:"plan_suscripcion"`
	Bio             *string `json:"bio"`
	Reputacion      float64 `json:"reputacion"`
}

type AmenidadInfo struct {
	ID        string  `json:"id"`
	Nombre    string  `json:"nombre"`
	Icono     *string `json:"icono"`
	Categoria string  `json:"categoria"`
}

type PropiedadesFiltros struct {
	Ubicacion     string
	Lat           *float64
	Lng           *float64
	Radio         *float64
	PrecioMin     *float64
	PrecioMax     *float64
	Huespedes     *int
	TipoPropiedad *string
	Dormitorios   *int
	Banos         *int
	Amenidades    []string
	OrdenarPor    string
	Pagina        int
	PorPagina     int
}

func (f *PropiedadesFiltros) CacheKey() string {
	var b strings.Builder
	b.WriteString(f.Ubicacion)
	if f.Lat != nil {
		fmt.Fprintf(&b, ":lat=%.4f", *f.Lat)
	}
	if f.Lng != nil {
		fmt.Fprintf(&b, ":lng=%.4f", *f.Lng)
	}
	if f.Radio != nil {
		fmt.Fprintf(&b, ":r=%.1f", *f.Radio)
	}
	if f.PrecioMin != nil {
		fmt.Fprintf(&b, ":pmin=%.0f", *f.PrecioMin)
	}
	if f.PrecioMax != nil {
		fmt.Fprintf(&b, ":pmax=%.0f", *f.PrecioMax)
	}
	if f.Huespedes != nil {
		fmt.Fprintf(&b, ":h=%d", *f.Huespedes)
	}
	if f.TipoPropiedad != nil {
		fmt.Fprintf(&b, ":t=%s", *f.TipoPropiedad)
	}
	if f.Dormitorios != nil {
		fmt.Fprintf(&b, ":d=%d", *f.Dormitorios)
	}
	if f.Banos != nil {
		fmt.Fprintf(&b, ":b=%d", *f.Banos)
	}
	for _, a := range f.Amenidades {
		fmt.Fprintf(&b, ":a=%s", a)
	}
	fmt.Fprintf(&b, ":sort=%s:page=%d:pp=%d", f.OrdenarPor, f.Pagina, f.PorPagina)
	return b.String()
}

func (r *PropiedadesRepo) SearchPublic(ctx context.Context, f *PropiedadesFiltros) ([]PropiedadListado, int, error) {
	where := []string{"p.estado_publicacion = 'PUBLICADA'"}
	args := []interface{}{}
	argIdx := 1

	if f.Ubicacion != "" {
		where = append(where, fmt.Sprintf("(p.ciudad ILIKE '%%' || $%d || '%%' OR p.estado ILIKE '%%' || $%d || '%%')", argIdx, argIdx))
		args = append(args, f.Ubicacion)
		argIdx++
	}
	if f.PrecioMin != nil {
		where = append(where, fmt.Sprintf("p.precio_por_noche >= $%d", argIdx))
		args = append(args, *f.PrecioMin)
		argIdx++
	}
	if f.PrecioMax != nil {
		where = append(where, fmt.Sprintf("p.precio_por_noche <= $%d", argIdx))
		args = append(args, *f.PrecioMax)
		argIdx++
	}
	if f.Huespedes != nil {
		where = append(where, fmt.Sprintf("COALESCE(p.capacidad_maxima, 1) >= $%d", argIdx))
		args = append(args, *f.Huespedes)
		argIdx++
	}
	if f.TipoPropiedad != nil && *f.TipoPropiedad != "" {
		where = append(where, fmt.Sprintf("p.tipo_propiedad = $%d", argIdx))
		args = append(args, *f.TipoPropiedad)
		argIdx++
	}
	if f.Dormitorios != nil {
		where = append(where, fmt.Sprintf("COALESCE(p.habitaciones, 0) >= $%d", argIdx))
		args = append(args, *f.Dormitorios)
		argIdx++
	}
	if f.Banos != nil {
		where = append(where, fmt.Sprintf("p.banos >= $%d", argIdx))
		args = append(args, *f.Banos)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	orderBy := "p.fecha_actualizacion DESC"
	switch f.OrdenarPor {
	case "precio_asc":
		orderBy = "p.precio_por_noche ASC"
	case "precio_desc":
		orderBy = "p.precio_por_noche DESC"
	case "rating":
		orderBy = "p.rating_promedio DESC NULLS LAST"
	case "recientes":
		orderBy = "p.fecha_actualizacion DESC"
	}

	if f.Lat != nil && f.Lng != nil && f.Radio != nil {
		orderBy = fmt.Sprintf(
			"SQRT(POWER(p.latitud - $%d, 2) + POWER(p.longitud - $%d, 2)) * 111 ASC",
			argIdx, argIdx+1,
		)
		args = append(args, *f.Lat, *f.Lng)
		argIdx += 2
	}

	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM propiedades p WHERE %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count propiedades: %w", err)
	}

	offset := 0
	if f.Pagina > 0 {
		offset = (f.Pagina - 1) * f.PorPagina
	}
	limit := f.PorPagina
	if limit <= 0 {
		limit = 12
	}

	query := fmt.Sprintf(`
		SELECT p.id, p.titulo, p.slug, p.tipo_propiedad, p.precio_por_noche, p.moneda,
		       COALESCE(p.capacidad_maxima, 1), COALESCE(p.habitaciones, 0), p.banos, p.ciudad, p.estado,
		       p.latitud, p.longitud, COALESCE(p.rating_promedio, 0), COALESCE(p.total_resenas, 0),
		       (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) as imagen_principal,
		       u.plan_suscripcion
		FROM propiedades p
		LEFT JOIN usuarios u ON u.id = p.propietario_id
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("search propiedades: %w", err)
	}
	defer rows.Close()

	var results []PropiedadListado
	for rows.Next() {
		var item PropiedadListado
		if err := rows.Scan(
			&item.ID, &item.Titulo, &item.Slug, &item.TipoPropiedad,
			&item.PrecioPorNoche, &item.Moneda, &item.Capacidad,
			&item.Dormitorios, &item.Banos, &item.Ciudad, &item.Estado,
			&item.Latitud, &item.Longitud, &item.Calificacion, &item.TotalResenas,
			&item.ImagenPrincipal, &item.PlanSuscripcion,
		); err != nil {
			return nil, 0, fmt.Errorf("scan propiedad: %w", err)
		}
		results = append(results, item)
	}

	return results, total, nil
}

func (r *PropiedadesRepo) GetByID(ctx context.Context, id string) (*PropiedadDetalleFull, error) {
	var p models.Propiedad
	var zona, pais, cp, reglas *string
	var checkIn, checkOut *string
	var estanciaMax *int
	var destacada *bool
	var fechaPub *time.Time
	var vistas *int

	err := r.pool.QueryRow(ctx, `
		SELECT id, propietario_id, titulo, slug, descripcion, tipo_propiedad,
		       precio_por_noche, moneda, politica_cancelacion,
		       COALESCE(capacidad_maxima, 1), COALESCE(habitaciones, 0), banos, camas,
		       direccion, ciudad, estado,
		       zona, NULL, latitud, longitud, codigo_postal,
		       reglas, horario_checkin, horario_checkout,
		       estancia_minima, estancia_maxima,
		       estado_publicacion, destacada,
		       fecha_publicacion, fecha_actualizacion,
		       COALESCE(vistas_totales, 0), COALESCE(rating_promedio, 0), COALESCE(total_resenas, 0),
		       NOW(), NOW()
		FROM propiedades WHERE id = $1
	`, id).Scan(
		&p.ID, &p.PropietarioID, &p.Titulo, &p.Slug, &p.Descripcion, &p.TipoPropiedad,
		&p.PrecioPorNoche, &p.Moneda, &p.PoliticaCancelacion,
		&p.Capacidad, &p.Dormitorios, &p.Banos, &p.Camas,
		&p.Direccion, &p.Ciudad, &p.Estado,
		&zona, &pais, &p.Latitud, &p.Longitud, &cp,
		&reglas, &checkIn, &checkOut,
		&p.EstanciaMinima, &estanciaMax,
		&p.EstadoPublicacion, &destacada,
		&fechaPub, &p.FechaActualizacion,
		&vistas, &p.Calificacion, &p.CantidadResenas,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get propiedad: %w", err)
	}
	p.Zona = zona
	p.Pais = pais
	p.CodigoPostal = cp
	p.Reglas = reglas
	p.CheckIn = checkIn
	p.CheckOut = checkOut
	p.EstanciaMaxima = estanciaMax
	if destacada != nil {
		p.Destacada = *destacada
	}
	p.FechaPublicacion = fechaPub
	if vistas != nil {
		p.VistasTotales = *vistas
	}

	propietario, err := r.getPropietario(ctx, p.PropietarioID)
	if err != nil {
		return nil, fmt.Errorf("get propietario: %w", err)
	}
	amenidades, err := r.getAmenidades(ctx, p.ID)
	if err != nil {
		return nil, fmt.Errorf("get amenidades: %w", err)
	}
	imagenes, err := r.getImagenes(ctx, p.ID)
	if err != nil {
		return nil, fmt.Errorf("get imagenes: %w", err)
	}

	p.Imagenes = imagenes

	return &PropiedadDetalleFull{
		Propiedad:   p,
		Propietario: propietario,
		Amenidades:  amenidades,
	}, nil
}

func (r *PropiedadesRepo) GetBySlug(ctx context.Context, slug string) (*PropiedadDetalleFull, error) {
	var id string
	err := r.pool.QueryRow(ctx, `SELECT id FROM propiedades WHERE slug = $1`, slug).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("propiedad by slug: %w", err)
	}
	return r.GetByID(ctx, id)
}

func (r *PropiedadesRepo) ListByPropietario(ctx context.Context, propietarioID string) ([]PropiedadListado, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.titulo, p.slug, p.tipo_propiedad, p.precio_por_noche, p.moneda,
		       COALESCE(p.capacidad_maxima, 1), COALESCE(p.habitaciones, 0), p.banos, p.ciudad, p.estado,
		       p.latitud, p.longitud, COALESCE(p.rating_promedio, 0), COALESCE(p.total_resenas, 0),
		       (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1),
		       NULL::text
		FROM propiedades p
		WHERE p.propietario_id = $1
		ORDER BY p.fecha_actualizacion DESC
	`, propietarioID)
	if err != nil {
		return nil, fmt.Errorf("list propiedades propietario: %w", err)
	}
	defer rows.Close()

	var results []PropiedadListado
	for rows.Next() {
		var item PropiedadListado
		if err := rows.Scan(
			&item.ID, &item.Titulo, &item.Slug, &item.TipoPropiedad,
			&item.PrecioPorNoche, &item.Moneda, &item.Capacidad,
			&item.Dormitorios, &item.Banos, &item.Ciudad, &item.Estado,
			&item.Latitud, &item.Longitud, &item.Calificacion, &item.TotalResenas,
			&item.ImagenPrincipal, &item.PlanSuscripcion,
		); err != nil {
			return nil, fmt.Errorf("scan: %w", err)
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *PropiedadesRepo) CountByPropietario(ctx context.Context, propietarioID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM propiedades WHERE propietario_id = $1`, propietarioID).Scan(&count)
	return count, err
}

func (r *PropiedadesRepo) UpdateEstado(ctx context.Context, id, estado string) error {
	_, err := r.pool.Exec(ctx, `UPDATE propiedades SET estado_publicacion = $2, fecha_actualizacion = NOW() WHERE id = $1`, id, estado)
	return err
}

func (r *PropiedadesRepo) UpdateEstadoWithOwner(ctx context.Context, id, estado, propietarioID string) error {
	tag, err := r.pool.Exec(ctx, `UPDATE propiedades SET estado_publicacion = $2, fecha_actualizacion = NOW() WHERE id = $1 AND propietario_id = $3`, id, estado, propietarioID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("propiedad no encontrada o no eres el propietario")
	}
	return nil
}

func (r *PropiedadesRepo) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM propiedad_amenidades WHERE propiedad_id = $1`, id)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, `DELETE FROM imagenes_propiedad WHERE propiedad_id = $1`, id)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, `DELETE FROM propiedades WHERE id = $1`, id)
	return err
}

func (r *PropiedadesRepo) DeleteWithOwner(ctx context.Context, id, propietarioID string) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM propiedades WHERE id = $1 AND propietario_id = $2`, id, propietarioID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("propiedad no encontrada o no eres el propietario")
	}
	_, _ = r.pool.Exec(ctx, `DELETE FROM propiedad_amenidades WHERE propiedad_id = $1`, id)
	_, _ = r.pool.Exec(ctx, `DELETE FROM imagenes_propiedad WHERE propiedad_id = $1`, id)
	return nil
}

func (r *PropiedadesRepo) getPropietario(ctx context.Context, userID string) (*PropietarioInfo, error) {
	var p PropietarioInfo
	var bio *string
	var reputacion *float64
	err := r.pool.QueryRow(ctx, `
		SELECT id, nombre, apellido, avatar_url, verificado, plan_suscripcion, bio, reputacion
		FROM usuarios WHERE id = $1
	`, userID).Scan(&p.ID, &p.Nombre, &p.Apellido, &p.AvatarURL, &p.Verificado, &p.PlanSuscripcion, &bio, &reputacion)
	if err != nil {
		return nil, err
	}
	p.Bio = bio
	if reputacion != nil {
		p.Reputacion = *reputacion
	}
	return &p, nil
}

func (r *PropiedadesRepo) getAmenidades(ctx context.Context, propiedadID string) ([]AmenidadInfo, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.id, a.nombre, a.icono, a.categoria
		FROM amenidades a
		JOIN propiedad_amenidades pa ON pa.amenidad_id = a.id
		WHERE pa.propiedad_id = $1
	`, propiedadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []AmenidadInfo
	for rows.Next() {
		var a AmenidadInfo
		if err := rows.Scan(&a.ID, &a.Nombre, &a.Icono, &a.Categoria); err != nil {
			return nil, err
		}
		results = append(results, a)
	}
	return results, nil
}

func (r *PropiedadesRepo) getImagenes(ctx context.Context, propiedadID string) ([]models.ImagenPropiedad, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, propiedad_id, url, thumbnail_url, alt, categoria, orden
		FROM imagenes_propiedad WHERE propiedad_id = $1 ORDER BY orden
	`, propiedadID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.ImagenPropiedad
	for rows.Next() {
		var img models.ImagenPropiedad
		if err := rows.Scan(&img.ID, &img.PropiedadID, &img.URL, &img.ThumbnailURL, &img.Alt, &img.Categoria, &img.Orden); err != nil {
			return nil, err
		}
		results = append(results, img)
	}
	return results, nil
}

func GenerateSlug(titulo string) string {
	slug := strings.ToLower(titulo)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.Map(func(r rune) rune {
		if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '-' {
			return r
		}
		return -1
	}, slug)
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")
	if len(slug) > 80 {
		slug = slug[:80]
	}
	slug += "-"
	b := make([]byte, 2)
	_, _ = rand.Read(b)
	slug += hex.EncodeToString(b)
	return slug
}

func HaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

var _ = enums.EstadoPublicacionPublicada
var _ = time.Time{}
