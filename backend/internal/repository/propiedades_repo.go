package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	bizerrors "github.com/boogie/backend/internal/domain/errors"
	"github.com/boogie/backend/internal/domain/models"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PropiedadesRepo struct {
	pool *pgxpool.Pool
}

func NewPropiedadesRepo(pool *pgxpool.Pool) *PropiedadesRepo {
	return &PropiedadesRepo{pool: pool}
}

func (r *PropiedadesRepo) Pool() *pgxpool.Pool { return r.pool }

type PropiedadListado struct {
	ID                string   `json:"id"`
	Titulo            string   `json:"titulo"`
	Slug              string   `json:"slug"`
	TipoPropiedad     string   `json:"tipo_propiedad"`
	PrecioPorNoche    float64  `json:"precio_por_noche"`
	Moneda            string   `json:"moneda"`
	Capacidad         int      `json:"capacidad"`
	Dormitorios       int      `json:"dormitorios"`
	Banos             int      `json:"banos"`
	Ciudad            string   `json:"ciudad"`
	Estado            string   `json:"estado"`
	Latitud           *float64 `json:"latitud"`
	Longitud          *float64 `json:"longitud"`
	Calificacion      float64  `json:"calificacion"`
	TotalResenas      int      `json:"total_resenas"`
	ImagenPrincipal   *string  `json:"imagen_principal"`
	PlanSuscripcion   *string  `json:"plan_suscripcion"`
	Categoria         string   `json:"categoria"`
	TipoCancha        *string  `json:"tipo_cancha"`
	PrecioPorHora     *float64 `json:"precio_por_hora"`
	EsExpress         bool     `json:"es_express"`
	PrecioExpress     *float64 `json:"precio_express"`
	EstadoPublicacion string   `json:"estado_publicacion"`
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
	Categoria     *string
	TipoCancha    *string
	EsExpress     *bool
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
	if f.Categoria != nil {
		fmt.Fprintf(&b, ":cat=%s", *f.Categoria)
	}
	if f.TipoCancha != nil {
		fmt.Fprintf(&b, ":tc=%s", *f.TipoCancha)
	}
	if f.EsExpress != nil {
		fmt.Fprintf(&b, ":exp=%v", *f.EsExpress)
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
	if f.Categoria != nil && *f.Categoria != "" {
		where = append(where, fmt.Sprintf("p.categoria = $%d", argIdx))
		args = append(args, *f.Categoria)
		argIdx++
	}
	if f.TipoCancha != nil && *f.TipoCancha != "" {
		where = append(where, fmt.Sprintf("p.tipo_cancha = $%d", argIdx))
		args = append(args, *f.TipoCancha)
		argIdx++
	}
	if f.EsExpress != nil {
		where = append(where, fmt.Sprintf("p.es_express = $%d", argIdx))
		args = append(args, *f.EsExpress)
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
		       ip.url as imagen_principal,
		       u.plan_suscripcion,
		       COALESCE(p.categoria, 'ALOJAMIENTO'), p.tipo_cancha, p.precio_por_hora,
		       COALESCE(p.es_express, false), p.precio_express,
		       COUNT(*) OVER() as total_count
		FROM propiedades p
		LEFT JOIN usuarios u ON u.id = p.propietario_id
		LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) ip ON true
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
	var total int
	for rows.Next() {
		var item PropiedadListado
		if err := rows.Scan(
			&item.ID, &item.Titulo, &item.Slug, &item.TipoPropiedad,
			&item.PrecioPorNoche, &item.Moneda, &item.Capacidad,
			&item.Dormitorios, &item.Banos, &item.Ciudad, &item.Estado,
			&item.Latitud, &item.Longitud, &item.Calificacion, &item.TotalResenas,
			&item.ImagenPrincipal, &item.PlanSuscripcion,
			&item.Categoria, &item.TipoCancha, &item.PrecioPorHora,
			&item.EsExpress, &item.PrecioExpress,
			&total,
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
		       NOW(), NOW(),
		       COALESCE(categoria, 'ALOJAMIENTO'), tipo_cancha, precio_por_hora,
		       hora_apertura, hora_cierre, duracion_minima_min,
		       COALESCE(es_express, false), precio_express,
		       COALESCE(modo_reserva, 'MANUAL')
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
		&p.Categoria, &p.TipoCancha, &p.PrecioPorHora,
		&p.HoraApertura, &p.HoraCierre, &p.DuracionMinimaMin,
		&p.EsExpress, &p.PrecioExpress,
		&p.ModoReserva,
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

	var batch pgx.Batch
	batch.Queue(`SELECT id, nombre, apellido, avatar_url, icono, categoria FROM amenidades a JOIN propiedad_amenidades pa ON pa.amenidad_id = a.id WHERE pa.propiedad_id = $1`, p.ID)
	batch.Queue(`SELECT id, propiedad_id, url, thumbnail_url, alt, categoria, orden FROM imagenes_propiedad WHERE propiedad_id = $1 ORDER BY orden`, p.ID)

	br := r.pool.SendBatch(ctx, &batch)
	defer func() { _ = br.Close() }()

	amenidades, err := r.scanAmenidades(ctx, br)
	if err != nil {
		return nil, fmt.Errorf("get amenidades: %w", err)
	}
	imagenes, err := r.scanImagenes(ctx, br)
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
		       ip.url,
		       NULL::text,
		       COALESCE(p.categoria, 'ALOJAMIENTO'), p.tipo_cancha, p.precio_por_hora,
		       COALESCE(p.es_express, false), p.precio_express,
		       COALESCE(p.estado_publicacion, 'BORRADOR')
		FROM propiedades p
		LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1) ip ON true
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
			&item.Categoria, &item.TipoCancha, &item.PrecioPorHora,
			&item.EsExpress, &item.PrecioExpress,
			&item.EstadoPublicacion,
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
		return bizerrors.PropiedadSinPermiso()
	}
	return nil
}

func (r *PropiedadesRepo) Delete(ctx context.Context, id string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `DELETE FROM propiedad_amenidades WHERE propiedad_id = $1`, id); err != nil {
		return fmt.Errorf("delete amenidades: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM imagenes_propiedad WHERE propiedad_id = $1`, id); err != nil {
		return fmt.Errorf("delete imagenes: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM propiedades WHERE id = $1`, id); err != nil {
		return fmt.Errorf("delete propiedad: %w", err)
	}
	return tx.Commit(ctx)
}

func (r *PropiedadesRepo) DeleteWithOwner(ctx context.Context, id, propietarioID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	tag, err := tx.Exec(ctx, `DELETE FROM propiedades WHERE id = $1 AND propietario_id = $2`, id, propietarioID)
	if err != nil {
		if isFKViolation(err) {
			return bizerrors.PropiedadConReservas()
		}
		return err
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.PropiedadSinPermiso()
	}

	if _, err := tx.Exec(ctx, `DELETE FROM propiedad_amenidades WHERE propiedad_id = $1`, id); err != nil {
		return fmt.Errorf("delete amenidades: %w", err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM imagenes_propiedad WHERE propiedad_id = $1`, id); err != nil {
		return fmt.Errorf("delete imagenes: %w", err)
	}
	return tx.Commit(ctx)
}

func isFKViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
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

func (r *PropiedadesRepo) GetAmenidades(ctx context.Context, propiedadID string) ([]AmenidadInfo, error) {
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

func (r *PropiedadesRepo) scanAmenidades(_ context.Context, br pgx.BatchResults) ([]AmenidadInfo, error) {
	rows, err := br.Query()
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

func (r *PropiedadesRepo) scanImagenes(_ context.Context, br pgx.BatchResults) ([]models.ImagenPropiedad, error) {
	rows, err := br.Query()
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

type BloqueHorario struct {
	Hora   string `json:"hora"`
	Estado string `json:"estado"`
}

func estadoHoraPrioridad(estado string) int {
	switch estado {
	case "CONFIRMADA", "EN_CURSO":
		return 3
	case "PENDIENTE_CONFIRMACION", "PENDIENTE_PAGO", "PENDIENTE":
		return 2
	default:
		return 1
	}
}

func clasificarEstadoHora(estado string) string {
	switch estado {
	case "PENDIENTE_CONFIRMACION", "PENDIENTE_PAGO", "PENDIENTE":
		return "pendiente"
	default:
		return "ocupada"
	}
}

func (r *PropiedadesRepo) GetDisponibilidadHoraria(ctx context.Context, propiedadID, fecha string) ([]BloqueHorario, error) {
	var horaApertura, horaCierre string
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(hora_apertura, '06:00'), COALESCE(hora_cierre, '23:00') FROM propiedades WHERE id = $1`,
		propiedadID,
	).Scan(&horaApertura, &horaCierre)
	if err != nil {
		return nil, fmt.Errorf("get horarios cancha: %w", err)
	}

	aperturaH, _ := strconv.Atoi(strings.Split(horaApertura, ":")[0])
	cierreH, _ := strconv.Atoi(strings.Split(horaCierre, ":")[0])
	if cierreH == 0 {
		cierreH = 23
	}

	rows, err := r.pool.Query(ctx, `
		SELECT hora_inicio, hora_fin, estado FROM reservas
		WHERE propiedad_id = $1
		  AND fecha_entrada::date = $2::date
		  AND estado NOT IN ('CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA', 'ANULADA')
	`, propiedadID, fecha)
	if err != nil {
		return nil, fmt.Errorf("get reservas cancha: %w", err)
	}
	defer rows.Close()

	estadosPorHora := map[int]string{}
	for rows.Next() {
		var hi, hf *string
		var est string
		if err := rows.Scan(&hi, &hf, &est); err != nil {
			continue
		}
		if hi != nil && hf != nil {
			start, _ := strconv.Atoi(strings.Split(*hi, ":")[0])
			end, _ := strconv.Atoi(strings.Split(*hf, ":")[0])
			for h := start; h < end; h++ {
				existing, exists := estadosPorHora[h]
				if !exists || estadoHoraPrioridad(est) > estadoHoraPrioridad(existing) {
					estadosPorHora[h] = est
				}
			}
		}
	}

	var bloques []BloqueHorario
	for h := aperturaH; h < cierreH; h++ {
		horaStr := fmt.Sprintf("%02d:00", h)
		est, ok := estadosPorHora[h]
		if !ok {
			bloques = append(bloques, BloqueHorario{Hora: horaStr, Estado: "disponible"})
		} else {
			bloques = append(bloques, BloqueHorario{Hora: horaStr, Estado: clasificarEstadoHora(est)})
		}
	}
	return bloques, nil
}

var _ = enums.EstadoPublicacionPublicada
var _ = time.Time{}

type CrearPropiedadInput struct {
	Titulo              string
	Descripcion         string
	TipoPropiedad       string
	PrecioPorNoche      float64
	Moneda              string
	CapacidadMaxima     int
	Habitaciones        int
	Banos               int
	Camas               int
	Direccion           string
	Ciudad              string
	Estado              string
	Zona                *string
	Latitud             *float64
	Longitud            *float64
	Reglas              *string
	PoliticaCancelacion string
	HorarioCheckIn      string
	HorarioCheckOut     string
	EstanciaMinima      int
	EstanciaMaxima      *int
	Categoria           string
	TipoCancha          *string
	PrecioPorHora       *float64
	HoraApertura        *string
	HoraCierre          *string
	DuracionMinimaMin   *int
	EsExpress           bool
	PrecioExpress       *float64
}

type CrearPropiedadResult struct {
	ID     string `json:"id"`
	Slug   string `json:"slug"`
	Estado string `json:"estado_publicacion"`
}

func (r *PropiedadesRepo) CrearPropiedad(ctx context.Context, propietarioID string, input CrearPropiedadInput, amenidadIDs []string) (*CrearPropiedadResult, error) {
	id := generatePropiedadID()
	slug := GenerateSlug(input.Titulo)

	_, err := r.pool.Exec(ctx, `
		INSERT INTO propiedades (
			id, propietario_id, titulo, slug, descripcion, tipo_propiedad,
			precio_por_noche, moneda, capacidad_maxima, habitaciones, banos, camas,
			direccion, ciudad, estado, zona, latitud, longitud,
			reglas, politica_cancelacion, horario_checkin, horario_checkout,
			estancia_minima, estancia_maxima,
			estado_publicacion, categoria, tipo_cancha, precio_por_hora,
			hora_apertura, hora_cierre, duracion_minima_min,
			es_express, precio_express, fecha_actualizacion
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17, $18,
			$19, $20, $21, $22,
			$23, $24,
			'PENDIENTE_REVISION', $25, $26, $27,
			$28, $29, $30,
			$31, $32, NOW()
		)`,
		id, propietarioID, input.Titulo, slug, input.Descripcion, input.TipoPropiedad,
		input.PrecioPorNoche, input.Moneda, input.CapacidadMaxima, input.Habitaciones, input.Banos, input.Camas,
		input.Direccion, input.Ciudad, input.Estado, input.Zona, input.Latitud, input.Longitud,
		input.Reglas, input.PoliticaCancelacion, input.HorarioCheckIn, input.HorarioCheckOut,
		input.EstanciaMinima, input.EstanciaMaxima,
		input.Categoria, input.TipoCancha, input.PrecioPorHora,
		input.HoraApertura, input.HoraCierre, input.DuracionMinimaMin,
		input.EsExpress, input.PrecioExpress,
	)
	if err != nil {
		return nil, fmt.Errorf("insert propiedad: %w", err)
	}

	if len(amenidadIDs) > 0 {
		_, err = r.pool.Exec(ctx, `
			INSERT INTO propiedad_amenidades (propiedad_id, amenidad_id)
			SELECT $1, unnest($2::text[])
		`, id, amenidadIDs)
		if err != nil {
			return nil, fmt.Errorf("insert amenidades: %w", err)
		}
	}

	return &CrearPropiedadResult{ID: id, Slug: slug, Estado: "PENDIENTE_REVISION"}, nil
}

func (r *PropiedadesRepo) ActualizarPropiedad(ctx context.Context, propiedadID, propietarioID string, input CrearPropiedadInput, amenidadIDs []string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE propiedades SET
			titulo = $1, descripcion = $2, tipo_propiedad = $3,
			precio_por_noche = $4, moneda = $5, capacidad_maxima = $6,
			habitaciones = $7, banos = $8, camas = $9,
			direccion = $10, ciudad = $11, estado = $12, zona = $13,
			latitud = $14, longitud = $15,
			reglas = $16, politica_cancelacion = $17,
			horario_checkin = $18, horario_checkout = $19,
			estancia_minima = $20, estancia_maxima = $21,
			categoria = $22, tipo_cancha = $23, precio_por_hora = $24,
			hora_apertura = $25, hora_cierre = $26, duracion_minima_min = $27,
			es_express = $28, precio_express = $29,
			estado_publicacion = 'PENDIENTE_REVISION',
			fecha_actualizacion = NOW()
		WHERE id = $30 AND propietario_id = $31`,
		input.Titulo, input.Descripcion, input.TipoPropiedad,
		input.PrecioPorNoche, input.Moneda, input.CapacidadMaxima,
		input.Habitaciones, input.Banos, input.Camas,
		input.Direccion, input.Ciudad, input.Estado, input.Zona,
		input.Latitud, input.Longitud,
		input.Reglas, input.PoliticaCancelacion,
		input.HorarioCheckIn, input.HorarioCheckOut,
		input.EstanciaMinima, input.EstanciaMaxima,
		input.Categoria, input.TipoCancha, input.PrecioPorHora,
		input.HoraApertura, input.HoraCierre, input.DuracionMinimaMin,
		input.EsExpress, input.PrecioExpress,
		propiedadID, propietarioID,
	)
	if err != nil {
		return fmt.Errorf("update propiedad: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.PropiedadSinPermiso()
	}

	_, err = r.pool.Exec(ctx, `DELETE FROM propiedad_amenidades WHERE propiedad_id = $1`, propiedadID)
	if err != nil {
		return fmt.Errorf("delete amenidades: %w", err)
	}

	if len(amenidadIDs) > 0 {
		_, err = r.pool.Exec(ctx, `
			INSERT INTO propiedad_amenidades (propiedad_id, amenidad_id)
			SELECT $1, unnest($2::text[])
		`, propiedadID, amenidadIDs)
		if err != nil {
			return fmt.Errorf("insert amenidades: %w", err)
		}
	}

	return nil
}

func (r *PropiedadesRepo) FindAmenidadesByNombres(ctx context.Context, nombres []string) ([]string, error) {
	if len(nombres) == 0 {
		return nil, nil
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id FROM amenidades WHERE nombre = ANY($1)
	`, nombres)
	if err != nil {
		return nil, fmt.Errorf("find amenidades: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

type ImagenInput struct {
	URL       string `json:"url"`
	Categoria string `json:"categoria"`
	Orden     int    `json:"orden"`
}

func (r *PropiedadesRepo) AgregarImagenes(ctx context.Context, propiedadID string, imagenes []ImagenInput) error {
	if len(imagenes) == 0 {
		return nil
	}
	ids := make([]string, len(imagenes))
	urls := make([]string, len(imagenes))
	cats := make([]string, len(imagenes))
	ords := make([]int, len(imagenes))
	for i, img := range imagenes {
		ids[i] = generatePropiedadID()
		urls[i] = img.URL
		cats[i] = img.Categoria
		ords[i] = img.Orden
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO imagenes_propiedad (id, propiedad_id, url, categoria, orden, es_principal)
		SELECT unnest($1::text[]), $2, unnest($3::text[]), unnest($4::text[]), unnest($5::int[]), false
	`, ids, propiedadID, urls, cats, ords)
	if err != nil {
		return fmt.Errorf("insert imagenes: %w", err)
	}
	return nil
}

func (r *PropiedadesRepo) AgregarImagenesWithDB(ctx context.Context, db DBTX, propiedadID string, imagenes []ImagenInput) error {
	if len(imagenes) == 0 {
		return nil
	}
	ids := make([]string, len(imagenes))
	urls := make([]string, len(imagenes))
	cats := make([]string, len(imagenes))
	ords := make([]int, len(imagenes))
	for i, img := range imagenes {
		ids[i] = generatePropiedadID()
		urls[i] = img.URL
		cats[i] = img.Categoria
		ords[i] = img.Orden
	}
	_, err := db.Exec(ctx, `
		INSERT INTO imagenes_propiedad (id, propiedad_id, url, categoria, orden, es_principal)
		SELECT unnest($1::text[]), $2, unnest($3::text[]), unnest($4::text[]), unnest($5::int[]), false
	`, ids, propiedadID, urls, cats, ords)
	if err != nil {
		return fmt.Errorf("insert imagenes: %w", err)
	}
	return nil
}

type ImagenUpdate struct {
	ID        string  `json:"id"`
	Categoria *string `json:"categoria,omitempty"`
	Orden     *int    `json:"orden,omitempty"`
	Eliminar  bool    `json:"eliminar,omitempty"`
}

func (r *PropiedadesRepo) ActualizarImagenes(ctx context.Context, propiedadID string, updates []ImagenUpdate) error {
	for _, u := range updates {
		if u.Eliminar {
			_, err := r.pool.Exec(ctx, `DELETE FROM imagenes_propiedad WHERE id = $1 AND propiedad_id = $2`, u.ID, propiedadID)
			if err != nil {
				return fmt.Errorf("delete imagen: %w", err)
			}
			continue
		}
		if u.Categoria != nil {
			_, err := r.pool.Exec(ctx, `UPDATE imagenes_propiedad SET categoria = $1 WHERE id = $2 AND propiedad_id = $3`, *u.Categoria, u.ID, propiedadID)
			if err != nil {
				return fmt.Errorf("update imagen categoria: %w", err)
			}
		}
		if u.Orden != nil {
			_, err := r.pool.Exec(ctx, `UPDATE imagenes_propiedad SET orden = $1 WHERE id = $2 AND propiedad_id = $3`, *u.Orden, u.ID, propiedadID)
			if err != nil {
				return fmt.Errorf("update imagen orden: %w", err)
			}
		}
	}
	return nil
}

func (r *PropiedadesRepo) GetUserPlan(ctx context.Context, userID string) (string, error) {
	var plan string
	err := r.pool.QueryRow(ctx, `SELECT plan_suscripcion FROM usuarios WHERE id = $1`, userID).Scan(&plan)
	return plan, err
}

func (r *PropiedadesRepo) GetPropiedadOwner(ctx context.Context, propiedadID string) (string, error) {
	var ownerID string
	err := r.pool.QueryRow(ctx, `SELECT propietario_id FROM propiedades WHERE id = $1`, propiedadID).Scan(&ownerID)
	return ownerID, err
}

func generatePropiedadID() string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (r *PropiedadesRepo) CrearPropiedadWithDB(ctx context.Context, db DBTX, propietarioID string, input CrearPropiedadInput, amenidadIDs []string) (*CrearPropiedadResult, error) {
	id := generatePropiedadID()
	slug := GenerateSlug(input.Titulo)

	_, err := db.Exec(ctx, `
		INSERT INTO propiedades (
			id, propietario_id, titulo, slug, descripcion, tipo_propiedad,
			precio_por_noche, moneda, capacidad_maxima, habitaciones, banos, camas,
			direccion, ciudad, estado, zona, latitud, longitud,
			reglas, politica_cancelacion, horario_checkin, horario_checkout,
			estancia_minima, estancia_maxima,
			estado_publicacion, categoria, tipo_cancha, precio_por_hora,
			hora_apertura, hora_cierre, duracion_minima_min,
			es_express, precio_express, fecha_actualizacion
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17, $18,
			$19, $20, $21, $22,
			$23, $24,
			'PENDIENTE_REVISION', $25, $26, $27,
			$28, $29, $30,
			$31, $32, NOW()
		)`,
		id, propietarioID, input.Titulo, slug, input.Descripcion, input.TipoPropiedad,
		input.PrecioPorNoche, input.Moneda, input.CapacidadMaxima, input.Habitaciones, input.Banos, input.Camas,
		input.Direccion, input.Ciudad, input.Estado, input.Zona, input.Latitud, input.Longitud,
		input.Reglas, input.PoliticaCancelacion, input.HorarioCheckIn, input.HorarioCheckOut,
		input.EstanciaMinima, input.EstanciaMaxima,
		input.Categoria, input.TipoCancha, input.PrecioPorHora,
		input.HoraApertura, input.HoraCierre, input.DuracionMinimaMin,
		input.EsExpress, input.PrecioExpress,
	)
	if err != nil {
		return nil, fmt.Errorf("insert propiedad: %w", err)
	}

	if len(amenidadIDs) > 0 {
		_, err = db.Exec(ctx, `
			INSERT INTO propiedad_amenidades (propiedad_id, amenidad_id)
			SELECT $1, unnest($2::text[])
		`, id, amenidadIDs)
		if err != nil {
			return nil, fmt.Errorf("insert amenidades: %w", err)
		}
	}

	return &CrearPropiedadResult{ID: id, Slug: slug, Estado: "PENDIENTE_REVISION"}, nil
}

func (r *PropiedadesRepo) ActualizarPropiedadWithDB(ctx context.Context, db DBTX, propiedadID, propietarioID string, input CrearPropiedadInput, amenidadIDs []string) error {
	tag, err := db.Exec(ctx, `
		UPDATE propiedades SET
			titulo = $1, descripcion = $2, tipo_propiedad = $3,
			precio_por_noche = $4, moneda = $5, capacidad_maxima = $6,
			habitaciones = $7, banos = $8, camas = $9,
			direccion = $10, ciudad = $11, estado = $12, zona = $13,
			latitud = $14, longitud = $15,
			reglas = $16, politica_cancelacion = $17,
			horario_checkin = $18, horario_checkout = $19,
			estancia_minima = $20, estancia_maxima = $21,
			categoria = $22, tipo_cancha = $23, precio_por_hora = $24,
			hora_apertura = $25, hora_cierre = $26, duracion_minima_min = $27,
			es_express = $28, precio_express = $29,
			estado_publicacion = 'PENDIENTE_REVISION',
			fecha_actualizacion = NOW()
		WHERE id = $30 AND propietario_id = $31`,
		input.Titulo, input.Descripcion, input.TipoPropiedad,
		input.PrecioPorNoche, input.Moneda, input.CapacidadMaxima,
		input.Habitaciones, input.Banos, input.Camas,
		input.Direccion, input.Ciudad, input.Estado, input.Zona,
		input.Latitud, input.Longitud,
		input.Reglas, input.PoliticaCancelacion,
		input.HorarioCheckIn, input.HorarioCheckOut,
		input.EstanciaMinima, input.EstanciaMaxima,
		input.Categoria, input.TipoCancha, input.PrecioPorHora,
		input.HoraApertura, input.HoraCierre, input.DuracionMinimaMin,
		input.EsExpress, input.PrecioExpress,
		propiedadID, propietarioID,
	)
	if err != nil {
		return fmt.Errorf("update propiedad: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.PropiedadSinPermiso()
	}

	_, err = db.Exec(ctx, `DELETE FROM propiedad_amenidades WHERE propiedad_id = $1`, propiedadID)
	if err != nil {
		return fmt.Errorf("delete amenidades: %w", err)
	}

	if len(amenidadIDs) > 0 {
		_, err = db.Exec(ctx, `
			INSERT INTO propiedad_amenidades (propiedad_id, amenidad_id)
			SELECT $1, unnest($2::text[])
		`, propiedadID, amenidadIDs)
		if err != nil {
			return fmt.Errorf("insert amenidades: %w", err)
		}
	}

	return nil
}
