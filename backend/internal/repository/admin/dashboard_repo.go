package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

func (r *AdminRepo) InsertAuditLog(ctx context.Context, adminID, accion, entidad string, entidadID *string, detalles interface{}, ip, userAgent *string) error {
	var detallesJSON interface{}
	if detalles != nil {
		b, err := json.Marshal(detalles)
		if err != nil {
			detallesJSON = nil
		} else {
			s := string(b)
			detallesJSON = s
		}
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO admin_audit_log (admin_id, accion, entidad, entidad_id, detalles, ip, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, adminID, accion, entidad, entidadID, detallesJSON, ip, userAgent)
	return err
}

func (r *AdminRepo) GetAuditLog(ctx context.Context, entidad, adminID, fechaInicio, fechaFin string, pagina, limite int) ([]AuditLog, int, error) {
	offset := (pagina - 1) * limite

	where := []string{}
	args := []interface{}{}
	argIdx := 1

	if entidad != "" && entidad != "TODOS" {
		where = append(where, fmt.Sprintf("a.entidad = $%d", argIdx))
		args = append(args, entidad)
		argIdx++
	}
	if adminID != "" {
		where = append(where, fmt.Sprintf("a.admin_id = $%d", argIdx))
		args = append(args, adminID)
		argIdx++
	}
	if fechaInicio != "" {
		where = append(where, fmt.Sprintf("a.created_at >= $%d", argIdx))
		args = append(args, fechaInicio)
		argIdx++
	}
	if fechaFin != "" {
		where = append(where, fmt.Sprintf("a.created_at <= $%d", argIdx))
		args = append(args, fechaFin+"T23:59:59")
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQ := fmt.Sprintf("SELECT COUNT(*) FROM admin_audit_log a %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`
		SELECT a.id, a.admin_id, a.accion, a.entidad, a.entidad_id, a.detalles, a.ip, a.user_agent, a.created_at,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,'')
		FROM admin_audit_log a
		LEFT JOIN usuarios u ON a.admin_id = u.id
		%s
		ORDER BY a.created_at DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIdx, argIdx+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []AuditLog
	for rows.Next() {
		var l AuditLog
		var adm AdminUserShort
		if err := rows.Scan(
			&l.ID, &l.AdminID, &l.Accion, &l.Entidad, &l.EntidadID, &l.Detalles, &l.IP, &l.UserAgent, &l.CreatedAt,
			&adm.ID, &adm.Nombre, &adm.Apellido, &adm.Email,
		); err != nil {
			return nil, 0, err
		}
		l.Admin = &adm
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []AuditLog{}
	}
	return logs, total, nil
}

func (r *AdminRepo) GetNotificacionesAdmin(ctx context.Context, pagina, limite int) ([]Notificacion, int, error) {
	offset := (pagina - 1) * limite

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM notificaciones WHERE tipo = 'SISTEMA'`).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT n.id, n.titulo, n.mensaje, n.leida, n.url_accion, n.fecha_creacion,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,'')
		FROM notificaciones n
		LEFT JOIN usuarios u ON n.usuario_id = u.id
		WHERE n.tipo = 'SISTEMA'
		ORDER BY n.fecha_creacion DESC
		LIMIT $1 OFFSET $2`, limite, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var notifs []Notificacion
	for rows.Next() {
		var n Notificacion
		var usr AdminUserShort
		if err := rows.Scan(
			&n.ID, &n.Titulo, &n.Mensaje, &n.Leida, &n.URLAccion, &n.FechaCreacion,
			&usr.ID, &usr.Nombre, &usr.Apellido, &usr.Email,
		); err != nil {
			return nil, 0, err
		}
		n.Usuario = &usr
		notifs = append(notifs, n)
	}
	if notifs == nil {
		notifs = []Notificacion{}
	}
	return notifs, total, nil
}

func (r *AdminRepo) EnviarNotificacion(ctx context.Context, usuarioID, titulo, mensaje string, urlAccion *string) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO notificaciones (tipo, titulo, mensaje, url_accion, usuario_id) VALUES ('SISTEMA', $1, $2, $3, $4)`,
		titulo, mensaje, urlAccion, usuarioID)
	return err
}

func (r *AdminRepo) EnviarNotificacionBroadcast(ctx context.Context, titulo, mensaje string, urlAccion *string) (int, error) {
	tag, err := r.pool.Exec(ctx, `
		INSERT INTO notificaciones (tipo, titulo, mensaje, url_accion, usuario_id)
		SELECT 'SISTEMA', $1, $2, $3, id FROM usuarios WHERE activo = true
	`, titulo, mensaje, urlAccion)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}

func (r *AdminRepo) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	now := time.Now()
	inicioSemana := time.Date(now.Year(), now.Month(), now.Day()-int(now.Weekday()), 0, 0, 0, 0, now.Location())
	inicioMes := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	inicioMesPasado := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())

	var usuariosTotal, propTotal, propPublicadas, resTotal, resPendientes int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM usuarios WHERE activo = true`).Scan(&usuariosTotal)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM propiedades`).Scan(&propTotal)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM propiedades WHERE estado_publicacion = 'PUBLICADA'`).Scan(&propPublicadas)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reservas`).Scan(&resTotal)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reservas WHERE estado = 'PENDIENTE'`).Scan(&resPendientes)

	var usuariosNuevosSemana int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM usuarios WHERE fecha_registro >= $1`, inicioSemana).Scan(&usuariosNuevosSemana)

	var resMes, resMesPasado int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reservas WHERE fecha_creacion >= $1`, inicioMes).Scan(&resMes)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reservas WHERE fecha_creacion >= $1 AND fecha_creacion < $2`, inicioMesPasado, inicioMes).Scan(&resMesPasado)

	crecimientoReservas := 0
	if resMesPasado > 0 {
		crecimientoReservas = int(float64(resMes-resMesPasado) / float64(resMesPasado) * 100)
	}

	var ingresosMes, ingresosMesPasado float64
	r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado IN ('VERIFICADO','ACREDITADO') AND fecha_creacion >= $1`, inicioMes).Scan(&ingresosMes)
	r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado IN ('VERIFICADO','ACREDITADO') AND fecha_creacion >= $1 AND fecha_creacion < $2`, inicioMesPasado, inicioMes).Scan(&ingresosMesPasado)

	crecimientoIngresos := 0
	if ingresosMesPasado > 0 {
		crecimientoIngresos = int((ingresosMes - ingresosMesPasado) / ingresosMesPasado * 100)
	}

	resHoy := []interface{}{}
	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.codigo, r.total, r.noches, r.cantidad_huespedes, r.moneda,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''),
			COALESCE(p.titulo,'')
		FROM reservas r
		LEFT JOIN usuarios u ON r.huesped_id = u.id
		LEFT JOIN propiedades p ON r.propiedad_id = p.id
		WHERE r.fecha_entrada = $1 AND r.estado IN ('CONFIRMADA','EN_CURSO')
		ORDER BY r.fecha_creacion DESC`, now.Format("2006-01-02"))
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, codigo, moneda, uid, unombre, uapellido, ptitulo string
			var total float64
			var noches, ch int
			if err := rows.Scan(&id, &codigo, &total, &noches, &ch, &moneda, &uid, &unombre, &uapellido, &ptitulo); err == nil {
				resHoy = append(resHoy, map[string]interface{}{
					"id": id, "codigo": codigo, "total": total, "noches": noches,
					"cantidad_huespedes": ch, "moneda": moneda,
					"huesped":   map[string]string{"nombre": unombre, "apellido": uapellido},
					"propiedad": map[string]string{"titulo": ptitulo},
				})
			}
		}
	}

	ingresosByMonth := []map[string]interface{}{}
	irows, err := r.pool.Query(ctx, `
		SELECT TO_CHAR(d, 'Mon') as name, COALESCE(SUM(p.monto), 0) as ingresos
		FROM generate_series(NOW() - INTERVAL '11 months', NOW(), INTERVAL '1 month') d
		LEFT JOIN pagos p ON DATE_TRUNC('month', p.fecha_creacion) = DATE_TRUNC('month', d) AND p.estado IN ('VERIFICADO','ACREDITADO')
		GROUP BY d ORDER BY d`)
	if err == nil {
		defer irows.Close()
		for irows.Next() {
			var name string
			var ing float64
			if err := irows.Scan(&name, &ing); err == nil {
				ingresosByMonth = append(ingresosByMonth, map[string]interface{}{"name": name, "ingresos": ing})
			}
		}
	}

	reservasByStatus := []map[string]interface{}{}
	statusColors := map[string]string{
		"PENDIENTE": "#F59E0B", "CONFIRMADA": "#52B788", "EN_CURSO": "#3B82F6",
		"COMPLETADA": "#9E9892", "CANCELADA_HUESPED": "#EF4444", "CANCELADA_ANFITRION": "#EF4444", "RECHAZADA": "#EF4444",
	}
	srows, err := r.pool.Query(ctx, `SELECT estado, COUNT(*) FROM reservas GROUP BY estado`)
	if err == nil {
		defer srows.Close()
		for srows.Next() {
			var estado string
			var count int
			if err := srows.Scan(&estado, &count); err == nil {
				fill, ok := statusColors[estado]
				if !ok {
					fill = "#9E9892"
				}
				reservasByStatus = append(reservasByStatus, map[string]interface{}{"name": estado, "value": count, "fill": fill})
			}
		}
	}

	propiedadesByCiudad := []map[string]interface{}{}
	prows, err := r.pool.Query(ctx, `SELECT ciudad, COUNT(*) as value FROM propiedades WHERE estado_publicacion = 'PUBLICADA' GROUP BY ciudad ORDER BY value DESC LIMIT 10`)
	if err == nil {
		defer prows.Close()
		for prows.Next() {
			var name string
			var val int
			if err := prows.Scan(&name, &val); err == nil {
				propiedadesByCiudad = append(propiedadesByCiudad, map[string]interface{}{"name": name, "value": val})
			}
		}
	}

	usersByDay := []map[string]interface{}{}
	urows, err := r.pool.Query(ctx, `
		SELECT TO_CHAR(d, 'DD Mon') as name, COUNT(u.id) as usuarios
		FROM generate_series(NOW() - INTERVAL '13 days', NOW(), INTERVAL '1 day') d
		LEFT JOIN usuarios u ON DATE(u.fecha_registro) = d::date
		GROUP BY d ORDER BY d`)
	if err == nil {
		defer urows.Close()
		for urows.Next() {
			var name string
			var count int
			if err := urows.Scan(&name, &count); err == nil {
				usersByDay = append(usersByDay, map[string]interface{}{"name": name, "usuarios": count})
			}
		}
	}

	reservasRecientes := []interface{}{}
	rrows, err := r.pool.Query(ctx, `
		SELECT r.id, r.codigo, r.total, r.estado, r.moneda,
			r.fecha_entrada, r.fecha_salida, r.fecha_creacion,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''),
			COALESCE(p.titulo,'')
		FROM reservas r
		LEFT JOIN usuarios u ON r.huesped_id = u.id
		LEFT JOIN propiedades p ON r.propiedad_id = p.id
		ORDER BY r.fecha_creacion DESC LIMIT 5`)
	if err == nil {
		defer rrows.Close()
		for rrows.Next() {
			var id, codigo, estado, moneda, uid, unombre, uapellido, ptitulo string
			var total float64
			var fentrada, fsalida, fcreacion time.Time
			if err := rrows.Scan(&id, &codigo, &total, &estado, &moneda, &fentrada, &fsalida, &fcreacion, &uid, &unombre, &uapellido, &ptitulo); err == nil {
				reservasRecientes = append(reservasRecientes, map[string]interface{}{
					"id": id, "codigo": codigo, "total": total, "estado": estado, "moneda": moneda,
					"fecha_entrada": fentrada.Format("2006-01-02"), "fecha_salida": fsalida.Format("2006-01-02"),
					"huesped":   map[string]string{"nombre": unombre, "apellido": uapellido},
					"propiedad": map[string]string{"titulo": ptitulo},
				})
			}
		}
	}

	actividad := []interface{}{}
	arows, err := r.pool.Query(ctx, `
		SELECT a.id, a.accion, a.entidad, a.created_at,
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,'')
		FROM admin_audit_log a
		LEFT JOIN usuarios u ON a.admin_id = u.id
		ORDER BY a.created_at DESC LIMIT 5`)
	if err == nil {
		defer arows.Close()
		for arows.Next() {
			var id, accion, entidad, uid, unombre, uapellido string
			var createdAt time.Time
			if err := arows.Scan(&id, &accion, &entidad, &createdAt, &uid, &unombre, &uapellido); err == nil {
				actividad = append(actividad, map[string]interface{}{
					"id": id, "accion": accion, "entidad": entidad,
					"created_at": createdAt.Format(time.RFC3339),
					"admin":      map[string]string{"nombre": unombre, "apellido": uapellido},
				})
			}
		}
	}

	return map[string]interface{}{
		"usuarios":            map[string]interface{}{"total": usuariosTotal, "nuevosSemana": usuariosNuevosSemana},
		"propiedades":         map[string]interface{}{"total": propTotal, "publicadas": propPublicadas},
		"reservas":            map[string]interface{}{"total": resTotal, "pendientes": resPendientes, "hoy": resHoy},
		"pagos":               map[string]interface{}{"ingresosMes": ingresosMes, "ingresosMesPasado": ingresosMesPasado, "crecimientoIngresos": crecimientoIngresos},
		"crecimientoReservas": crecimientoReservas,
		"ingresosByMonth":     ingresosByMonth,
		"reservasByStatus":    reservasByStatus,
		"propiedadesByCiudad": propiedadesByCiudad,
		"usersByDay":          usersByDay,
		"reservasRecientes":   reservasRecientes,
		"actividad":           actividad,
	}, nil
}
