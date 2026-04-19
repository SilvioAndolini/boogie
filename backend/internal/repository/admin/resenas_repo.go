package admin

import (
	"context"
	"fmt"
	"strings"
)

func (r *AdminRepo) GetResenasAdmin(ctx context.Context, calificacionMin int, busqueda string, pagina, limite int) ([]AdminResena, int, error) {
	offset := (pagina - 1) * limite

	where := []string{}
	args := []interface{}{}
	argIdx := 1

	if calificacionMin > 0 {
		where = append(where, fmt.Sprintf("re.calificacion >= $%d", argIdx))
		args = append(args, calificacionMin)
		argIdx++
	}
	if busqueda != "" {
		where = append(where, fmt.Sprintf("re.comentario ILIKE $%d", argIdx))
		args = append(args, "%"+busqueda+"%")
		argIdx++
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQ := fmt.Sprintf("SELECT COUNT(*) FROM resenas re %s", whereClause)
	var total int
	if err := r.pool.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	q := fmt.Sprintf(`
		SELECT re.id, re.calificacion, re.comentario, re.respuesta,
			re.fecha_creacion, re.fecha_respuesta, re.oculta,
			COALESCE(p.id,''), COALESCE(p.titulo,''),
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM resenas re
		LEFT JOIN propiedades p ON re.propiedad_id = p.id
		LEFT JOIN usuarios u ON re.autor_id = u.id
		%s
		ORDER BY re.fecha_creacion DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIdx, argIdx+1)
	args = append(args, limite, offset)

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var resenas []AdminResena
	for rows.Next() {
		var re AdminResena
		var prop AdminPropiedadShort
		var autor AdminUserShort
		if err := rows.Scan(
			&re.ID, &re.Calificacion, &re.Comentario, &re.Respuesta,
			&re.FechaCreacion, &re.FechaRespuesta, &re.Oculta,
			&prop.ID, &prop.Titulo,
			&autor.ID, &autor.Nombre, &autor.Apellido, &autor.Email, &autor.AvatarURL,
		); err != nil {
			return nil, 0, err
		}
		if prop.ID != "" {
			re.Propiedad = &prop
		}
		if autor.ID != "" {
			re.Autor = &autor
		}
		resenas = append(resenas, re)
	}
	if resenas == nil {
		resenas = []AdminResena{}
	}
	return resenas, total, nil
}

func (r *AdminRepo) GetResenaStats(ctx context.Context) (int, float64, map[int]int, error) {
	var total int
	var promedio float64
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*), COALESCE(AVG(calificacion), 0) FROM resenas`).Scan(&total, &promedio)
	if err != nil {
		return 0, 0, nil, err
	}

	rows, err := r.pool.Query(ctx, `SELECT calificacion, COUNT(*) FROM resenas GROUP BY calificacion`)
	if err != nil {
		return 0, 0, nil, err
	}
	defer rows.Close()

	dist := map[int]int{1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
	for rows.Next() {
		var c, n int
		if err := rows.Scan(&c, &n); err == nil && c >= 1 && c <= 5 {
			dist[c] = n
		}
	}
	return total, promedio, dist, nil
}

func (r *AdminRepo) DeleteResena(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM resenas WHERE id = $1`, id)
	return err
}

func (r *AdminRepo) UpdateResenaOculta(ctx context.Context, id string, oculta bool) error {
	_, err := r.pool.Exec(ctx, `UPDATE resenas SET oculta = $1 WHERE id = $2`, oculta, id)
	return err
}
