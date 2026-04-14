package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DisponibilidadResult struct {
	Disponible bool
	Conflicto  *Conflicto
}

type Conflicto struct {
	Tipo             string
	ReservaID        string
	FechaBloqueadaID string
}

type ReservaDisponibilidad struct {
	pool *pgxpool.Pool
}

func NewReservaDisponibilidad(pool *pgxpool.Pool) *ReservaDisponibilidad {
	return &ReservaDisponibilidad{pool: pool}
}

func (r *ReservaDisponibilidad) Verificar(ctx context.Context, propiedadID string, fechaEntrada, fechaSalida time.Time) (*DisponibilidadResult, error) {
	var reservaID string
	err := r.pool.QueryRow(ctx, `
		SELECT id FROM reservas
		WHERE propiedad_id = $1
		  AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_CURSO')
		  AND fecha_entrada < $3
		  AND fecha_salida > $2
		LIMIT 1
	`, propiedadID, fechaEntrada, fechaSalida).Scan(&reservaID)

	if err == nil {
		return &DisponibilidadResult{
			Disponible: false,
			Conflicto: &Conflicto{
				Tipo:      "RESERVA_EXISTENTE",
				ReservaID: reservaID,
			},
		}, nil
	}
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("checking reserva conflicts: %w", err)
	}

	var bloqueadaID string
	err = r.pool.QueryRow(ctx, `
		SELECT id FROM fechas_bloqueadas
		WHERE propiedad_id = $1
		  AND fecha_inicio < $3
		  AND fecha_fin > $2
		LIMIT 1
	`, propiedadID, fechaEntrada, fechaSalida).Scan(&bloqueadaID)

	if err == nil {
		return &DisponibilidadResult{
			Disponible: false,
			Conflicto: &Conflicto{
				Tipo:             "FECHA_BLOQUEADA",
				FechaBloqueadaID: bloqueadaID,
			},
		}, nil
	}
	if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("checking blocked dates: %w", err)
	}

	return &DisponibilidadResult{Disponible: true}, nil
}

func (r *ReservaDisponibilidad) ObtenerPropiedad(ctx context.Context, propiedadID string) (id, titulo string, precio float64, moneda, propietarioID string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT id, titulo, precio_por_noche, moneda, propietario_id
		FROM propiedades WHERE id = $1
	`, propiedadID).Scan(&id, &titulo, &precio, &moneda, &propietarioID)
	return
}

type FechaOcupada struct {
	Inicio time.Time `json:"inicio"`
	Fin    time.Time `json:"fin"`
	Estado string    `json:"estado"`
}

func (r *ReservaDisponibilidad) ObtenerFechasOcupadas(ctx context.Context, propiedadID string) ([]FechaOcupada, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT fecha_entrada, fecha_salida, estado FROM reservas
		WHERE propiedad_id = $1
		  AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_CURSO')
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("query fechas ocupadas reservas: %w", err)
	}
	defer rows.Close()

	var results []FechaOcupada
	for rows.Next() {
		var f FechaOcupada
		if err := rows.Scan(&f.Inicio, &f.Fin, &f.Estado); err != nil {
			return nil, err
		}
		results = append(results, f)
	}

	blockedRows, err := r.pool.Query(ctx, `
		SELECT fecha_inicio, fecha_fin FROM fechas_bloqueadas
		WHERE propiedad_id = $1
	`, propiedadID)
	if err != nil {
		return nil, fmt.Errorf("query fechas bloqueadas: %w", err)
	}
	defer blockedRows.Close()

	for blockedRows.Next() {
		var f FechaOcupada
		if err := blockedRows.Scan(&f.Inicio, &f.Fin); err != nil {
			return nil, err
		}
		f.Estado = "BLOQUEADA"
		results = append(results, f)
	}

	if results == nil {
		results = []FechaOcupada{}
	}
	return results, nil
}

func (r *ReservaDisponibilidad) HaySolapamiento(ctx context.Context, propiedadID string, fechaEntrada, fechaSalida time.Time) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM reservas
			WHERE propiedad_id = $1
			  AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_CURSO')
			  AND fecha_entrada < $3
			  AND fecha_salida > $2
		)
	`, propiedadID, fechaEntrada, fechaSalida).Scan(&exists)
	if err != nil {
		return false, err
	}
	if exists {
		return true, nil
	}

	err = r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM fechas_bloqueadas
			WHERE propiedad_id = $1
			  AND fecha_inicio < $3
			  AND fecha_fin > $2
		)
	`, propiedadID, fechaEntrada, fechaSalida).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
