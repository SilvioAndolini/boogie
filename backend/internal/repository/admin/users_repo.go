package admin

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepo struct {
	pool *pgxpool.Pool
}

func NewAdminRepo(pool *pgxpool.Pool) *AdminRepo {
	return &AdminRepo{pool: pool}
}

func (r *AdminRepo) Pool() *pgxpool.Pool { return r.pool }

func (r *AdminRepo) GetUsuariosAdmin(ctx context.Context, busqueda, rol string, pagina, limite int) ([]AdminUser, int, error) {
	offset := (pagina - 1) * limite

	where := []string{}
	args := []interface{}{}
	argIdx := 1

	if busqueda != "" {
		where = append(where, fmt.Sprintf("(u.nombre ILIKE $%d OR u.apellido ILIKE $%d OR u.email ILIKE $%d)", argIdx, argIdx+1, argIdx+2))
		args = append(args, "%"+busqueda+"%", "%"+busqueda+"%", "%"+busqueda+"%")
		argIdx += 3
	}
	if rol != "" && rol != "TODOS" {
		where = append(where, fmt.Sprintf("u.rol = $%d", argIdx))
		args = append(args, rol)
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	var total int
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM usuarios u %s", whereClause)
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`
		SELECT u.id, u.email, u.nombre, u.apellido, u.telefono, u.cedula, u.avatar_url,
		       u.verificado, u.rol, COALESCE(u.activo, true), u.fecha_registro,
		       COALESCE(u.plan_suscripcion, 'FREE'), COALESCE(u.reputacion, 0), COALESCE(u.reputacion_manual, false)
		FROM usuarios u
		%s
		ORDER BY u.fecha_registro DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var usuarios []AdminUser
	for rows.Next() {
		var u AdminUser
		if err := rows.Scan(
			&u.ID, &u.Email, &u.Nombre, &u.Apellido, &u.Telefono, &u.Cedula, &u.AvatarURL,
			&u.Verificado, &u.Rol, &u.Activo, &u.FechaRegistro,
			&u.PlanSuscripcion, &u.Reputacion, &u.ReputacionManual,
		); err != nil {
			return nil, 0, err
		}
		usuarios = append(usuarios, u)
	}
	if usuarios == nil {
		usuarios = []AdminUser{}
	}
	return usuarios, total, nil
}

func (r *AdminRepo) CrearUsuarioAdmin(ctx context.Context, email, password, nombre, apellido string, telefono *string, rol, adminID string) (map[string]interface{}, error) {
	return map[string]interface{}{
		"ok":      true,
		"mensaje": "Usuario creado (delegado a Supabase Auth)",
	}, nil
}

func (r *AdminRepo) UpdateUsuarioAdmin(ctx context.Context, id string, rol, plan *string, reputacion *float64, activo *bool) error {
	sets := []string{}
	args := []interface{}{}
	argIdx := 2

	if rol != nil {
		sets = append(sets, fmt.Sprintf("rol = $%d", argIdx))
		args = append(args, *rol)
		argIdx++
	}
	if plan != nil {
		sets = append(sets, fmt.Sprintf("plan_suscripcion = $%d", argIdx))
		args = append(args, *plan)
		argIdx++
	}
	if reputacion != nil {
		sets = append(sets, fmt.Sprintf("reputacion = $%d", argIdx))
		args = append(args, *reputacion)
		argIdx++
	}
	if activo != nil {
		sets = append(sets, fmt.Sprintf("activo = $%d", argIdx))
		args = append(args, *activo)
		argIdx++
	}

	if len(sets) == 0 {
		return fmt.Errorf("no se proporcionaron campos para actualizar")
	}

	q := fmt.Sprintf("UPDATE usuarios SET %s WHERE id = $1", strings.Join(sets, ", "))
	args = append([]interface{}{id}, args...)
	_, err := r.pool.Exec(ctx, q, args...)
	return err
}

func (r *AdminRepo) DeleteUsuarioAdmin(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE usuarios SET activo = false WHERE id = $1`, id)
	return err
}
