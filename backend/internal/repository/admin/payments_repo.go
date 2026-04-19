package admin

import (
	"context"
	"fmt"
	"strings"
	"time"
)

func (r *AdminRepo) GetPagosAdmin(ctx context.Context, estado, metodoPago, busqueda string, pagina, limite int) ([]AdminPago, int, error) {
	offset := (pagina - 1) * limite

	where := []string{}
	args := []interface{}{}
	argIdx := 1

	if estado != "" && estado != "TODOS" {
		where = append(where, fmt.Sprintf("p.estado = $%d", argIdx))
		args = append(args, estado)
		argIdx++
	}
	if metodoPago != "" && metodoPago != "TODOS" {
		where = append(where, fmt.Sprintf("p.metodo_pago = $%d", argIdx))
		args = append(args, metodoPago)
		argIdx++
	}
	if busqueda != "" {
		where = append(where, fmt.Sprintf("(p.referencia ILIKE $%d OR p.notas_verificacion ILIKE $%d)", argIdx, argIdx+1))
		args = append(args, "%"+busqueda+"%", "%"+busqueda+"%")
		argIdx += 2
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQ := fmt.Sprintf("SELECT COUNT(*) FROM pagos p %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`
		SELECT p.id, p.monto, p.moneda, p.metodo_pago, p.referencia, p.comprobante,
			p.estado, p.fecha_creacion, p.fecha_verificacion, p.fecha_acreditacion, p.notas_verificacion,
			COALESCE(rs.id,''), COALESCE(rs.codigo,''), COALESCE(rs.estado,''),
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM pagos p
		LEFT JOIN reservas rs ON p.reserva_id = rs.id
		LEFT JOIN usuarios u ON p.usuario_id = u.id
		%s
		ORDER BY p.fecha_creacion DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIdx, argIdx+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var pagos []AdminPago
	for rows.Next() {
		var pago AdminPago
		var res AdminReservaShort
		var usr AdminUserShort
		if err := rows.Scan(
			&pago.ID, &pago.Monto, &pago.Moneda, &pago.MetodoPago, &pago.Referencia, &pago.Comprobante,
			&pago.Estado, &pago.FechaCreacion, &pago.FechaVerificacion, &pago.FechaAcreditacion, &pago.NotasVerificacion,
			&res.ID, &res.Codigo, &res.Estado,
			&usr.ID, &usr.Nombre, &usr.Apellido, &usr.Email, &usr.AvatarURL,
		); err != nil {
			return nil, 0, err
		}
		if res.ID != "" {
			pago.Reserva = &res
		}
		if usr.ID != "" {
			pago.Usuario = &usr
		}
		pagos = append(pagos, pago)
	}
	if pagos == nil {
		pagos = []AdminPago{}
	}
	return pagos, total, nil
}

func (r *AdminRepo) GetPagosStats(ctx context.Context) (map[string]int, error) {
	rows, err := r.pool.Query(ctx, `SELECT estado, COUNT(*) FROM pagos GROUP BY estado`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	stats := map[string]int{}
	for rows.Next() {
		var estado string
		var count int
		if err := rows.Scan(&estado, &count); err != nil {
			return nil, err
		}
		stats[estado] = count
	}
	return stats, nil
}

func (r *AdminRepo) GetPagoEstado(ctx context.Context, pagoID string) (string, error) {
	var estado string
	err := r.pool.QueryRow(ctx, `SELECT estado FROM pagos WHERE id = $1`, pagoID).Scan(&estado)
	return estado, err
}

func (r *AdminRepo) UpdatePagoEstado(ctx context.Context, pagoID, nuevoEstado string, notas *string, verificacion, acreditacion *time.Time) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE pagos SET estado = $1, notas_verificacion = $2, fecha_verificacion = $3, fecha_acreditacion = $4 WHERE id = $5`,
		nuevoEstado, notas, verificacion, acreditacion, pagoID)
	return err
}

func (r *AdminRepo) GetPagoReservaID(ctx context.Context, pagoID string) (*string, error) {
	var reservaID *string
	err := r.pool.QueryRow(ctx, `
		SELECT p.reserva_id FROM pagos p
		LEFT JOIN reservas r ON p.reserva_id = r.id WHERE p.id = $1`, pagoID).Scan(&reservaID)
	if err != nil {
		return nil, err
	}
	return reservaID, nil
}
