package repository

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/boogie/backend/internal/domain/idgen"
	bizerrors "github.com/boogie/backend/internal/domain/errors"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ChatRepo struct {
	pool *pgxpool.Pool
}

func NewChatRepo(pool *pgxpool.Pool) *ChatRepo {
	return &ChatRepo{pool: pool}
}

type Conversacion struct {
	ID                   string     `json:"id"`
	Participante1        string     `json:"participante_1"`
	Participante2        string     `json:"participante_2"`
	PropiedadID          *string    `json:"propiedad_id"`
	ReservaID            *string    `json:"reserva_id"`
	UltimoMensajeAt      *time.Time `json:"ultimo_mensaje_at"`
	UltimoMensajePreview *string    `json:"ultimo_mensaje_preview"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
	OtroNombre           string     `json:"otro_nombre"`
	OtroApellido         string     `json:"otro_apellido"`
	OtroAvatarURL        *string    `json:"otro_avatar_url"`
	OtroID               string     `json:"otro_id"`
	PropiedadTitulo      *string    `json:"propiedad_titulo"`
	NoLeidos             int        `json:"no_leidos"`
}

type Mensaje struct {
	ID              string    `json:"id"`
	ConversacionID  string    `json:"conversacion_id"`
	RemitenteID     string    `json:"remitente_id"`
	Contenido       *string   `json:"contenido"`
	Tipo            string    `json:"tipo"`
	ImagenURL       *string   `json:"imagen_url"`
	Leido           bool      `json:"leido"`
	CreatedAt       time.Time `json:"created_at"`
	RemitenteNombre string    `json:"remitente_nombre"`
	RemitenteAvatar *string   `json:"remitente_avatar"`
}

func (r *ChatRepo) GetConversaciones(ctx context.Context, userID string) ([]Conversacion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.participante_1, c.participante_2, c.propiedad_id, c.reserva_id,
		       c.ultimo_mensaje_at, c.ultimo_mensaje_preview, c.created_at, c.updated_at,
		       u.nombre, u.apellido, u.avatar_url,
		       CASE WHEN c.participante_1 = $1 THEN c.participante_2 ELSE c.participante_1 END,
		       p.titulo,
		       COALESCE(ml.no_leidos, 0)
		FROM conversaciones c
		LEFT JOIN usuarios u ON u.id = CASE WHEN c.participante_1 = $1 THEN c.participante_2 ELSE c.participante_1 END
		LEFT JOIN propiedades p ON p.id = c.propiedad_id
		LEFT JOIN LATERAL (SELECT COUNT(*) as no_leidos FROM mensajes m WHERE m.conversacion_id = c.id AND m.remitente_id != $1 AND m.leido = false) ml ON true
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
			&c.OtroNombre, &c.OtroApellido, &c.OtroAvatarURL, &c.OtroID, &c.PropiedadTitulo, &c.NoLeidos); err != nil {
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
			if _, err := r.pool.Exec(ctx, `UPDATE conversaciones SET propiedad_id = $2 WHERE id = $1`, c.ID, *propiedadID); err != nil {
				slog.Error("[chat-repo] update propiedad_id", "error", err, "convID", c.ID)
			}
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
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM conversaciones WHERE id = $1 AND (participante_1 = $2 OR participante_2 = $2))
	`, conversacionID, userID).Scan(&exists)
	if err != nil {
		slog.Error("[chat-repo] IsParticipant check", "error", err, "convID", conversacionID)
		return false
	}
	return exists
}

func (r *ChatRepo) GetMensajes(ctx context.Context, conversacionID string, limit, offset int) ([]Mensaje, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT m.id, m.conversacion_id, m.remitente_id, m.contenido, m.tipo, m.imagen_url, m.leido, m.created_at,
		       u.nombre, u.avatar_url
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

func (r *ChatRepo) InsertMensaje(ctx context.Context, conversacionID, remitenteID, contenido, tipo string, imagenURL *string) (*Mensaje, error) {
	var m Mensaje
	err := r.pool.QueryRow(ctx, `
		INSERT INTO mensajes (conversacion_id, remitente_id, contenido, tipo, imagen_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, conversacion_id, remitente_id, contenido, tipo, imagen_url, leido, created_at
	`, conversacionID, remitenteID, contenido, tipo, imagenURL).Scan(
		&m.ID, &m.ConversacionID, &m.RemitenteID, &m.Contenido, &m.Tipo, &m.ImagenURL, &m.Leido, &m.CreatedAt)
	if err != nil {
		return nil, err
	}

	var nombre string
	var avatar *string
	if err := r.pool.QueryRow(ctx, `SELECT nombre, avatar_url FROM usuarios WHERE id = $1`, remitenteID).Scan(&nombre, &avatar); err != nil {
		slog.Error("[chat-repo] fetch remitente nombre", "error", err, "remitenteID", remitenteID)
	}
	m.RemitenteNombre = nombre
	m.RemitenteAvatar = avatar

	preview := contenido
	if len(preview) > 50 {
		preview = preview[:50] + "..."
	}
	if _, err := r.pool.Exec(ctx, `
		UPDATE conversaciones SET ultimo_mensaje_at = NOW(), ultimo_mensaje_preview = $2, updated_at = NOW() WHERE id = $1
	`, conversacionID, preview); err != nil {
		slog.Error("[chat-repo] update conversacion preview", "error", err, "convID", conversacionID)
	}

	return &m, nil
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

type ConversacionInfo struct {
	ID              string  `json:"id"`
	Participante1   string  `json:"participante_1"`
	Participante2   string  `json:"participante_2"`
	OtroID          string  `json:"otro_id"`
	OtroNombre      string  `json:"otro_nombre"`
	OtroApellido    string  `json:"otro_apellido"`
	OtroAvatarURL   *string `json:"otro_avatar_url"`
	PropiedadID     *string `json:"propiedad_id"`
	PropiedadTitulo *string `json:"propiedad_titulo"`
}

func (r *ChatRepo) GetConversacionInfo(ctx context.Context, convID, userID string) (*ConversacionInfo, error) {
	var info ConversacionInfo
	err := r.pool.QueryRow(ctx, `
		SELECT c.id, c.participante_1, c.participante_2,
		       CASE WHEN c.participante_1 = $2 THEN c.participante_2 ELSE c.participante_1 END,
		       u.nombre, u.apellido, u.avatar_url,
		       c.propiedad_id, p.titulo
		FROM conversaciones c
		LEFT JOIN usuarios u ON u.id = CASE WHEN c.participante_1 = $2 THEN c.participante_2 ELSE c.participante_1 END
		LEFT JOIN propiedades p ON p.id = c.propiedad_id
		WHERE c.id = $1 AND (c.participante_1 = $2 OR c.participante_2 = $2)
	`, convID, userID).Scan(
		&info.ID, &info.Participante1, &info.Participante2,
		&info.OtroID, &info.OtroNombre, &info.OtroApellido, &info.OtroAvatarURL,
		&info.PropiedadID, &info.PropiedadTitulo,
	)
	if err != nil {
		return nil, bizerrors.ConversacionNoEncontrada()
	}
	return &info, nil
}

type MensajeRapido struct {
	ID        string `json:"id"`
	UsuarioID string `json:"usuario_id"`
	Contenido string `json:"contenido"`
	Tipo      string `json:"tipo"`
	Orden     int    `json:"orden"`
	Activo    bool   `json:"activo"`
}

func (r *ChatRepo) GetMensajesRapidos(ctx context.Context, userID string) ([]MensajeRapido, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, usuario_id, contenido, tipo, orden, activo
		FROM mensajes_rapidos
		WHERE usuario_id = $1 AND activo = true
		ORDER BY orden ASC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get mensajes_rapidos: %w", err)
	}
	defer rows.Close()

	var results []MensajeRapido
	for rows.Next() {
		var m MensajeRapido
		if err := rows.Scan(&m.ID, &m.UsuarioID, &m.Contenido, &m.Tipo, &m.Orden, &m.Activo); err != nil {
			return nil, fmt.Errorf("scan mensaje_rapido: %w", err)
		}
		results = append(results, m)
	}
	if results == nil {
		results = []MensajeRapido{}
	}
	return results, nil
}

func (r *ChatRepo) ExistsMensajesRapidos(ctx context.Context, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM mensajes_rapidos WHERE usuario_id = $1)
	`, userID).Scan(&exists)
	return exists, err
}

func (r *ChatRepo) SeedMensajesRapidos(ctx context.Context, userID, tipo string, mensajes []string) error {
	if len(mensajes) == 0 {
		return nil
	}
	for i, contenido := range mensajes {
		id := idgen.New()
		_, err := r.pool.Exec(ctx, `
			INSERT INTO mensajes_rapidos (id, usuario_id, contenido, tipo, orden, activo)
			VALUES ($1, $2, $3, $4, $5, true)
		`, id, userID, contenido, tipo, i)
		if err != nil {
			return fmt.Errorf("seed mensaje_rapido: %w", err)
		}
	}
	return nil
}

func (r *ChatRepo) InsertMensajeRapido(ctx context.Context, userID, contenido, tipo string, orden int) (*MensajeRapido, error) {
	id := idgen.New()
	var m MensajeRapido
	err := r.pool.QueryRow(ctx, `
		INSERT INTO mensajes_rapidos (id, usuario_id, contenido, tipo, orden, activo)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id, usuario_id, contenido, tipo, orden, activo
	`, id, userID, contenido, tipo, orden).Scan(&m.ID, &m.UsuarioID, &m.Contenido, &m.Tipo, &m.Orden, &m.Activo)
	if err != nil {
		return nil, fmt.Errorf("insert mensaje_rapido: %w", err)
	}
	return &m, nil
}

func (r *ChatRepo) UpdateMensajeRapido(ctx context.Context, id, userID, contenido string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE mensajes_rapidos SET contenido = $1 WHERE id = $2 AND usuario_id = $3
	`, contenido, id, userID)
	if err != nil {
		return fmt.Errorf("update mensaje_rapido: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.MensajeRapidoNoEncontrado()
	}
	return nil
}

func (r *ChatRepo) DeleteMensajeRapido(ctx context.Context, id, userID string) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM mensajes_rapidos WHERE id = $1 AND usuario_id = $2
	`, id, userID)
	if err != nil {
		return fmt.Errorf("delete mensaje_rapido: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.MensajeRapidoNoEncontrado()
	}
	return nil
}

func (r *ChatRepo) GetMaxOrdenMensajeRapido(ctx context.Context, userID string) (int, error) {
	var maxOrden *int
	err := r.pool.QueryRow(ctx, `
		SELECT MAX(orden) FROM mensajes_rapidos WHERE usuario_id = $1
	`, userID).Scan(&maxOrden)
	if err != nil {
		return 0, err
	}
	if maxOrden == nil {
		return 0, nil
	}
	return *maxOrden, nil
}
