package repository

import (
	"context"
	"fmt"
	"time"

	bizerrors "github.com/boogie/backend/internal/domain/errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

type VerificacionRepo struct {
	pool *pgxpool.Pool
}

func NewVerificacionRepo(pool *pgxpool.Pool) *VerificacionRepo {
	return &VerificacionRepo{pool: pool}
}

type VerificacionDocumento struct {
	ID                string     `json:"id"`
	UsuarioID         string     `json:"usuario_id"`
	Metodo            string     `json:"metodo"`
	Estado            string     `json:"estado"`
	MetamapFlowID     *string    `json:"metamap_flow_id"`
	MetamapIdentityID *string    `json:"metamap_identity_id"`
	FotoFrontalURL    *string    `json:"foto_frontal_url"`
	FotoTraseraURL    *string    `json:"foto_trasera_url"`
	FotoSelfieURL     *string    `json:"foto_selfie_url"`
	RevisadoPor       *string    `json:"revisado_por"`
	MotivoRechazo     *string    `json:"motivo_rechazo"`
	FechaRevision     *time.Time `json:"fecha_revision"`
	FechaCreacion     time.Time  `json:"fecha_creacion"`
	FechaActualizacion time.Time `json:"fecha_actualizacion"`
}

type VerificacionConUsuario struct {
	VerificacionDocumento
	UsuarioNombre   string  `json:"usuario_nombre"`
	UsuarioApellido string  `json:"usuario_apellido"`
	UsuarioEmail    string  `json:"usuario_email"`
	UsuarioCedula   *string `json:"usuario_cedula"`
	UsuarioTelefono *string `json:"usuario_telefono"`
}

func (r *VerificacionRepo) GetLatestByUser(ctx context.Context, userID string) (*VerificacionDocumento, error) {
	var v VerificacionDocumento
	err := r.pool.QueryRow(ctx, `
		SELECT id, usuario_id, metodo, estado,
		       metamap_flow_id, metamap_identity_id,
		       foto_frontal_url, foto_trasera_url, foto_selfie_url,
		       revisado_por, motivo_rechazo, fecha_revision,
		       fecha_creacion, fecha_actualizacion
		FROM verificaciones_documento
		WHERE usuario_id = $1
		ORDER BY fecha_creacion DESC LIMIT 1
	`, userID).Scan(
		&v.ID, &v.UsuarioID, &v.Metodo, &v.Estado,
		&v.MetamapFlowID, &v.MetamapIdentityID,
		&v.FotoFrontalURL, &v.FotoTraseraURL, &v.FotoSelfieURL,
		&v.RevisadoPor, &v.MotivoRechazo, &v.FechaRevision,
		&v.FechaCreacion, &v.FechaActualizacion,
	)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VerificacionRepo) GetActiveByUser(ctx context.Context, userID string) (*VerificacionDocumento, error) {
	var v VerificacionDocumento
	err := r.pool.QueryRow(ctx, `
		SELECT id, usuario_id, metodo, estado,
		       metamap_flow_id, metamap_identity_id,
		       foto_frontal_url, foto_trasera_url, foto_selfie_url,
		       revisado_por, motivo_rechazo, fecha_revision,
		       fecha_creacion, fecha_actualizacion
		FROM verificaciones_documento
		WHERE usuario_id = $1 AND estado IN ('PENDIENTE', 'EN_PROCESO', 'APROBADA')
		ORDER BY fecha_creacion DESC LIMIT 1
	`, userID).Scan(
		&v.ID, &v.UsuarioID, &v.Metodo, &v.Estado,
		&v.MetamapFlowID, &v.MetamapIdentityID,
		&v.FotoFrontalURL, &v.FotoTraseraURL, &v.FotoSelfieURL,
		&v.RevisadoPor, &v.MotivoRechazo, &v.FechaRevision,
		&v.FechaCreacion, &v.FechaActualizacion,
	)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VerificacionRepo) Insert(ctx context.Context, userID, metodo, estado string, fotoFrontal, fotoTrasera, fotoSelfie *string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO verificaciones_documento (usuario_id, metodo, estado, foto_frontal_url, foto_trasera_url, foto_selfie_url)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, userID, metodo, estado, fotoFrontal, fotoTrasera, fotoSelfie).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("insert verificacion: %w", err)
	}
	return id, nil
}

func (r *VerificacionRepo) ListAll(ctx context.Context) ([]VerificacionConUsuario, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT v.id, v.usuario_id, v.metodo, v.estado,
		       v.metamap_flow_id, v.metamap_identity_id,
		       v.foto_frontal_url, v.foto_trasera_url, v.foto_selfie_url,
		       v.revisado_por, v.motivo_rechazo, v.fecha_revision,
		       v.fecha_creacion, v.fecha_actualizacion,
		       u.nombre, u.apellido, u.email, u.cedula, u.telefono
		FROM verificaciones_documento v
		JOIN usuarios u ON u.id = v.usuario_id
		ORDER BY v.fecha_creacion DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []VerificacionConUsuario
	for rows.Next() {
		var item VerificacionConUsuario
		if err := rows.Scan(
			&item.ID, &item.UsuarioID, &item.Metodo, &item.Estado,
			&item.MetamapFlowID, &item.MetamapIdentityID,
			&item.FotoFrontalURL, &item.FotoTraseraURL, &item.FotoSelfieURL,
			&item.RevisadoPor, &item.MotivoRechazo, &item.FechaRevision,
			&item.FechaCreacion, &item.FechaActualizacion,
			&item.UsuarioNombre, &item.UsuarioApellido, &item.UsuarioEmail,
			&item.UsuarioCedula, &item.UsuarioTelefono,
		); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *VerificacionRepo) GetByID(ctx context.Context, id string) (*VerificacionDocumento, error) {
	var v VerificacionDocumento
	err := r.pool.QueryRow(ctx, `
		SELECT id, usuario_id, metodo, estado,
		       metamap_flow_id, metamap_identity_id,
		       foto_frontal_url, foto_trasera_url, foto_selfie_url,
		       revisado_por, motivo_rechazo, fecha_revision,
		       fecha_creacion, fecha_actualizacion
		FROM verificaciones_documento WHERE id = $1
	`, id).Scan(
		&v.ID, &v.UsuarioID, &v.Metodo, &v.Estado,
		&v.MetamapFlowID, &v.MetamapIdentityID,
		&v.FotoFrontalURL, &v.FotoTraseraURL, &v.FotoSelfieURL,
		&v.RevisadoPor, &v.MotivoRechazo, &v.FechaRevision,
		&v.FechaCreacion, &v.FechaActualizacion,
	)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *VerificacionRepo) Revisar(ctx context.Context, verifID, accion, revisadoPor string, motivoRechazo *string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE verificaciones_documento
		SET estado = $2, revisado_por = $3, motivo_rechazo = $4,
		    fecha_revision = NOW(), fecha_actualizacion = NOW()
		WHERE id = $1
	`, verifID, accion, revisadoPor, motivoRechazo)
	return err
}

func (r *VerificacionRepo) SetUsuarioVerificado(ctx context.Context, userID string, verificado bool) error {
	_, err := r.pool.Exec(ctx, `UPDATE usuarios SET verificado = $2 WHERE id = $1`, userID, verificado)
	return err
}

var allowedCountTables = map[string]string{
	"verificaciones_documento": "verificaciones_documento",
	"reservas":                 "reservas",
	"pagos":                    "pagos",
}

func (r *VerificacionRepo) CountPendientes(ctx context.Context, tabla string) (int, error) {
	safeTable, ok := allowedCountTables[tabla]
	if !ok {
		return 0, bizerrors.TablaInvalida(tabla)
	}
	var count int
	err := r.pool.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE estado = 'PENDIENTE'`, safeTable)).Scan(&count)
	return count, err
}
