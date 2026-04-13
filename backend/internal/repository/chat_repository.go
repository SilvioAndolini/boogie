package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ChatRepo struct {
	pool *pgxpool.Pool
}

func NewChatRepo(pool *pgxpool.Pool) *ChatRepo {
	return &ChatRepo{pool: pool}
}

type Conversacion struct {
	ID               string     `json:"id"`
	Participante1    string     `json:"participante_1"`
	Participante2    string     `json:"participante_2"`
	PropiedadID      *string    `json:"propiedad_id"`
	ReservaID        *string    `json:"reserva_id"`
	UltimoMensajeAt  *time.Time `json:"ultimo_mensaje_at"`
	UltimoMensajePreview *string `json:"ultimo_mensaje_preview"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	OtroNombre       string     `json:"otro_nombre"`
	OtroApellido     string     `json:"otro_apellido"`
	OtroAvatarURL    *string    `json:"otro_avatar_url"`
	NoLeidos         int        `json:"no_leidos"`
}

type Mensaje struct {
	ID              string     `json:"id"`
	ConversacionID  string     `json:"conversacion_id"`
	RemitenteID     string     `json:"remitente_id"`
	Contenido       *string    `json:"contenido"`
	Tipo            string     `json:"tipo"`
	ImagenURL       *string    `json:"imagen_url"`
	Leido           bool       `json:"leido"`
	CreatedAt       time.Time  `json:"created_at"`
	RemitenteNombre string     `json:"remitente_nombre"`
	RemitenteAvatar *string    `json:"remitente_avatar"`
}

func (r *ChatRepo) GetConversaciones(ctx context.Context, userID string) ([]Conversacion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.participante_1, c.participante_2, c.propiedad_id, c.reserva_id,
		       c.ultimo_mensaje_at, c.ultimo_mensaje_preview, c.created_at, c.updated_at,
		       u.nombre, u.apellido, u.foto_url,
		       (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id AND m.remitente_id != $1 AND m.leido = false)
		FROM conversaciones c
		LEFT JOIN usuarios u ON u.id = CASE WHEN c.participante_1 = $1 THEN c.participante_2 ELSE c.participante_1 END
		WHERE c.participante_1 = $1 OR c.participante_2 = $1
		ORDER BY c.ultimo_mensaje_at DESC NULLS LAST
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Conversacion
	for rows.Next() {
		var c Conversacion
		if err := rows.Scan(&c.ID, &c.Participante1, &c.Participante2, &c.PropiedadID, &c.ReservaID,
			&c.UltimoMensajeAt, &c.UltimoMensajePreview, &c.CreatedAt, &c.UpdatedAt,
			&c.OtroNombre, &c.OtroApellido, &c.OtroAvatarURL, &c.NoLeidos); err != nil {
			return nil, err
		}

		results = append(results, c)
	}
	return results, nil
}

func (r *ChatRepo) GetOrCreateConversacion(ctx context.Context, userID, otroID string, propiedadID *string) (*Conversacion, error) {
	var c Conversacion
	err := r.pool.QueryRow(ctx, `
		SELECT id, participante_1, participante_2, propiedad_id, reserva_id,
		       ultimo_mensaje_at, ultimo_mensaje_preview, created_at, updated_at
		FROM conversaciones
		WHERE (participante_1 = $1 AND participante_2 = $2) OR (participante_1 = $2 AND participante_2 = $1)
		LIMIT 1
	`, userID, otroID).Scan(&c.ID, &c.Participante1, &c.Participante2, &c.PropiedadID, &c.ReservaID,
		&c.UltimoMensajeAt, &c.UltimoMensajePreview, &c.CreatedAt, &c.UpdatedAt)

	if err == nil {
		if propiedadID != nil && c.PropiedadID == nil {
			r.pool.Exec(ctx, `UPDATE conversaciones SET propiedad_id = $2 WHERE id = $1`, c.ID, *propiedadID)
		}
		return &c, nil
	}

	var id string
	err = r.pool.QueryRow(ctx, `
		INSERT INTO conversaciones (participante_1, participante_2, propiedad_id)
		VALUES ($1, $2, $3) RETURNING id
	`, userID, otroID, propiedadID).Scan(&id)
	if err != nil {
		return nil, fmt.Errorf("crear conversacion: %w", err)
	}

	return r.GetConversacionByID(ctx, id)
}

func (r *ChatRepo) GetConversacionByID(ctx context.Context, id string) (*Conversacion, error) {
	var c Conversacion
	err := r.pool.QueryRow(ctx, `
		SELECT id, participante_1, participante_2, propiedad_id, reserva_id,
		       ultimo_mensaje_at, ultimo_mensaje_preview, created_at, updated_at
		FROM conversaciones WHERE id = $1
	`, id).Scan(&c.ID, &c.Participante1, &c.Participante2, &c.PropiedadID, &c.ReservaID,
		&c.UltimoMensajeAt, &c.UltimoMensajePreview, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *ChatRepo) IsParticipant(ctx context.Context, conversacionID, userID string) bool {
	var exists bool
	r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM conversaciones WHERE id = $1 AND (participante_1 = $2 OR participante_2 = $2))
	`, conversacionID, userID).Scan(&exists)
	return exists
}

func (r *ChatRepo) GetMensajes(ctx context.Context, conversacionID string, limit, offset int) ([]Mensaje, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT m.id, m.conversacion_id, m.remitente_id, m.contenido, m.tipo, m.imagen_url, m.leido, m.created_at,
		       u.nombre, u.foto_url
		FROM mensajes m
		JOIN usuarios u ON u.id = m.remitente_id
		WHERE m.conversacion_id = $1
		ORDER BY m.created_at ASC
		LIMIT $2 OFFSET $3
	`, conversacionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Mensaje
	for rows.Next() {
		var m Mensaje
		if err := rows.Scan(&m.ID, &m.ConversacionID, &m.RemitenteID, &m.Contenido, &m.Tipo, &m.ImagenURL, &m.Leido, &m.CreatedAt,
			&m.RemitenteNombre, &m.RemitenteAvatar); err != nil {
			return nil, err
		}
		results = append(results, m)
	}
	return results, nil
}

func (r *ChatRepo) InsertMensaje(ctx context.Context, conversacionID, remitenteID, contenido, tipo string, imagenURL *string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO mensajes (conversacion_id, remitente_id, contenido, tipo, imagen_url)
		VALUES ($1, $2, $3, $4, $5) RETURNING id
	`, conversacionID, remitenteID, contenido, tipo, imagenURL).Scan(&id)
	if err != nil {
		return "", err
	}

	preview := contenido
	if len(preview) > 50 {
		preview = preview[:50] + "..."
	}
	r.pool.Exec(ctx, `
		UPDATE conversaciones SET ultimo_mensaje_at = NOW(), ultimo_mensaje_preview = $2, updated_at = NOW() WHERE id = $1
	`, conversacionID, preview)

	return id, nil
}

func (r *ChatRepo) MarkAsRead(ctx context.Context, conversacionID, userID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE mensajes SET leido = true WHERE conversacion_id = $1 AND remitente_id != $2 AND leido = false
	`, conversacionID, userID)
	return err
}

func (r *ChatRepo) CountNoLeidos(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM mensajes m
		JOIN conversaciones c ON c.id = m.conversacion_id
		WHERE (c.participante_1 = $1 OR c.participante_2 = $1) AND m.remitente_id != $1 AND m.leido = false
	`, userID).Scan(&count)
	return count, err
}
