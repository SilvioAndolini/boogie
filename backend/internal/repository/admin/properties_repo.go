package admin

import (
	"context"
	"fmt"
	"strings"
	"time"
)

func (r *AdminRepo) GetPropiedadesAdmin(ctx context.Context, estado, ciudad, busqueda, categoria string, pagina, limite int) ([]AdminPropiedad, int, error) {
	offset := (pagina - 1) * limite

	where := []string{}
	args := []interface{}{}
	argIdx := 1

	if estado != "" {
		where = append(where, fmt.Sprintf("pr.estado_publicacion = $%d", argIdx))
		args = append(args, estado)
		argIdx++
	}
	if ciudad != "" {
		where = append(where, fmt.Sprintf("pr.ciudad = $%d", argIdx))
		args = append(args, ciudad)
		argIdx++
	}
	if busqueda != "" {
		where = append(where, fmt.Sprintf("(pr.titulo ILIKE $%d OR pr.ciudad ILIKE $%d OR pr.estado ILIKE $%d)", argIdx, argIdx+1, argIdx+2))
		args = append(args, "%"+busqueda+"%", "%"+busqueda+"%", "%"+busqueda+"%")
		argIdx += 3
	}
	if categoria != "" {
		where = append(where, fmt.Sprintf("pr.categoria = $%d", argIdx))
		args = append(args, categoria)
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQ := fmt.Sprintf("SELECT COUNT(*) FROM propiedades pr %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`
		SELECT pr.id, pr.titulo, pr.slug, pr.tipo_propiedad, pr.precio_por_noche, pr.moneda,
			pr.capacidad_maxima, pr.ciudad, pr.estado, pr.estado_publicacion, pr.destacada,
			pr.fecha_actualizacion, pr.vistas_totales,
			COALESCE(pr.rating_promedio, 0), COALESCE(pr.total_resenas, 0),
			COALESCE((SELECT json_agg(json_build_object('url', ip.url, 'es_principal', ip.es_principal) ORDER BY ip.orden)
				FROM imagenes_propiedad ip WHERE ip.propiedad_id = pr.id), '[]'::json),
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM propiedades pr
		LEFT JOIN usuarios u ON pr.propietario_id = u.id
		%s
		ORDER BY pr.fecha_actualizacion DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIdx, argIdx+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var props []AdminPropiedad
	for rows.Next() {
		var p AdminPropiedad
		var owner AdminUserShort
		if err := rows.Scan(
			&p.ID, &p.Titulo, &p.Slug, &p.TipoPropiedad, &p.PrecioPorNoche, &p.Moneda,
			&p.CapacidadMaxima, &p.Ciudad, &p.Estado, &p.EstadoPublicacion, &p.Destacada,
			&p.FechaActualizacion, &p.VistasTotales,
			&p.RatingPromedio, &p.TotalResenas,
			&p.Imagenes,
			&owner.ID, &owner.Nombre, &owner.Apellido, &owner.Email, &owner.AvatarURL,
		); err != nil {
			return nil, 0, err
		}
		p.Propietario = &owner
		props = append(props, p)
	}
	if props == nil {
		props = []AdminPropiedad{}
	}
	return props, total, nil
}

func (r *AdminRepo) UpdatePropiedadAdmin(ctx context.Context, propiedadID, estadoPublicacion string, destacada *bool) error {
	if estadoPublicacion == "" && destacada == nil {
		return fmt.Errorf("no se proporcionaron campos para actualizar")
	}
	if estadoPublicacion != "" && destacada == nil {
		_, err := r.pool.Exec(ctx, `UPDATE propiedades SET estado_publicacion = $1, fecha_actualizacion = NOW() WHERE id = $2`,
			estadoPublicacion, propiedadID)
		return err
	}
	if destacada != nil && estadoPublicacion == "" {
		_, err := r.pool.Exec(ctx, `UPDATE propiedades SET destacada = $1, fecha_actualizacion = NOW() WHERE id = $2`,
			*destacada, propiedadID)
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE propiedades SET estado_publicacion = $1, destacada = $2, fecha_actualizacion = NOW() WHERE id = $3`,
		estadoPublicacion, *destacada, propiedadID)
	return err
}

func (r *AdminRepo) DeletePropiedad(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM propiedades WHERE id = $1`, id)
	return err
}

func (r *AdminRepo) GetPropiedadByIDAdmin(ctx context.Context, id string) (*AdminPropiedad, error) {
	var p AdminPropiedad
	var owner AdminUserShort
	err := r.pool.QueryRow(ctx, `
		SELECT pr.id, pr.titulo, pr.slug, pr.tipo_propiedad, pr.precio_por_noche, pr.moneda,
		       COALESCE(pr.capacidad_maxima, 1), pr.ciudad, pr.estado, pr.estado_publicacion,
		       COALESCE(pr.destacada, false), pr.fecha_actualizacion,
		       COALESCE(pr.vistas_totales, 0), COALESCE(pr.rating_promedio, 0), COALESCE(pr.total_resenas, 0),
		       COALESCE((SELECT json_agg(json_build_object('url', ip.url, 'es_principal', ip.es_principal) ORDER BY ip.orden)
				FROM imagenes_propiedad ip WHERE ip.propiedad_id = pr.id), '[]'::json),
		       COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM propiedades pr
		LEFT JOIN usuarios u ON pr.propietario_id = u.id
		WHERE pr.id = $1`, id).Scan(
		&p.ID, &p.Titulo, &p.Slug, &p.TipoPropiedad, &p.PrecioPorNoche, &p.Moneda,
		&p.CapacidadMaxima, &p.Ciudad, &p.Estado, &p.EstadoPublicacion,
		&p.Destacada, &p.FechaActualizacion, &p.VistasTotales,
		&p.RatingPromedio, &p.TotalResenas,
		&p.Imagenes,
		&owner.ID, &owner.Nombre, &owner.Apellido, &owner.Email, &owner.AvatarURL,
	)
	if err != nil {
		return nil, err
	}
	p.Propietario = &owner
	return &p, nil
}

func (r *AdminRepo) GetCiudades(ctx context.Context) ([]string, error) {
	rows, err := r.pool.Query(ctx, `SELECT DISTINCT ciudad FROM propiedades WHERE ciudad != '' ORDER BY ciudad`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ciudades []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			continue
		}
		ciudades = append(ciudades, c)
	}
	if ciudades == nil {
		ciudades = []string{}
	}
	return ciudades, nil
}

func (r *AdminRepo) GetPropiedadIngresos(ctx context.Context, id string) (map[string]interface{}, error) {
	var totalReservas, noches, confirmadas int
	var ingresos float64
	r.pool.QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(noches), 0), COALESCE(SUM(CASE WHEN estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA') THEN total ELSE 0 END), 0),
		       COUNT(*) FILTER (WHERE estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA'))
		FROM reservas WHERE propiedad_id = $1`, id).Scan(&totalReservas, &noches, &ingresos, &confirmadas)

	var ingresosMes, ingresosMesPasado float64
	now := time.Now()
	inicioMes := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	inicioMesPasado := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())
	r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(total), 0) FROM reservas WHERE propiedad_id = $1 AND estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA') AND fecha_creacion >= $2`, id, inicioMes).Scan(&ingresosMes)
	r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(total), 0) FROM reservas WHERE propiedad_id = $1 AND estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA') AND fecha_creacion >= $2 AND fecha_creacion < $3`, id, inicioMesPasado, inicioMes).Scan(&ingresosMesPasado)

	crecimiento := 0
	if ingresosMesPasado > 0 {
		crecimiento = int((ingresosMes - ingresosMesPasado) / ingresosMesPasado * 100)
	}

	var comisionPlat, comisionAnf float64
	r.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(comision_plataforma), 0), COALESCE(SUM(comision_anfitrion), 0)
		FROM reservas WHERE propiedad_id = $1 AND estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA')`, id).Scan(&comisionPlat, &comisionAnf)
	var totalHuespedes int
	r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(cantidad_huespedes), 0) FROM reservas WHERE propiedad_id = $1 AND estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA')`, id).Scan(&totalHuespedes)

	var tarifaPromedio float64
	if noches > 0 {
		tarifaPromedio = ingresos / float64(noches)
	}

	ingresosByMonth := []map[string]interface{}{}
	irows, err := r.pool.Query(ctx, `
		SELECT TO_CHAR(d, 'Mon') as name,
			COALESCE(SUM(r.total), 0) as ingresos,
			COALESCE(SUM(r.comision_plataforma), 0) as comisiones
		FROM generate_series(NOW() - INTERVAL '11 months', NOW(), INTERVAL '1 month') d
		LEFT JOIN reservas r ON DATE_TRUNC('month', r.fecha_creacion) = DATE_TRUNC('month', d) AND r.propiedad_id = $1 AND r.estado IN ('CONFIRMADA','EN_CURSO','COMPLETADA')
		GROUP BY d ORDER BY d`, id)
	if err == nil {
		defer irows.Close()
		for irows.Next() {
			var name string
			var ing, com float64
			if err := irows.Scan(&name, &ing, &com); err == nil {
				ingresosByMonth = append(ingresosByMonth, map[string]interface{}{"name": name, "ingresos": ing, "comisiones": com})
			}
		}
	}

	reservas := []interface{}{}
	rrows, err := r.pool.Query(ctx, `
		SELECT r.id, r.codigo, r.total, r.moneda, r.estado, r.noches, r.cantidad_huespedes,
			r.fecha_entrada, r.fecha_salida, r.fecha_creacion,
			COALESCE(u.nombre,''), COALESCE(u.apellido,'')
		FROM reservas r
		LEFT JOIN usuarios u ON r.huesped_id = u.id
		WHERE r.propiedad_id = $1
		ORDER BY r.fecha_creacion DESC LIMIT 50`, id)
	if err == nil {
		defer rrows.Close()
		for rrows.Next() {
			var rid, codigo, moneda, estado, unombre, uapellido string
			var total float64
			var nochesR, ch int
			var fentrada, fsalida, fcreacion time.Time
			if err := rrows.Scan(&rid, &codigo, &total, &moneda, &estado, &nochesR, &ch, &fentrada, &fsalida, &fcreacion, &unombre, &uapellido); err == nil {
				reservas = append(reservas, map[string]interface{}{
					"id": rid, "codigo": codigo, "total": total, "moneda": moneda, "estado": estado,
					"noches": nochesR, "cantidad_huespedes": ch,
					"fecha_entrada": fentrada.Format("2006-01-02"), "fecha_salida": fsalida.Format("2006-01-02"),
					"fecha_creacion": fcreacion.Format(time.RFC3339),
					"huesped":        map[string]string{"nombre": unombre, "apellido": uapellido},
				})
			}
		}
	}

	return map[string]interface{}{
		"kpis": map[string]interface{}{
			"totalIngresos":            ingresos,
			"totalComisiones":          comisionPlat,
			"totalComisionesAnfitrion": comisionAnf,
			"ingresosNetos":            ingresos - comisionPlat - comisionAnf,
			"totalNoches":              noches,
			"totalHuespedes":           totalHuespedes,
			"tarifaPromedio":           tarifaPromedio,
			"totalReservas":            totalReservas,
			"ingresosMes":              ingresosMes,
			"ingresosMesPasado":        ingresosMesPasado,
			"crecimiento":              crecimiento,
		},
		"ingresosByMonth": ingresosByMonth,
		"reservas":        reservas,
	}, nil
}
