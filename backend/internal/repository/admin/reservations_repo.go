package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

func (r *AdminRepo) GetReservasAdmin(ctx context.Context, estado, busqueda string, pagina, limite int) ([]AdminReservaListItem, int, error) {
	offset := (pagina - 1) * limite

	where := []string{}
	args := []interface{}{}
	argIdx := 1

	if estado != "" && estado != "TODOS" {
		where = append(where, fmt.Sprintf("r.estado = $%d", argIdx))
		args = append(args, estado)
		argIdx++
	}
	if busqueda != "" {
		where = append(where, fmt.Sprintf("(r.codigo ILIKE $%d OR r.notas_huesped ILIKE $%d)", argIdx, argIdx+1))
		args = append(args, "%"+busqueda+"%", "%"+busqueda+"%")
		argIdx += 2
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQ := fmt.Sprintf("SELECT COUNT(*) FROM reservas r %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`
		SELECT r.id, r.codigo, r.fecha_entrada, r.fecha_salida, r.noches,
			r.precio_por_noche, r.subtotal, r.comision_plataforma, r.total, r.moneda,
			r.estado, r.cantidad_huespedes, r.notas_huesped, r.notas_internas,
			r.fecha_creacion, r.fecha_confirmacion, r.fecha_cancelacion,
			COALESCE(p.id,''), COALESCE(p.titulo,''), COALESCE(p.slug,''), COALESCE(p.ciudad,''), COALESCE(p.estado,''),
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM reservas r
		LEFT JOIN propiedades p ON r.propiedad_id = p.id
		LEFT JOIN usuarios u ON r.huesped_id = u.id
		%s
		ORDER BY r.fecha_creacion DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIdx, argIdx+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reservas []AdminReservaListItem
	for rows.Next() {
		var res AdminReservaListItem
		var prop AdminPropiedadShort
		var huesp AdminUserShort
		if err := rows.Scan(
			&res.ID, &res.Codigo, &res.FechaEntrada, &res.FechaSalida, &res.Noches,
			&res.PrecioPorNoche, &res.Subtotal, &res.ComisionPlataforma, &res.Total, &res.Moneda,
			&res.Estado, &res.CantidadHuespedes, &res.NotasHuesped, &res.NotasInternas,
			&res.FechaCreacion, &res.FechaConfirmacion, &res.FechaCancelacion,
			&prop.ID, &prop.Titulo, &prop.Slug, &prop.Ciudad, &prop.Estado,
			&huesp.ID, &huesp.Nombre, &huesp.Apellido, &huesp.Email, &huesp.AvatarURL,
		); err != nil {
			return nil, 0, err
		}
		res.Propiedad = &prop
		res.Huesped = &huesp
		reservas = append(reservas, res)
	}
	if reservas == nil {
		reservas = []AdminReservaListItem{}
	}
	return reservas, total, nil
}

func (r *AdminRepo) GetReservasStats(ctx context.Context) (map[string]int, error) {
	rows, err := r.pool.Query(ctx, `SELECT estado, COUNT(*) FROM reservas GROUP BY estado`)
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

func (r *AdminRepo) UpdateReservaEstado(ctx context.Context, reservaID, nuevoEstado string, confirmacion, cancelacion *time.Time) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE reservas SET estado = $1, fecha_confirmacion = $2, fecha_cancelacion = $3 WHERE id = $4`,
		nuevoEstado, confirmacion, cancelacion, reservaID)
	return err
}

func (r *AdminRepo) GetReservaByID(ctx context.Context, id string) (*AdminReserva, error) {
	var res AdminReserva
	err := r.pool.QueryRow(ctx, `
		SELECT r.id, r.codigo, r.estado
		FROM reservas r WHERE r.id = $1`, id).Scan(&res.ID, &res.Codigo, &res.Estado)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (r *AdminRepo) GetReservaByIDFull(ctx context.Context, id string) (*AdminReserva, error) {
	var res AdminReserva
	var prop AdminPropiedadFull
	var huesp AdminUserFull
	var propietario AdminPropietarioShort
	err := r.pool.QueryRow(ctx, `
		SELECT r.id, r.codigo, r.fecha_entrada, r.fecha_salida, r.noches,
			r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion, r.total, r.moneda,
			r.estado, r.cantidad_huespedes, r.notas_huesped, r.notas_internas,
			r.fecha_creacion, r.fecha_confirmacion, r.fecha_cancelacion,
			COALESCE(p.id,''), COALESCE(p.titulo,''), COALESCE(p.slug,''), COALESCE(p.ciudad,''), COALESCE(p.estado,''), p.direccion,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.telefono, u.cedula, u.avatar_url,
			COALESCE(a.id,''), COALESCE(a.nombre,''), COALESCE(a.apellido,''), COALESCE(a.email,''), a.telefono
		FROM reservas r
		LEFT JOIN propiedades p ON r.propiedad_id = p.id
		LEFT JOIN usuarios u ON r.huesped_id = u.id
		LEFT JOIN usuarios a ON p.propietario_id = a.id
		WHERE r.id = $1`, id).Scan(
		&res.ID, &res.Codigo, &res.FechaEntrada, &res.FechaSalida, &res.Noches,
		&res.PrecioPorNoche, &res.Subtotal, &res.ComisionPlataforma, &res.ComisionAnfitrion, &res.Total, &res.Moneda,
		&res.Estado, &res.CantidadHuespedes, &res.NotasHuesped, &res.NotasInternas,
		&res.FechaCreacion, &res.FechaConfirmacion, &res.FechaCancelacion,
		&prop.ID, &prop.Titulo, &prop.Slug, &prop.Ciudad, &prop.Estado, &prop.Direccion,
		&huesp.ID, &huesp.Nombre, &huesp.Apellido, &huesp.Email, &huesp.Telefono, &huesp.Cedula, &huesp.AvatarURL,
		&propietario.ID, &propietario.Nombre, &propietario.Apellido, &propietario.Email, &propietario.Telefono,
	)
	if err != nil {
		return nil, err
	}
	if propietario.ID != "" {
		prop.Propietario = &propietario
	}
	res.Propiedad = &prop
	res.Huesped = &huesp

	pagos, err := r.getPagosByReservaID(ctx, id)
	if err == nil {
		res.Pagos = pagos
	} else {
		res.Pagos = []AdminPagoReserva{}
	}

	timeline, err := r.getTimelineByReservaID(ctx, id)
	if err == nil {
		res.Timeline = timeline
	} else {
		res.Timeline = []AdminTimelineEntry{}
	}

	return &res, nil
}

func (r *AdminRepo) getPagosByReservaID(ctx context.Context, reservaID string) ([]AdminPagoReserva, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.monto, p.moneda, p.metodo_pago, COALESCE(p.referencia,''), p.comprobante,
			p.estado, p.fecha_creacion, p.fecha_verificacion, p.notas_verificacion
		FROM pagos p
		WHERE p.reserva_id = $1
		ORDER BY p.fecha_creacion DESC`, reservaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pagos []AdminPagoReserva
	for rows.Next() {
		var p AdminPagoReserva
		if err := rows.Scan(
			&p.ID, &p.Monto, &p.Moneda, &p.MetodoPago, &p.Referencia, &p.Comprobante,
			&p.Estado, &p.FechaCreacion, &p.FechaVerificacion, &p.NotasVerificacion,
		); err != nil {
			return nil, err
		}
		pagos = append(pagos, p)
	}
	if pagos == nil {
		pagos = []AdminPagoReserva{}
	}
	return pagos, nil
}

func (r *AdminRepo) getTimelineByReservaID(ctx context.Context, reservaID string) ([]AdminTimelineEntry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.accion, a.created_at, a.detalles,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,'')
		FROM admin_audit_log a
		LEFT JOIN usuarios u ON a.admin_id = u.id
		WHERE a.entidad_id = $1
		ORDER BY a.created_at DESC`, reservaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []AdminTimelineEntry
	for rows.Next() {
		var e AdminTimelineEntry
		var detallesJSON []byte
		var adminID, adminNombre, adminApellido, adminEmail string
		if err := rows.Scan(&e.Accion, &e.CreadoEn, &detallesJSON,
			&adminID, &adminNombre, &adminApellido, &adminEmail,
		); err != nil {
			return nil, err
		}
		if detallesJSON != nil {
			_ = json.Unmarshal(detallesJSON, &e.Detalles)
		}
		if e.Detalles == nil {
			e.Detalles = map[string]interface{}{}
		}
		if adminID != "" {
			e.Admin = &AdminTimelineAdmin{Nombre: adminNombre, Apellido: adminApellido, Email: adminEmail}
		}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []AdminTimelineEntry{}
	}
	return entries, nil
}
