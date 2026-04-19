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

type DashboardRepo struct {
	pool *pgxpool.Pool
}

func NewDashboardRepo(pool *pgxpool.Pool) *DashboardRepo {
	return &DashboardRepo{pool: pool}
}

type GastoMantenimiento struct {
	ID          string    `json:"id"`
	PropiedadID string    `json:"propiedad_id"`
	Descripcion string    `json:"descripcion"`
	Monto       float64   `json:"monto"`
	Moneda      string    `json:"moneda"`
	Categoria   string    `json:"categoria"`
	Fecha       time.Time `json:"fecha"`
}

type FechaBloqueada struct {
	ID          string  `json:"id"`
	PropiedadID string  `json:"propiedad_id"`
	FechaInicio string  `json:"fecha_inicio"`
	FechaFin    string  `json:"fecha_fin"`
	Motivo      *string `json:"motivo"`
}

type PrecioEspecial struct {
	ID             string  `json:"id"`
	PropiedadID    string  `json:"propiedad_id"`
	Nombre         string  `json:"nombre"`
	FechaInicio    string  `json:"fecha_inicio"`
	FechaFin       string  `json:"fecha_fin"`
	PrecioPorNoche float64 `json:"precio_por_noche"`
}

type ReservaDashboard struct {
	ID              string                   `json:"id"`
	Estado          string                   `json:"estado"`
	FechaEntrada    string                   `json:"fecha_entrada"`
	FechaSalida     string                   `json:"fecha_salida"`
	Noches          int                      `json:"noches"`
	MontoTotal      float64                  `json:"total"`
	Moneda          string                   `json:"moneda"`
	CantidadHuesped int                      `json:"cantidad_huespedes"`
	Huesped         *ReservaDashboardHuesped `json:"huesped"`
}

type ReservaDashboardHuesped struct {
	Nombre    string  `json:"nombre"`
	Apellido  string  `json:"apellido"`
	Email     string  `json:"email"`
	AvatarURL *string `json:"avatar_url"`
}

func (r *DashboardRepo) GetGastos(ctx context.Context, propiedadID string) ([]GastoMantenimiento, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, propiedad_id, descripcion, monto, moneda, categoria, fecha
		FROM gastos_mantenimiento
		WHERE propiedad_id = $1
		ORDER BY fecha DESC
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("get gastos: %w", err)
	}
	defer rows.Close()

	var results []GastoMantenimiento
	for rows.Next() {
		var g GastoMantenimiento
		if err := rows.Scan(&g.ID, &g.PropiedadID, &g.Descripcion, &g.Monto, &g.Moneda, &g.Categoria, &g.Fecha); err != nil {
			return nil, fmt.Errorf("scan gasto: %w", err)
		}
		results = append(results, g)
	}
	if results == nil {
		results = []GastoMantenimiento{}
	}
	return results, nil
}

func (r *DashboardRepo) GetFechasBloqueadas(ctx context.Context, propiedadID string) ([]FechaBloqueada, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, propiedad_id, fecha_inicio, fecha_fin, motivo
		FROM fechas_bloqueadas
		WHERE propiedad_id = $1
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("get fechas_bloqueadas: %w", err)
	}
	defer rows.Close()

	var results []FechaBloqueada
	for rows.Next() {
		var f FechaBloqueada
		if err := rows.Scan(&f.ID, &f.PropiedadID, &f.FechaInicio, &f.FechaFin, &f.Motivo); err != nil {
			return nil, fmt.Errorf("scan fecha_bloqueada: %w", err)
		}
		results = append(results, f)
	}
	if results == nil {
		results = []FechaBloqueada{}
	}
	return results, nil
}

func (r *DashboardRepo) GetPreciosEspeciales(ctx context.Context, propiedadID string) ([]PrecioEspecial, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, propiedad_id, nombre, fecha_inicio, fecha_fin, precio_por_noche
		FROM precios_especiales
		WHERE propiedad_id = $1
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("get precios_especiales: %w", err)
	}
	defer rows.Close()

	var results []PrecioEspecial
	for rows.Next() {
		var p PrecioEspecial
		if err := rows.Scan(&p.ID, &p.PropiedadID, &p.Nombre, &p.FechaInicio, &p.FechaFin, &p.PrecioPorNoche); err != nil {
			return nil, fmt.Errorf("scan precio_especial: %w", err)
		}
		results = append(results, p)
	}
	if results == nil {
		results = []PrecioEspecial{}
	}
	return results, nil
}

func (r *DashboardRepo) GetReservasDashboard(ctx context.Context, propiedadID string) ([]ReservaDashboard, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.estado, r.fecha_entrada, r.fecha_salida, r.noches, r.total, r.moneda, r.cantidad_huespedes,
		       u.nombre, u.apellido, u.email, u.avatar_url
		FROM reservas r
		LEFT JOIN usuarios u ON u.id = r.huesped_id
		WHERE r.propiedad_id = $1
		ORDER BY r.fecha_entrada DESC
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("get reservas dashboard: %w", err)
	}
	defer rows.Close()

	var results []ReservaDashboard
	for rows.Next() {
		var res ReservaDashboard
		var h ReservaDashboardHuesped
		var hNombre, hApellido, hEmail *string
		var hAvatar *string
		if err := rows.Scan(&res.ID, &res.Estado, &res.FechaEntrada, &res.FechaSalida,
			&res.Noches, &res.MontoTotal, &res.Moneda, &res.CantidadHuesped,
			&hNombre, &hApellido, &hEmail, &hAvatar); err != nil {
			return nil, fmt.Errorf("scan reserva dashboard: %w", err)
		}
		if hNombre != nil {
			h.Nombre = *hNombre
			h.Apellido = stringPtrOrEmpty(hApellido)
			h.Email = stringPtrOrEmpty(hEmail)
			h.AvatarURL = hAvatar
			res.Huesped = &h
		}
		results = append(results, res)
	}
	if results == nil {
		results = []ReservaDashboard{}
	}
	return results, nil
}

func stringPtrOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func (r *DashboardRepo) GetAmenidades(ctx context.Context, propiedadID string) ([]string, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.nombre
		FROM propiedad_amenidades pa
		JOIN amenidades a ON a.id = pa.amenidad_id
		WHERE pa.propiedad_id = $1
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("get amenidades: %w", err)
	}
	defer rows.Close()

	var results []string
	for rows.Next() {
		var nombre string
		if err := rows.Scan(&nombre); err != nil {
			return nil, fmt.Errorf("scan amenidad: %w", err)
		}
		results = append(results, nombre)
	}
	if results == nil {
		results = []string{}
	}
	return results, nil
}

func (r *DashboardRepo) InsertGasto(ctx context.Context, propiedadID, descripcion string, monto float64, moneda, categoria, fecha string) (*GastoMantenimiento, error) {
	id := idgen.New()
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")
	}
	var g GastoMantenimiento
	err := r.pool.QueryRow(ctx, `
		INSERT INTO gastos_mantenimiento (id, propiedad_id, descripcion, monto, moneda, categoria, fecha)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, propiedad_id, descripcion, monto, moneda, categoria, fecha
	`, id, propiedadID, descripcion, monto, moneda, categoria, fecha).Scan(
		&g.ID, &g.PropiedadID, &g.Descripcion, &g.Monto, &g.Moneda, &g.Categoria, &g.Fecha,
	)
	if err != nil {
		return nil, fmt.Errorf("insert gasto: %w", err)
	}
	return &g, nil
}

func (r *DashboardRepo) DeleteGasto(ctx context.Context, gastoID, propiedadID string) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM gastos_mantenimiento WHERE id = $1 AND propiedad_id = $2
	`, gastoID, propiedadID)
	if err != nil {
		return fmt.Errorf("delete gasto: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.GastoNoEncontrado()
	}
	return nil
}

type DashboardBatchResult struct {
	Gastos            []GastoMantenimiento
	FechasBloqueadas  []FechaBloqueada
	PreciosEspeciales []PrecioEspecial
	Reservas          []ReservaDashboard
	Amenidades        []string
}

func (r *DashboardRepo) GetDashboardBatched(ctx context.Context, propiedadID string) (*DashboardBatchResult, error) {
	var batch pgx.Batch
	batch.Queue(`
		SELECT id, propiedad_id, descripcion, monto, moneda, categoria, fecha
		FROM gastos_mantenimiento WHERE propiedad_id = $1 ORDER BY fecha DESC`, propiedadID)
	batch.Queue(`
		SELECT id, propiedad_id, fecha_inicio, fecha_fin, motivo
		FROM fechas_bloqueadas WHERE propiedad_id = $1`, propiedadID)
	batch.Queue(`
		SELECT id, propiedad_id, nombre, fecha_inicio, fecha_fin, precio_por_noche
		FROM precios_especiales WHERE propiedad_id = $1`, propiedadID)
	batch.Queue(`
		SELECT r.id, r.estado, r.fecha_entrada, r.fecha_salida, r.noches, r.total, r.moneda, r.cantidad_huespedes,
		       u.nombre, u.apellido, u.email, u.avatar_url
		FROM reservas r LEFT JOIN usuarios u ON u.id = r.huesped_id
		WHERE r.propiedad_id = $1 ORDER BY r.fecha_entrada DESC`, propiedadID)
	batch.Queue(`
		SELECT a.nombre FROM propiedad_amenidades pa
		JOIN amenidades a ON a.id = pa.amenidad_id
		WHERE pa.propiedad_id = $1`, propiedadID)

	br := r.pool.SendBatch(ctx, &batch)
	defer func() { _ = br.Close() }()

	gastos, err := r.scanGastos(br)
	if err != nil {
		return nil, fmt.Errorf("get gastos: %w", err)
	}
	fechas, err := r.scanFechasBloqueadas(br)
	if err != nil {
		return nil, fmt.Errorf("get fechas bloqueadas: %w", err)
	}
	precios, err := r.scanPreciosEspeciales(br)
	if err != nil {
		return nil, fmt.Errorf("get precios especiales: %w", err)
	}
	reservas, err := r.scanReservasDashboard(br)
	if err != nil {
		return nil, fmt.Errorf("get reservas: %w", err)
	}
	amenidades, err := r.scanAmenidades(br)
	if err != nil {
		return nil, fmt.Errorf("get amenidades: %w", err)
	}

	return &DashboardBatchResult{
		Gastos:            gastos,
		FechasBloqueadas:  fechas,
		PreciosEspeciales: precios,
		Reservas:          reservas,
		Amenidades:        amenidades,
	}, nil
}

func (r *DashboardRepo) scanGastos(br pgx.BatchResults) ([]GastoMantenimiento, error) {
	rows, err := br.Query()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []GastoMantenimiento
	for rows.Next() {
		var g GastoMantenimiento
		if err := rows.Scan(&g.ID, &g.PropiedadID, &g.Descripcion, &g.Monto, &g.Moneda, &g.Categoria, &g.Fecha); err != nil {
			return nil, err
		}
		results = append(results, g)
	}
	if results == nil {
		results = []GastoMantenimiento{}
	}
	return results, nil
}

func (r *DashboardRepo) scanFechasBloqueadas(br pgx.BatchResults) ([]FechaBloqueada, error) {
	rows, err := br.Query()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []FechaBloqueada
	for rows.Next() {
		var f FechaBloqueada
		if err := rows.Scan(&f.ID, &f.PropiedadID, &f.FechaInicio, &f.FechaFin, &f.Motivo); err != nil {
			return nil, err
		}
		results = append(results, f)
	}
	if results == nil {
		results = []FechaBloqueada{}
	}
	return results, nil
}

func (r *DashboardRepo) scanPreciosEspeciales(br pgx.BatchResults) ([]PrecioEspecial, error) {
	rows, err := br.Query()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []PrecioEspecial
	for rows.Next() {
		var p PrecioEspecial
		if err := rows.Scan(&p.ID, &p.PropiedadID, &p.Nombre, &p.FechaInicio, &p.FechaFin, &p.PrecioPorNoche); err != nil {
			return nil, err
		}
		results = append(results, p)
	}
	if results == nil {
		results = []PrecioEspecial{}
	}
	return results, nil
}

func (r *DashboardRepo) scanReservasDashboard(br pgx.BatchResults) ([]ReservaDashboard, error) {
	rows, err := br.Query()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []ReservaDashboard
	for rows.Next() {
		var res ReservaDashboard
		var h ReservaDashboardHuesped
		var hNombre, hApellido, hEmail, hAvatar *string
		if err := rows.Scan(&res.ID, &res.Estado, &res.FechaEntrada, &res.FechaSalida,
			&res.Noches, &res.MontoTotal, &res.Moneda, &res.CantidadHuesped,
			&hNombre, &hApellido, &hEmail, &hAvatar); err != nil {
			return nil, err
		}
		if hNombre != nil {
			h.Nombre = *hNombre
			h.Apellido = stringPtrOrEmpty(hApellido)
			h.Email = stringPtrOrEmpty(hEmail)
			h.AvatarURL = hAvatar
			res.Huesped = &h
		}
		results = append(results, res)
	}
	if results == nil {
		results = []ReservaDashboard{}
	}
	return results, nil
}

func (r *DashboardRepo) scanAmenidades(br pgx.BatchResults) ([]string, error) {
	rows, err := br.Query()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []string
	for rows.Next() {
		var nombre string
		if err := rows.Scan(&nombre); err != nil {
			return nil, err
		}
		results = append(results, nombre)
	}
	if results == nil {
		results = []string{}
	}
	return results, nil
}

func (r *DashboardRepo) IsPropietario(ctx context.Context, propiedadID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM propiedades WHERE id = $1 AND propietario_id = $2)
	`, propiedadID, userID).Scan(&exists)
	return exists, err
}
