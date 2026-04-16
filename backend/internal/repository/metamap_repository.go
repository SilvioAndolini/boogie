package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// MetamapRepo handles database operations for MetaMap verification webhooks.
type MetamapRepo struct {
	pool *pgxpool.Pool
}

func NewMetamapRepo(pool *pgxpool.Pool) *MetamapRepo {
	return &MetamapRepo{pool: pool}
}

// FindVerificacionByMetamapIdentity finds a verification by metamap identity or flow ID.
func (r *MetamapRepo) FindVerificacionByMetamapIdentity(ctx context.Context, identityID string) (verifID, usuarioID string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT id, usuario_id FROM verificaciones_documento
		WHERE metamap_identity_id = $1 LIMIT 1
	`, identityID).Scan(&verifID, &usuarioID)

	if err != nil {
		err = r.pool.QueryRow(ctx, `
			SELECT id, usuario_id FROM verificaciones_documento
			WHERE metamap_flow_id = $1 LIMIT 1
		`, identityID).Scan(&verifID, &usuarioID)
	}
	return
}

// UpdateVerificacionEstado updates the verification status and metamap result.
func (r *MetamapRepo) UpdateVerificacionEstado(ctx context.Context, verifID, estado string, resourceJSON json.RawMessage) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE verificaciones_documento
		SET estado = $1, metamap_resultado = $2, fecha_actualizacion = NOW()
		WHERE id = $3
	`, estado, resourceJSON, verifID)
	if err != nil {
		return fmt.Errorf("update verificacion estado: %w", err)
	}
	return nil
}

// SetMotivoRechazo sets the rejection reason for a verification.
func (r *MetamapRepo) SetMotivoRechazo(ctx context.Context, verifID, motivo string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE verificaciones_documento SET motivo_rechazo = $1 WHERE id = $2
	`, motivo, verifID)
	if err != nil {
		return fmt.Errorf("set motivo rechazo: %w", err)
	}
	return nil
}

// SetFechaRevision sets the review date for an approved verification.
func (r *MetamapRepo) SetFechaRevision(ctx context.Context, verifID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE verificaciones_documento SET fecha_revision = NOW() WHERE id = $1
	`, verifID)
	if err != nil {
		return fmt.Errorf("set fecha revision: %w", err)
	}
	return nil
}

// MarcarUsuarioVerificado marks a user as verified.
func (r *MetamapRepo) MarcarUsuarioVerificado(ctx context.Context, usuarioID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE usuarios SET verificado = true WHERE id = $1
	`, usuarioID)
	if err != nil {
		return fmt.Errorf("marcar usuario verificado: %w", err)
	}
	return nil
}
