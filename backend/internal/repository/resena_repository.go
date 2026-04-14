package repository

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ResenaRepo struct {
	pool *pgxpool.Pool
}

func NewResenaRepo(pool *pgxpool.Pool) *ResenaRepo {
	return &ResenaRepo{pool: pool}
}

type ResenaConAutor struct {
	ID             string     `json:"id"`
	ReservaID      string     `json:"reserva_id"`
	PropiedadID    string     `json:"propiedad_id"`
	AutorID        string     `json:"autor_id"`
	AutorNombre    string     `json:"autor_nombre"`
	AutorApellido  string     `json:"autor_apellido"`
	AutorAvatarURL *string    `json:"autor_avatar_url"`
	Calificacion   int        `json:"calificacion"`
	Limpieza       *int       `json:"limpieza"`
	Comunicacion   *int       `json:"comunicacion"`
	Ubicacion      *int       `json:"ubicacion"`
	Valor          *int       `json:"valor"`
	Comentario     string     `json:"comentario"`
	Respuesta      *string    `json:"respuesta"`
	FechaRespuesta *time.Time `json:"fecha_respuesta"`
	Oculta         bool       `json:"oculta"`
	FechaCreacion  time.Time  `json:"fecha_creacion"`
}

func (r *ResenaRepo) GetByPropiedad(ctx context.Context, propiedadID string, page, perPage int) ([]ResenaConAutor, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM resenas WHERE propiedad_id = $1 AND oculta = false
	`, propiedadID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count resenas: %w", err)
	}

	offset := (page - 1) * perPage
	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.reserva_id, r.propiedad_id, r.autor_id,
		       u.nombre, u.apellido, u.avatar_url,
		       r.calificacion, r.limpieza, r.comunicacion, r.ubicacion, r.valor,
		       r.comentario, r.respuesta, r.fecha_respuesta, r.oculta, r.fecha_creacion
		FROM resenas r
		JOIN usuarios u ON u.id = r.autor_id
		WHERE r.propiedad_id = $1 AND r.oculta = false
		ORDER BY r.fecha_creacion DESC
		LIMIT $2 OFFSET $3
	`, propiedadID, perPage, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("get resenas: %w", err)
	}
	defer rows.Close()

	var results []ResenaConAutor
	for rows.Next() {
		var res ResenaConAutor
		if err := rows.Scan(
			&res.ID, &res.ReservaID, &res.PropiedadID, &res.AutorID,
			&res.AutorNombre, &res.AutorApellido, &res.AutorAvatarURL,
			&res.Calificacion, &res.Limpieza, &res.Comunicacion, &res.Ubicacion, &res.Valor,
			&res.Comentario, &res.Respuesta, &res.FechaRespuesta, &res.Oculta, &res.FechaCreacion,
		); err != nil {
			return nil, 0, fmt.Errorf("scan resena: %w", err)
		}
		results = append(results, res)
	}
	return results, total, nil
}

type ReservaForResena struct {
	ID          string
	PropiedadID string
}

func (r *ResenaRepo) GetReservaForResena(ctx context.Context, reservaID, userID string) (*ReservaForResena, error) {
	var res ReservaForResena
	err := r.pool.QueryRow(ctx, `
		SELECT id, propiedad_id FROM reservas
		WHERE id = $1 AND huesped_id = $2 AND estado = 'COMPLETADA'
	`, reservaID, userID).Scan(&res.ID, &res.PropiedadID)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *ResenaRepo) ExistsByReserva(ctx context.Context, reservaID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM resenas WHERE reserva_id = $1)
	`, reservaID).Scan(&exists)
	return exists, err
}

func (r *ResenaRepo) Insert(ctx context.Context, reservaID, propiedadID, autorID, anfitrionID string, calificacion int, limpieza, comunicacion, ubicacion, valor *int, comentario string) (string, error) {
	id := fmt.Sprintf("%016x", rand.Int63())
	_, err := r.pool.Exec(ctx, `
		INSERT INTO resenas (id, reserva_id, propiedad_id, autor_id, anfitrion_id,
			calificacion, limpieza, comunicacion, ubicacion, valor, comentario, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
	`, id, reservaID, propiedadID, autorID, anfitrionID, calificacion, limpieza, comunicacion, ubicacion, valor, comentario)
	if err != nil {
		return "", fmt.Errorf("insert resena: %w", err)
	}
	return id, nil
}

func (r *ResenaRepo) UpdatePropiedadRating(ctx context.Context, propiedadID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE propiedades SET
			calificacion = (SELECT ROUND(AVG(calificacion)::numeric, 1) FROM resenas WHERE propiedad_id = $1 AND oculta = false),
			cantidad_resenas = (SELECT COUNT(*) FROM resenas WHERE propiedad_id = $1 AND oculta = false),
			fecha_actualizacion = NOW()
		WHERE id = $1
	`, propiedadID)
	return err
}

func (r *ResenaRepo) GetByID(ctx context.Context, resenaID string) (*ResenaConAutor, error) {
	var res ResenaConAutor
	err := r.pool.QueryRow(ctx, `
		SELECT r.id, r.reserva_id, r.propiedad_id, r.autor_id,
		       u.nombre, u.apellido, u.avatar_url,
		       r.calificacion, r.limpieza, r.comunicacion, r.ubicacion, r.valor,
		       r.comentario, r.respuesta, r.fecha_respuesta, r.oculta, r.fecha_creacion
		FROM resenas r
		JOIN usuarios u ON u.id = r.autor_id
		WHERE r.id = $1
	`, resenaID).Scan(
		&res.ID, &res.ReservaID, &res.PropiedadID, &res.AutorID,
		&res.AutorNombre, &res.AutorApellido, &res.AutorAvatarURL,
		&res.Calificacion, &res.Limpieza, &res.Comunicacion, &res.Ubicacion, &res.Valor,
		&res.Comentario, &res.Respuesta, &res.FechaRespuesta, &res.Oculta, &res.FechaCreacion,
	)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *ResenaRepo) SetRespuesta(ctx context.Context, resenaID, respuesta string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE resenas SET respuesta = $2, fecha_respuesta = NOW() WHERE id = $1
	`, resenaID, respuesta)
	return err
}

func (r *ResenaRepo) GetAnfitrionIDForResena(ctx context.Context, resenaID string) (string, error) {
	var anfitrionID string
	err := r.pool.QueryRow(ctx, `
		SELECT anfitrion_id FROM resenas WHERE id = $1
	`, resenaID).Scan(&anfitrionID)
	return anfitrionID, err
}

func (r *ResenaRepo) GetPropietarioID(ctx context.Context, propiedadID string) (string, error) {
	var propietarioID string
	err := r.pool.QueryRow(ctx, `SELECT propietario_id FROM propiedades WHERE id = $1`, propiedadID).Scan(&propietarioID)
	return propietarioID, err
}
