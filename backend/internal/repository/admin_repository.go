package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepo struct {
	pool *pgxpool.Pool
}

func NewAdminRepo(pool *pgxpool.Pool) *AdminRepo {
	return &AdminRepo{pool: pool}
}

type AdminUser struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Nombre    string    `json:"nombre"`
	Apellido  string    `json:"apellido"`
	Telefono  *string   `json:"telefono"`
	Cedula    *string   `json:"cedula"`
	AvatarURL *string   `json:"avatar_url"`
	Verificado bool     `json:"verificado"`
	Rol       string    `json:"rol"`
	Activo    bool      `json:"activo"`
	FechaRegistro time.Time `json:"fecha_registro"`
}

type AdminReserva struct {
	ID                string    `json:"id"`
	Codigo            string    `json:"codigo"`
	FechaEntrada      time.Time `json:"fecha_entrada"`
	FechaSalida       time.Time `json:"fecha_salida"`
	Noches            int       `json:"noches"`
	PrecioPorNoche    float64   `json:"precio_por_noche"`
	Subtotal          float64   `json:"subtotal"`
	ComisionPlataforma float64  `json:"comision_plataforma"`
	Total             float64   `json:"total"`
	Moneda            string    `json:"moneda"`
	Estado            string    `json:"estado"`
	CantidadHuespedes int       `json:"cantidad_huespedes"`
	NotasHuesped      *string   `json:"notas_huesped"`
	NotasInternas     *string   `json:"notas_internas"`
	FechaCreacion     time.Time `json:"fecha_creacion"`
	FechaConfirmacion *time.Time `json:"fecha_confirmacion"`
	FechaCancelacion  *time.Time `json:"fecha_cancelacion"`
	Propiedad         *AdminPropiedadShort `json:"propiedad"`
	Huesped           *AdminUserShort      `json:"huesped"`
}

type AdminPropiedadShort struct {
	ID      string  `json:"id"`
	Titulo  string  `json:"titulo"`
	Slug    string  `json:"slug"`
	Ciudad  string  `json:"ciudad"`
	Estado  string  `json:"estado"`
}

type AdminUserShort struct {
	ID        string  `json:"id"`
	Nombre    string  `json:"nombre"`
	Apellido  string  `json:"apellido"`
	Email     string  `json:"email"`
	AvatarURL *string `json:"avatar_url"`
}

type AdminPago struct {
	ID                string     `json:"id"`
	Monto             float64    `json:"monto"`
	Moneda            string     `json:"moneda"`
	MontoEquivalente  *float64   `json:"monto_equivalente"`
	MonedaEquivalente *string    `json:"moneda_equivalente"`
	TasaCambio        *float64   `json:"tasa_cambio"`
	MetodoPago        string     `json:"metodo_pago"`
	Referencia        string     `json:"referencia"`
	Comprobante       *string    `json:"comprobante"`
	Estado            string     `json:"estado"`
	FechaCreacion     time.Time  `json:"fecha_creacion"`
	FechaVerificacion *time.Time `json:"fecha_verificacion"`
	FechaAcreditacion *time.Time `json:"fecha_acreditacion"`
	NotasVerificacion *string    `json:"notas_verificacion"`
	Reserva           *AdminReservaShort `json:"reserva"`
	Usuario           *AdminUserShort    `json:"usuario"`
}

type AdminReservaShort struct {
	ID      string `json:"id"`
	Codigo  string `json:"codigo"`
	Estado  string `json:"estado"`
}

type AdminPropiedad struct {
	ID               string    `json:"id"`
	Titulo           string    `json:"titulo"`
	Slug             string    `json:"slug"`
	TipoPropiedad    string    `json:"tipo_propiedad"`
	PrecioPorNoche   float64   `json:"precio_por_noche"`
	Moneda           string    `json:"moneda"`
	CapacidadMaxima  int       `json:"capacidad_maxima"`
	Habitaciones     *int      `json:"habitaciones"`
	Banos            *int      `json:"banos"`
	Camas            *int      `json:"camas"`
	Ciudad           string    `json:"ciudad"`
	Estado           string    `json:"estado"`
	Direccion        *string   `json:"direccion"`
	EstadoPublicacion string   `json:"estado_publicacion"`
	Destacada        bool      `json:"destacada"`
	FechaPublicacion *time.Time `json:"fecha_publicacion"`
	FechaActualizacion time.Time `json:"fecha_actualizacion"`
	VistasTotales    int       `json:"vistas_totales"`
	RatingPromedio   float64   `json:"rating_promedio"`
	TotalResenas     int       `json:"total_resenas"`
	Propietario      *AdminUserShort `json:"propietario"`
}

type AdminResena struct {
	ID           string     `json:"id"`
	Calificacion int        `json:"calificacion"`
	Limpieza     *int       `json:"limpieza"`
	Comunicacion *int       `json:"comunicacion"`
	Ubicacion    *int       `json:"ubicacion"`
	Valor        *int       `json:"valor"`
	Comentario   string     `json:"comentario"`
	Respuesta    *string    `json:"respuesta"`
	FechaCreacion time.Time `json:"fecha_creacion"`
	FechaRespuesta *time.Time `json:"fecha_respuesta"`
	Oculta       bool       `json:"oculta"`
	Propiedad    *AdminPropiedadShort `json:"propiedad"`
	Autor        *AdminUserShort      `json:"autor"`
	Reserva      *AdminReservaShort   `json:"reserva"`
}

type Cupon struct {
	ID                string     `json:"id"`
	Codigo            string     `json:"codigo"`
	Nombre            string     `json:"nombre"`
	Descripcion       *string    `json:"descripcion"`
	TipoDescuento     string     `json:"tipo_descuento"`
	ValorDescuento    float64    `json:"valor_descuento"`
	Moneda            string     `json:"moneda"`
	MaxDescuento      *float64   `json:"max_descuento"`
	TipoAplicacion    string     `json:"tipo_aplicacion"`
	ValorAplicacion   *string    `json:"valor_aplicacion"`
	MinCompra         *float64   `json:"min_compra"`
	MinNoches         *int       `json:"min_noches"`
	MaxUsos           *int       `json:"max_usos"`
	MaxUsosPorUsuario int        `json:"max_usos_por_usuario"`
	UsosActuales      int        `json:"usos_actuales"`
	FechaInicio       time.Time  `json:"fecha_inicio"`
	FechaFin          time.Time  `json:"fecha_fin"`
	Activo            bool       `json:"activo"`
	CreadoPor         *string    `json:"creado_por"`
	FechaCreacion     time.Time  `json:"fecha_creacion"`
}

type CuponUso struct {
	ID              string    `json:"id"`
	CuponID         string    `json:"cupon_id"`
	UsuarioID       string    `json:"usuario_id"`
	ReservaID       string    `json:"reserva_id"`
	DescuentoAplicado float64  `json:"descuento_aplicado"`
	FechaUso        time.Time `json:"fecha_uso"`
	Usuario         *AdminUserShort `json:"usuario"`
	Cupon           *CuponShort     `json:"cupon"`
	Reserva         *AdminReservaShort `json:"reserva"`
}

type CuponShort struct {
	Codigo string `json:"codigo"`
	Nombre string `json:"nombre"`
}

type AuditLog struct {
	ID         string     `json:"id"`
	AdminID    string     `json:"admin_id"`
	Accion     string     `json:"accion"`
	Entidad    string     `json:"entidad"`
	EntidadID  *string    `json:"entidad_id"`
	Detalles   *string    `json:"detalles"`
	IP         *string    `json:"ip"`
	UserAgent  *string    `json:"user_agent"`
	CreatedAt  time.Time  `json:"created_at"`
	Admin      *AdminUserShort `json:"admin"`
}

type Notificacion struct {
	ID           string     `json:"id"`
	Tipo         string     `json:"tipo"`
	Titulo       string     `json:"titulo"`
	Mensaje      string     `json:"mensaje"`
	Leida        bool       `json:"leida"`
	URLAccion    *string    `json:"url_accion"`
	FechaCreacion time.Time `json:"fecha_creacion"`
	Usuario      *AdminUserShort `json:"usuario"`
}

func (r *AdminRepo) GetReservasAdmin(ctx context.Context, estado, busqueda string, pagina, limite int) ([]AdminReserva, int, error) {
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

	var reservas []AdminReserva
	for rows.Next() {
		var res AdminReserva
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
		reservas = []AdminReserva{}
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
	var prop AdminPropiedadShort
	var huesp AdminUserShort
	err := r.pool.QueryRow(ctx, `
		SELECT r.id, r.codigo, r.estado
		FROM reservas r WHERE r.id = $1`, id).Scan(&res.ID, &res.Codigo, &res.Estado)
	if err != nil {
		return nil, err
	}
	_ = prop
	_ = huesp
	return &res, nil
}

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

func (r *AdminRepo) GetPropiedadesAdmin(ctx context.Context, estado, ciudad, busqueda string, pagina, limite int) ([]AdminPropiedad, int, error) {
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
			COALESCE(pr.calificacion, 0), COALESCE(pr.cantidad_resenas, 0),
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM propiedades pr
		LEFT JOIN usuarios u ON pr.propietario_id = u.id
		%s}
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
				if key == "comision_huesped" {
					result["huesped"] = v
				} else if key == "comision_anfitrion" {
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
	rows, err := r.pool.Query(ctx, `SELECT id FROM usuarios WHERE activo = true`)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		ids = append(ids, id)
	}

	for _, id := range ids {
		if err := r.EnviarNotificacion(ctx, id, titulo, mensaje, urlAccion); err != nil {
			return 0, err
		}
	}
	return len(ids), nil
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
					"huesped": map[string]string{"nombre": unombre, "apellido": uapellido},
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
					"huesped": map[string]string{"nombre": unombre, "apellido": uapellido},
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
					"admin": map[string]string{"nombre": unombre, "apellido": uapellido},
				})
			}
		}
	}

	return map[string]interface{}{
		"usuarios":           map[string]interface{}{"total": usuariosTotal, "nuevosSemana": usuariosNuevosSemana},
		"propiedades":        map[string]interface{}{"total": propTotal, "publicadas": propPublicadas},
		"reservas":           map[string]interface{}{"total": resTotal, "pendientes": resPendientes, "hoy": resHoy},
		"pagos":              map[string]interface{}{"ingresosMes": ingresosMes, "ingresosMesPasado": ingresosMesPasado, "crecimientoIngresos": crecimientoIngresos},
		"crecimientoReservas": crecimientoReservas,
		"ingresosByMonth":    ingresosByMonth,
		"reservasByStatus":   reservasByStatus,
		"propiedadesByCiudad": propiedadesByCiudad,
		"usersByDay":         usersByDay,
		"reservasRecientes":  reservasRecientes,
		"actividad":          actividad,
	}, nil
}

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
		SELECT u.id, u.email, u.nombre, u.apellido, u.telefono, u.cedula, u.foto_url,
		       u.verificado, u.rol, COALESCE(u.activo, true), u.fecha_registro
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

func (r *AdminRepo) GetPropiedadByIDAdmin(ctx context.Context, id string) (*AdminPropiedad, error) {
	var p AdminPropiedad
	var owner AdminUserShort
	err := r.pool.QueryRow(ctx, `
		SELECT pr.id, pr.titulo, pr.slug, pr.tipo_propiedad, pr.precio_por_noche, pr.moneda,
		       COALESCE(pr.capacidad_maxima, pr.capacidad, 1), pr.ciudad, pr.estado, pr.estado_publicacion,
		       COALESCE(pr.destacada, false), pr.fecha_actualizacion,
		       COALESCE(pr.vistas_totales, 0), COALESCE(pr.calificacion, 0), COALESCE(pr.cantidad_resenas, 0),
		       COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM propiedades pr
		LEFT JOIN usuarios u ON pr.propietario_id = u.id
		WHERE pr.id = $1`, id).Scan(
		&p.ID, &p.Titulo, &p.Slug, &p.TipoPropiedad, &p.PrecioPorNoche, &p.Moneda,
		&p.CapacidadMaxima, &p.Ciudad, &p.Estado, &p.EstadoPublicacion,
		&p.Destacada, &p.FechaActualizacion, &p.VistasTotales,
		&p.RatingPromedio, &p.TotalResenas,
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

	return map[string]interface{}{
		"totalReservas": totalReservas,
		"confirmadas":   confirmadas,
		"noches":        noches,
		"ingresos":      ingresos,
	}, nil
}

func (r *AdminRepo) GetReservaByIDFull(ctx context.Context, id string) (*AdminReserva, error) {
	var res AdminReserva
	var prop AdminPropiedadShort
	var huesp AdminUserShort
	err := r.pool.QueryRow(ctx, `
		SELECT r.id, r.codigo, r.fecha_entrada, r.fecha_salida, r.noches,
			r.precio_por_noche, r.subtotal, r.comision_plataforma, r.total, r.moneda,
			r.estado, r.cantidad_huespedes, r.notas_huesped, r.notas_internas,
			r.fecha_creacion, r.fecha_confirmacion, r.fecha_cancelacion,
			COALESCE(p.id,''), COALESCE(p.titulo,''), COALESCE(p.slug,''), COALESCE(p.ciudad,''), COALESCE(p.estado,''),
			COALESCE(u.id,''), COALESCE(u.nombre,''), COALESCE(u.apellido,''), COALESCE(u.email,''), u.avatar_url
		FROM reservas r
		LEFT JOIN propiedades p ON r.propiedad_id = p.id
		LEFT JOIN usuarios u ON r.huesped_id = u.id
		WHERE r.id = $1`, id).Scan(
		&res.ID, &res.Codigo, &res.FechaEntrada, &res.FechaSalida, &res.Noches,
		&res.PrecioPorNoche, &res.Subtotal, &res.ComisionPlataforma, &res.Total, &res.Moneda,
		&res.Estado, &res.CantidadHuespedes, &res.NotasHuesped, &res.NotasInternas,
		&res.FechaCreacion, &res.FechaConfirmacion, &res.FechaCancelacion,
		&prop.ID, &prop.Titulo, &prop.Slug, &prop.Ciudad, &prop.Estado,
		&huesp.ID, &huesp.Nombre, &huesp.Apellido, &huesp.Email, &huesp.AvatarURL,
	)
	if err != nil {
		return nil, err
	}
	res.Propiedad = &prop
	res.Huesped = &huesp
	return &res, nil
}
