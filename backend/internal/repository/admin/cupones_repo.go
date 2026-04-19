package admin

import (
	"context"
	"fmt"
	"strings"
)

func (r *AdminRepo) GetCupones(ctx context.Context) ([]Cupon, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, codigo, nombre, descripcion, tipo_descuento, valor_descuento,
		moneda, max_descuento, tipo_aplicacion, valor_aplicacion, min_compra, min_noches,
		max_usos, max_usos_por_usuario, usos_actuales, fecha_inicio, fecha_fin, activo, creado_por, fecha_creacion
		FROM cupones ORDER BY fecha_creacion DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cupones []Cupon
	for rows.Next() {
		var c Cupon
		if err := rows.Scan(&c.ID, &c.Codigo, &c.Nombre, &c.Descripcion, &c.TipoDescuento, &c.ValorDescuento,
			&c.Moneda, &c.MaxDescuento, &c.TipoAplicacion, &c.ValorAplicacion, &c.MinCompra, &c.MinNoches,
			&c.MaxUsos, &c.MaxUsosPorUsuario, &c.UsosActuales, &c.FechaInicio, &c.FechaFin, &c.Activo, &c.CreadoPor, &c.FechaCreacion); err != nil {
			return nil, err
		}
		cupones = append(cupones, c)
	}
	if cupones == nil {
		cupones = []Cupon{}
	}
	return cupones, nil
}

func (r *AdminRepo) GetCuponByID(ctx context.Context, id string) (*Cupon, error) {
	var c Cupon
	err := r.pool.QueryRow(ctx, `SELECT id, codigo, nombre, descripcion, tipo_descuento, valor_descuento,
		moneda, max_descuento, tipo_aplicacion, valor_aplicacion, min_compra, min_noches,
		max_usos, max_usos_por_usuario, usos_actuales, fecha_inicio, fecha_fin, activo, creado_por, fecha_creacion
		FROM cupones WHERE id = $1`, id).Scan(
		&c.ID, &c.Codigo, &c.Nombre, &c.Descripcion, &c.TipoDescuento, &c.ValorDescuento,
		&c.Moneda, &c.MaxDescuento, &c.TipoAplicacion, &c.ValorAplicacion, &c.MinCompra, &c.MinNoches,
		&c.MaxUsos, &c.MaxUsosPorUsuario, &c.UsosActuales, &c.FechaInicio, &c.FechaFin, &c.Activo, &c.CreadoPor, &c.FechaCreacion)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *AdminRepo) ExistsCuponCodigo(ctx context.Context, codigo string) (bool, error) {
	var id string
	err := r.pool.QueryRow(ctx, `SELECT id FROM cupones WHERE codigo = $1`, codigo).Scan(&id)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *AdminRepo) GetCuponByCodigo(ctx context.Context, codigo string) (*Cupon, error) {
	var c Cupon
	err := r.pool.QueryRow(ctx, `SELECT id, codigo, nombre, descripcion, tipo_descuento, valor_descuento,
		moneda, max_descuento, tipo_aplicacion, valor_aplicacion, min_compra, min_noches,
		max_usos, max_usos_por_usuario, usos_actuales, fecha_inicio, fecha_fin, activo, creado_por, fecha_creacion
		FROM cupones WHERE codigo = $1`, codigo).Scan(
		&c.ID, &c.Codigo, &c.Nombre, &c.Descripcion, &c.TipoDescuento, &c.ValorDescuento,
		&c.Moneda, &c.MaxDescuento, &c.TipoAplicacion, &c.ValorAplicacion, &c.MinCompra, &c.MinNoches,
		&c.MaxUsos, &c.MaxUsosPorUsuario, &c.UsosActuales, &c.FechaInicio, &c.FechaFin, &c.Activo, &c.CreadoPor, &c.FechaCreacion)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *AdminRepo) CrearCupon(ctx context.Context, c *Cupon) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO cupones (codigo, nombre, descripcion, tipo_descuento, valor_descuento,
		moneda, max_descuento, tipo_aplicacion, valor_aplicacion, min_compra, min_noches,
		max_usos, max_usos_por_usuario, fecha_inicio, fecha_fin, creado_por)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
		c.Codigo, c.Nombre, c.Descripcion, c.TipoDescuento, c.ValorDescuento,
		c.Moneda, c.MaxDescuento, c.TipoAplicacion, c.ValorAplicacion, c.MinCompra, c.MinNoches,
		c.MaxUsos, c.MaxUsosPorUsuario, c.FechaInicio, c.FechaFin, c.CreadoPor)
	return err
}

var allowedCuponColumns = map[string]bool{
	"codigo": true, "nombre": true, "descripcion": true, "tipo_descuento": true,
	"valor_descuento": true, "moneda": true, "max_descuento": true,
	"tipo_aplicacion": true, "valor_aplicacion": true, "min_compra": true,
	"min_noches": true, "max_usos": true, "max_usos_por_usuario": true,
	"fecha_inicio": true, "fecha_fin": true, "activo": true,
}

func (r *AdminRepo) UpdateCupon(ctx context.Context, id string, fields map[string]interface{}) error {
	if len(fields) == 0 {
		return nil
	}
	sets := []string{}
	args := []interface{}{}
	argIdx := 2
	for k, v := range fields {
		if !allowedCuponColumns[k] {
			return fmt.Errorf("columna no permitida: %s", k)
		}
		sets = append(sets, fmt.Sprintf("%s = $%d", k, argIdx))
		args = append(args, v)
		argIdx++
	}
	q := fmt.Sprintf("UPDATE cupones SET %s WHERE id = $1", strings.Join(sets, ", "))
	args = append([]interface{}{id}, args...)
	_, err := r.pool.Exec(ctx, q, args...)
	return err
}

func (r *AdminRepo) ToggleCuponActivo(ctx context.Context, id string, activo bool) error {
	_, err := r.pool.Exec(ctx, `UPDATE cupones SET activo = $1 WHERE id = $2`, activo, id)
	return err
}

func (r *AdminRepo) DeleteCupon(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cupones WHERE id = $1`, id)
	return err
}

func (r *AdminRepo) GetCuponUsos(ctx context.Context, cuponID string) ([]CuponUso, error) {
	q := `SELECT cu.id, cu.cupon_id, cu.usuario_id, cu.reserva_id, cu.descuento_aplicado, cu.fecha_uso,
		COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''),
		COALESCE(c.codigo,''), COALESCE(c.nombre,''),
		COALESCE(rs.codigo,'')
		FROM cupon_usos cu
		LEFT JOIN usuarios u ON cu.usuario_id = u.id
		LEFT JOIN cupones c ON cu.cupon_id = c.id
		LEFT JOIN reservas rs ON cu.reserva_id = rs.id`
	args := []interface{}{}

	if cuponID != "" {
		q += ` WHERE cu.cupon_id = $1`
		args = append(args, cuponID)
	}
	q += ` ORDER BY cu.fecha_uso DESC LIMIT 100`

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var usos []CuponUso
	for rows.Next() {
		var uso CuponUso
		var usr AdminUserShort
		var cup CuponShort
		var resCod string
		if err := rows.Scan(
			&uso.ID, &uso.CuponID, &uso.UsuarioID, &uso.ReservaID, &uso.DescuentoAplicado, &uso.FechaUso,
			&usr.ID, &usr.Nombre, &usr.Apellido, &usr.Email,
			&cup.Codigo, &cup.Nombre,
			&resCod,
		); err != nil {
			return nil, err
		}
		uso.Usuario = &usr
		uso.Cupon = &cup
		uso.Reserva = &AdminReservaShort{Codigo: resCod}
		usos = append(usos, uso)
	}
	if usos == nil {
		usos = []CuponUso{}
	}
	return usos, nil
}

func (r *AdminRepo) GetCuponesActivosUsuario(ctx context.Context, usuarioID string) ([]CuponActivoUsuario, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, codigo, nombre, descripcion, tipo_descuento, valor_descuento,
		       moneda, max_descuento, tipo_aplicacion, valor_aplicacion,
		       min_compra, min_noches, max_usos, max_usos_por_usuario, usos_actuales,
		       fecha_inicio, fecha_fin, activo, creado_por, fecha_creacion
		FROM cupones
		WHERE activo = true AND fecha_inicio <= NOW() AND fecha_fin >= NOW()
		ORDER BY fecha_creacion DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []CuponActivoUsuario
	for rows.Next() {
		var c CuponActivoUsuario
		if err := rows.Scan(
			&c.ID, &c.Codigo, &c.Nombre, &c.Descripcion, &c.TipoDescuento, &c.ValorDescuento,
			&c.Moneda, &c.MaxDescuento, &c.TipoAplicacion, &c.ValorAplicacion,
			&c.MinCompra, &c.MinNoches, &c.MaxUsos, &c.MaxUsosPorUsuario, &c.UsosActuales,
			&c.FechaInicio, &c.FechaFin, &c.Activo, &c.CreadoPor, &c.FechaCreacion,
		); err != nil {
			return nil, err
		}

		if c.MaxUsos != nil && c.UsosActuales >= *c.MaxUsos {
			continue
		}

		var vecesUsado int
		_ = r.pool.QueryRow(ctx,
			`SELECT COUNT(*) FROM cupon_usos WHERE cupon_id = $1 AND usuario_id = $2`,
			c.ID, usuarioID,
		).Scan(&vecesUsado)

		if c.MaxUsosPorUsuario > 0 && vecesUsado >= c.MaxUsosPorUsuario {
			continue
		}

		c.VecesUsado = vecesUsado
		result = append(result, c)
	}

	if result == nil {
		result = []CuponActivoUsuario{}
	}
	return result, nil
}

func (r *AdminRepo) GetComisiones(ctx context.Context) (map[string]float64, error) {
	rows, err := r.pool.Query(ctx, `SELECT key, value FROM platform_config WHERE key IN ('comision_huesped', 'comision_anfitrion')`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := map[string]float64{"huesped": 0.06, "anfitrion": 0.03}
	for rows.Next() {
		var key string
		var value interface{}
		if err := rows.Scan(&key, &value); err != nil {
			continue
		}
		if m, ok := value.(map[string]interface{}); ok {
			if v, ok := m["valor"].(float64); ok {
				switch key {
				case "comision_huesped":
					result["huesped"] = v
				case "comision_anfitrion":
					result["anfitrion"] = v
				}
			}
		}
	}
	return result, nil
}

func (r *AdminRepo) UpdateComisiones(ctx context.Context, huesped, anfitrion float64, updatedBy string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO platform_config (key, value, updated_by) VALUES
		('comision_huesped', $1, $3),
		('comision_anfitrion', $2, $3)
		ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by`,
		map[string]float64{"valor": huesped}, map[string]float64{"valor": anfitrion}, updatedBy)
	return err
}
