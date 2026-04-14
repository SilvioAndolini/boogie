package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/domain/idgen"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MetodoPagoRepo struct {
	pool *pgxpool.Pool
}

func NewMetodoPagoRepo(pool *pgxpool.Pool) *MetodoPagoRepo {
	return &MetodoPagoRepo{pool: pool}
}

type MetodoPago struct {
	ID            string    `json:"id"`
	Tipo          string    `json:"tipo"`
	Banco         *string   `json:"banco"`
	Telefono      *string   `json:"telefono"`
	Cedula        *string   `json:"cedula"`
	NumeroCuenta  *string   `json:"numero_cuenta"`
	Titular       *string   `json:"titular"`
	EmailZelle    *string   `json:"email_zelle"`
	DireccionUSDT *string   `json:"direccion_usdt"`
	Activo        bool      `json:"activo"`
	Principal     bool      `json:"principal"`
	UsuarioID     string    `json:"usuario_id"`
	FechaCreacion time.Time `json:"fecha_creacion"`
}

func (r *MetodoPagoRepo) ListByUsuario(ctx context.Context, usuarioID string) ([]MetodoPago, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tipo, banco, telefono, cedula, numero_cuenta, titular,
		       email_zelle, direccion_usdt, activo, principal, usuario_id, fecha_creacion
		FROM metodos_pago
		WHERE usuario_id = $1
		ORDER BY principal DESC, fecha_creacion ASC
	`, usuarioID)
	if err != nil {
		return nil, fmt.Errorf("list metodos_pago: %w", err)
	}
	defer rows.Close()

	var results []MetodoPago
	for rows.Next() {
		var m MetodoPago
		if err := rows.Scan(
			&m.ID, &m.Tipo, &m.Banco, &m.Telefono, &m.Cedula, &m.NumeroCuenta,
			&m.Titular, &m.EmailZelle, &m.DireccionUSDT, &m.Activo, &m.Principal,
			&m.UsuarioID, &m.FechaCreacion,
		); err != nil {
			return nil, fmt.Errorf("scan metodo_pago: %w", err)
		}
		results = append(results, m)
	}
	if results == nil {
		results = []MetodoPago{}
	}
	return results, nil
}

func (r *MetodoPagoRepo) ExistsByTipo(ctx context.Context, usuarioID, tipo string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM metodos_pago WHERE usuario_id = $1 AND tipo = $2)
	`, usuarioID, tipo).Scan(&exists)
	return exists, err
}

type CrearMetodoPagoInput struct {
	Tipo          string
	Banco         *string
	Telefono      *string
	Cedula        *string
	NumeroCuenta  *string
	Titular       *string
	EmailZelle    *string
	DireccionUSDT *string
}

func (r *MetodoPagoRepo) Insert(ctx context.Context, usuarioID string, input *CrearMetodoPagoInput) (*MetodoPago, error) {
	id := idgen.New()
	var m MetodoPago
	err := r.pool.QueryRow(ctx, `
		INSERT INTO metodos_pago (id, usuario_id, tipo, banco, telefono, cedula,
		                          numero_cuenta, titular, email_zelle, direccion_usdt, activo, principal, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, false, NOW())
		RETURNING id, tipo, banco, telefono, cedula, numero_cuenta, titular,
		          email_zelle, direccion_usdt, activo, principal, usuario_id, fecha_creacion
	`, id, usuarioID, input.Tipo, input.Banco, input.Telefono, input.Cedula,
		input.NumeroCuenta, input.Titular, input.EmailZelle, input.DireccionUSDT,
	).Scan(
		&m.ID, &m.Tipo, &m.Banco, &m.Telefono, &m.Cedula, &m.NumeroCuenta,
		&m.Titular, &m.EmailZelle, &m.DireccionUSDT, &m.Activo, &m.Principal,
		&m.UsuarioID, &m.FechaCreacion,
	)
	if err != nil {
		return nil, fmt.Errorf("insert metodo_pago: %w", err)
	}
	return &m, nil
}

func (r *MetodoPagoRepo) Delete(ctx context.Context, id, usuarioID string) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM metodos_pago WHERE id = $1 AND usuario_id = $2
	`, id, usuarioID)
	if err != nil {
		return fmt.Errorf("delete metodo_pago: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("metodo de pago no encontrado")
	}
	return nil
}
