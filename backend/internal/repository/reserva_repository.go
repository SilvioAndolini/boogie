package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/domain/idgen"
	bizerrors "github.com/boogie/backend/internal/domain/errors"
	"github.com/boogie/backend/internal/domain/models"
	"github.com/boogie/backend/internal/domain/util"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ReservaRepo struct {
	pool *pgxpool.Pool
}

func NewReservaRepo(pool *pgxpool.Pool) *ReservaRepo {
	return &ReservaRepo{pool: pool}
}

func (r *ReservaRepo) Pool() *pgxpool.Pool { return r.pool }

type ReservaDetalle struct {
	models.Reserva
	PropiedadTitulo     string
	PropiedadSlug       string
	PropietarioID       string
	PoliticaCancelacion string
	PropiedadDireccion  string
	PropiedadCiudad     string
	HuespedNombre       string
	HuespedApellido     string
	HuespedEmail        string
}

type ReservaConPropiedad struct {
	models.Reserva
	PropiedadTitulo          string  `json:"propiedad_titulo"`
	PropiedadSlug            string  `json:"propiedad_slug"`
	PropiedadDireccion       string  `json:"propiedad_direccion"`
	PropiedadCiudad          string  `json:"propiedad_ciudad"`
	PropiedadPoliticaCancel  string  `json:"propiedad_politica_cancelacion"`
	PropiedadImagenPrincipal *string `json:"propiedad_imagen_principal"`
	EstadoPago               string  `json:"estado_pago"`
}

type ReservaConHuesped struct {
	models.Reserva
	PropiedadTitulo          string  `json:"propiedad_titulo"`
	PropiedadSlug            string  `json:"propiedad_slug"`
	PropiedadImagenPrincipal *string `json:"propiedad_imagen_principal"`
	HuespedNombre            string  `json:"huesped_nombre"`
	HuespedApellido          string  `json:"huesped_apellido"`
	HuespedEmail             string  `json:"huesped_email"`
	HuespedAvatarURL         *string `json:"huesped_avatar_url"`
	EstadoPago               string  `json:"estado_pago"`
}

type ReservasStats struct {
	Pendientes  int `json:"pendientes"`
	Confirmadas int `json:"confirmadas"`
	EnCurso     int `json:"en_curso"`
	Completadas int `json:"completadas"`
	Canceladas  int `json:"canceladas"`
}

type PagoResumen struct {
	ID                  string     `json:"id"`
	Monto               float64    `json:"monto"`
	Moneda              string     `json:"moneda"`
	MetodoPago          string     `json:"metodo_pago"`
	Estado              string     `json:"estado"`
	Referencia          string     `json:"referencia"`
	Comprobante         *string    `json:"comprobante"`
	CryptoAddress       *string    `json:"crypto_address"`
	CryptoTxHash        *string    `json:"crypto_tx_hash"`
	CryptoConfirmations *int       `json:"crypto_confirmations"`
	CryptoValueCoin     *string    `json:"crypto_value_coin"`
	FechaCreacion       time.Time  `json:"fecha_creacion"`
	FechaVerificacion   *time.Time `json:"fecha_verificacion"`
}

func (r *ReservaRepo) GetByID(ctx context.Context, id string) (*ReservaDetalle, error) {
	var d ReservaDetalle
	var notasHuesped *string
	var fechaConfirmacion, fechaCancelacion *time.Time

	err := r.pool.QueryRow(ctx, `
		SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
		       r.fecha_entrada, r.fecha_salida, r.noches,
		       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
		       r.total, r.moneda, r.cantidad_huespedes, r.estado,
		       r.notas_huesped, r.fecha_creacion, r.fecha_confirmacion,
		       r.fecha_cancelacion,
		       p.titulo, p.slug, p.propietario_id, p.politica_cancelacion,
		       p.direccion, p.ciudad,
		       u.nombre, u.apellido, u.email
		FROM reservas r
		JOIN propiedades p ON p.id = r.propiedad_id
		JOIN usuarios u ON u.id = r.huesped_id
		WHERE r.id = $1
	`, id).Scan(
		&d.ID, &d.Codigo, &d.PropiedadID, &d.HuespedID,
		&d.FechaEntrada, &d.FechaSalida, &d.Noches,
		&d.PrecioPorNoche, &d.Subtotal, &d.ComisionPlataforma, &d.ComisionAnfitrion,
		&d.Total, &d.Moneda, &d.CantidadHuespedes, &d.Estado,
		&notasHuesped, &d.CreatedAt, &fechaConfirmacion,
		&fechaCancelacion,
		&d.PropiedadTitulo, &d.PropiedadSlug, &d.PropietarioID, &d.PoliticaCancelacion,
		&d.PropiedadDireccion, &d.PropiedadCiudad,
		&d.HuespedNombre, &d.HuespedApellido, &d.HuespedEmail,
	)
	if err != nil {
		return nil, fmt.Errorf("get reserva by id: %w", err)
	}
	d.NotasHuesped = notasHuesped
	d.FechaConfirmacion = fechaConfirmacion
	d.CanceladaEn = fechaCancelacion
	return &d, nil
}

func (r *ReservaRepo) ListByHuesped(ctx context.Context, huespedID string, limit, offset int) ([]ReservaConPropiedad, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reservas WHERE huesped_id = $1`, huespedID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count reservas huesped: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
		       r.fecha_entrada, r.fecha_salida, r.noches,
		       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
		       r.total, r.moneda, r.cantidad_huespedes, r.estado,
		       r.notas_huesped, r.fecha_creacion,
		       p.titulo, p.slug, p.direccion, p.ciudad,
		       COALESCE(p.politica_cancelacion, 'FLEXIBLE'),
		       ip.url,
		       COALESCE(pg2.estado, '')
		FROM reservas r
		JOIN propiedades p ON p.id = r.propiedad_id
		LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id AND es_principal = true LIMIT 1) ip ON true
		LEFT JOIN LATERAL (SELECT estado FROM pagos WHERE reserva_id = r.id ORDER BY fecha_creacion DESC LIMIT 1) pg2 ON true
		WHERE r.huesped_id = $1
		ORDER BY r.fecha_creacion DESC
		LIMIT $2 OFFSET $3
	`, huespedID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list reservas huesped: %w", err)
	}
	defer rows.Close()

	var results []ReservaConPropiedad
	for rows.Next() {
		var item ReservaConPropiedad
		var notasHuesped *string
		err := rows.Scan(
			&item.ID, &item.Codigo, &item.PropiedadID, &item.HuespedID,
			&item.FechaEntrada, &item.FechaSalida, &item.Noches,
			&item.PrecioPorNoche, &item.Subtotal, &item.ComisionPlataforma, &item.ComisionAnfitrion,
			&item.Total, &item.Moneda, &item.CantidadHuespedes, &item.Estado,
			&notasHuesped, &item.CreatedAt,
			&item.PropiedadTitulo, &item.PropiedadSlug, &item.PropiedadDireccion, &item.PropiedadCiudad,
			&item.PropiedadPoliticaCancel, &item.PropiedadImagenPrincipal,
			&item.EstadoPago,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan reserva huesped: %w", err)
		}
		item.NotasHuesped = notasHuesped
		results = append(results, item)
	}
	return results, total, nil
}

func (r *ReservaRepo) ListByPropietario(ctx context.Context, propietarioID string, estado string, limit, offset int) ([]ReservaConHuesped, int, error) {
	var total int
	var err error

	if estado != "" {
		err = r.pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM reservas r
			JOIN propiedades p ON p.id = r.propiedad_id
			WHERE p.propietario_id = $1 AND r.estado = $2
		`, propietarioID, estado).Scan(&total)
	} else {
		err = r.pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM reservas r
			JOIN propiedades p ON p.id = r.propiedad_id
			WHERE p.propietario_id = $1
		`, propietarioID).Scan(&total)
	}
	if err != nil {
		return nil, 0, fmt.Errorf("count reservas propietario: %w", err)
	}

	var rows pgx.Rows
	if estado != "" {
		rows, err = r.pool.Query(ctx, `
			SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
			       r.fecha_entrada, r.fecha_salida, r.noches,
			       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
			       r.total, r.moneda, r.cantidad_huespedes, r.estado,
			       r.notas_huesped, r.fecha_creacion,
			       p.titulo, p.slug,
			       u.nombre, u.apellido, u.email, u.avatar_url,
			       ip.url,
			       COALESCE(pg2.estado, '')
			FROM reservas r
			JOIN propiedades p ON p.id = r.propiedad_id
			JOIN usuarios u ON u.id = r.huesped_id
			LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id AND es_principal = true LIMIT 1) ip ON true
			LEFT JOIN LATERAL (SELECT estado FROM pagos WHERE reserva_id = r.id ORDER BY fecha_creacion DESC LIMIT 1) pg2 ON true
			WHERE p.propietario_id = $1 AND r.estado = $2
			ORDER BY r.fecha_creacion DESC
			LIMIT $3 OFFSET $4
		`, propietarioID, estado, limit, offset)
	} else {
		rows, err = r.pool.Query(ctx, `
			SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
			       r.fecha_entrada, r.fecha_salida, r.noches,
			       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
			       r.total, r.moneda, r.cantidad_huespedes, r.estado,
			       r.notas_huesped, r.fecha_creacion,
			       p.titulo, p.slug,
			       u.nombre, u.apellido, u.email, u.avatar_url,
			       ip.url,
			       COALESCE(pg2.estado, '')
			FROM reservas r
			JOIN propiedades p ON p.id = r.propiedad_id
			JOIN usuarios u ON u.id = r.huesped_id
			LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id AND es_principal = true LIMIT 1) ip ON true
			LEFT JOIN LATERAL (SELECT estado FROM pagos WHERE reserva_id = r.id ORDER BY fecha_creacion DESC LIMIT 1) pg2 ON true
			WHERE p.propietario_id = $1
			ORDER BY r.fecha_creacion DESC
			LIMIT $2 OFFSET $3
		`, propietarioID, limit, offset)
	}
	if err != nil {
		return nil, 0, fmt.Errorf("list reservas propietario: %w", err)
	}
	defer rows.Close()

	var results []ReservaConHuesped
	for rows.Next() {
		var item ReservaConHuesped
		var notasHuesped *string
		err := rows.Scan(
			&item.ID, &item.Codigo, &item.PropiedadID, &item.HuespedID,
			&item.FechaEntrada, &item.FechaSalida, &item.Noches,
			&item.PrecioPorNoche, &item.Subtotal, &item.ComisionPlataforma, &item.ComisionAnfitrion,
			&item.Total, &item.Moneda, &item.CantidadHuespedes, &item.Estado,
			&notasHuesped, &item.CreatedAt,
			&item.PropiedadTitulo, &item.PropiedadSlug,
			&item.HuespedNombre, &item.HuespedApellido, &item.HuespedEmail, &item.HuespedAvatarURL,
			&item.PropiedadImagenPrincipal,
			&item.EstadoPago,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan reserva propietario: %w", err)
		}
		item.NotasHuesped = notasHuesped
		results = append(results, item)
	}
	return results, total, nil
}

func (r *ReservaRepo) Crear(ctx context.Context, prop *PropiedadInfo, huespedID string, fechaEntrada, fechaSalida time.Time, cantidadHuespedes int, notasHuesped *string, comisionH, comisionA float64) (*models.Reserva, error) {
	noches := int(fechaSalida.Sub(fechaEntrada).Hours() / 24)
	if noches < 1 {
		noches = 1
	}

	subtotal := util.Round2(prop.PrecioPorNoche * float64(noches))
	comisionHuesped := util.Round2(subtotal * comisionH)
	comisionAnfitrion := util.Round2(subtotal * comisionA)
	total := util.Round2(subtotal + comisionHuesped)
	codigo := idgen.CodigoReserva()
	id := idgen.New()

	var notaVal *string
	if notasHuesped != nil && *notasHuesped != "" {
		notaVal = notasHuesped
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO reservas (id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida,
			noches, precio_por_noche, subtotal, comision_plataforma, comision_anfitrion, total,
			moneda, cantidad_huespedes, estado, notas_huesped, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE_PAGO', $15, NOW())
	`, id, codigo, prop.ID, huespedID, fechaEntrada, fechaSalida,
		noches, prop.PrecioPorNoche, subtotal, comisionHuesped, comisionAnfitrion,
		total, string(prop.Moneda), cantidadHuespedes, notaVal)
	if err != nil {
		return nil, fmt.Errorf("insert reserva: %w", err)
	}

	return &models.Reserva{
		ID:                 id,
		Codigo:             codigo,
		PropiedadID:        prop.ID,
		HuespedID:          huespedID,
		FechaEntrada:       fechaEntrada,
		FechaSalida:        fechaSalida,
		Noches:             noches,
		PrecioPorNoche:     prop.PrecioPorNoche,
		Subtotal:           subtotal,
		ComisionPlataforma: comisionHuesped,
		ComisionAnfitrion:  comisionAnfitrion,
		Total:              total,
		Moneda:             prop.Moneda,
		CantidadHuespedes:  cantidadHuespedes,
		Estado:             enums.EstadoReservaPendientePago,
		NotasHuesped:       notaVal,
	}, nil
}

func (r *ReservaRepo) UpdateCuponDescuento(ctx context.Context, reservaID, cuponID string, descuento, nuevoSubtotal, nuevaComision, nuevoTotal float64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE reservas SET cupon_id = $1, descuento = $2,
			subtotal = $3, comision_plataforma = $4, total = $5
		WHERE id = $6`,
		cuponID, descuento, nuevoSubtotal, nuevaComision, nuevoTotal, reservaID)
	return err
}

type PropiedadInfo struct {
	ID             string
	Titulo         string
	PrecioPorNoche float64
	Moneda         enums.Moneda
	PropietarioID  string
	Estado         string
	Capacidad      int
	EstanciaMinima int
	EstanciaMaxima int
}

func (r *ReservaRepo) GetPropiedadForReserva(ctx context.Context, propiedadID string) (*PropiedadInfo, error) {
	var p PropiedadInfo
	var estanciaMin, estanciaMax *int

	err := r.pool.QueryRow(ctx, `
		SELECT id, titulo, precio_por_noche, moneda, propietario_id, estado_publicacion,
		       COALESCE(capacidad_maxima, 1),
		       COALESCE(estancia_minima, 1), COALESCE(estancia_maxima, 365)
		FROM propiedades WHERE id = $1
	`, propiedadID).Scan(
		&p.ID, &p.Titulo, &p.PrecioPorNoche, &p.Moneda, &p.PropietarioID, &p.Estado,
		&p.Capacidad, &estanciaMin, &estanciaMax,
	)
	if err != nil {
		return nil, fmt.Errorf("get propiedad for reserva: %w", err)
	}
	if estanciaMin != nil {
		p.EstanciaMinima = *estanciaMin
	}
	if estanciaMax != nil {
		p.EstanciaMaxima = *estanciaMax
	}
	return &p, nil
}

func (r *ReservaRepo) Confirmar(ctx context.Context, reservaID string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'CONFIRMADA', fecha_confirmacion = NOW()
		WHERE id = $1 AND estado IN ('PENDIENTE', 'PENDIENTE_CONFIRMACION')
	`, reservaID)
	if err != nil {
		return fmt.Errorf("confirmar reserva: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.ReservaNoModificable("reserva no encontrada o no esta pendiente de confirmacion")
	}
	return nil
}

func (r *ReservaRepo) Rechazar(ctx context.Context, reservaID, _ string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'RECHAZADA', fecha_cancelacion = NOW()
		WHERE id = $1 AND estado IN ('PENDIENTE', 'PENDIENTE_CONFIRMACION')
	`, reservaID)
	if err != nil {
		return fmt.Errorf("rechazar reserva: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.ReservaNoModificable("reserva no encontrada o no esta pendiente de confirmacion")
	}
	return nil
}

func (r *ReservaRepo) CountRechazosMes(ctx context.Context, anfitrionID string) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM anfitrion_rechazos
		WHERE anfitrion_id = $1
		  AND fecha >= date_trunc('month', CURRENT_DATE)
		  AND fecha < date_trunc('month', CURRENT_DATE) + interval '1 month'
	`, anfitrionID).Scan(&count)
	return count, err
}

func (r *ReservaRepo) RegistrarRechazo(ctx context.Context, anfitrionID, reservaID, motivo string) error {
	id := idgen.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO anfitrion_rechazos (id, anfitrion_id, reserva_id, motivo, fecha)
		VALUES ($1, $2, $3, $4, NOW())
	`, id, anfitrionID, reservaID, motivo)
	return err
}

func (r *ReservaRepo) RegistrarPenalizacion(ctx context.Context, anfitrionID string, porcentaje float64, descripcion string) error {
	id := idgen.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO anfitrion_penalizaciones (id, anfitrion_id, porcentaje, descripcion, fecha, aplicada)
		VALUES ($1, $2, $3, $4, NOW(), false)
	`, id, anfitrionID, porcentaje, descripcion)
	return err
}

func (r *ReservaRepo) CancelarHuesped(ctx context.Context, reservaID, _ string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'CANCELADA_HUESPED', fecha_cancelacion = NOW()
		WHERE id = $1 AND estado IN ('PENDIENTE', 'PENDIENTE_PAGO', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA')
	`, reservaID)
	if err != nil {
		return fmt.Errorf("cancelar reserva huesped: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.ReservaNoModificable("reserva no encontrada o no se puede cancelar")
	}
	return nil
}

func (r *ReservaRepo) CancelarAnfitrion(ctx context.Context, reservaID, _ string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'CANCELADA_ANFITRION', fecha_cancelacion = NOW()
		WHERE id = $1 AND estado IN ('PENDIENTE', 'CONFIRMADA')
	`, reservaID)
	if err != nil {
		return fmt.Errorf("cancelar reserva anfitrion: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.ReservaNoModificable("reserva no encontrada o no se puede cancelar")
	}
	return nil
}

func (r *ReservaRepo) GetStats(ctx context.Context, userID string, esPropietario bool) (*ReservasStats, error) {
	var s ReservasStats
	var err error

	if esPropietario {
		err = r.pool.QueryRow(ctx, `
			SELECT
				COUNT(*) FILTER (WHERE estado = 'PENDIENTE'),
				COUNT(*) FILTER (WHERE estado = 'CONFIRMADA'),
				COUNT(*) FILTER (WHERE estado = 'EN_CURSO'),
				COUNT(*) FILTER (WHERE estado = 'COMPLETADA'),
				COUNT(*) FILTER (WHERE estado IN ('CANCELADA_HUESPED', 'CANCELADA_ANFITRION'))
			FROM reservas r
			JOIN propiedades p ON p.id = r.propiedad_id
			WHERE p.propietario_id = $1
		`, userID).Scan(&s.Pendientes, &s.Confirmadas, &s.EnCurso, &s.Completadas, &s.Canceladas)
	} else {
		err = r.pool.QueryRow(ctx, `
			SELECT
				COUNT(*) FILTER (WHERE estado = 'PENDIENTE'),
				COUNT(*) FILTER (WHERE estado = 'CONFIRMADA'),
				COUNT(*) FILTER (WHERE estado = 'EN_CURSO'),
				COUNT(*) FILTER (WHERE estado = 'COMPLETADA'),
				COUNT(*) FILTER (WHERE estado IN ('CANCELADA_HUESPED', 'CANCELADA_ANFITRION'))
			FROM reservas
			WHERE huesped_id = $1
		`, userID).Scan(&s.Pendientes, &s.Confirmadas, &s.EnCurso, &s.Completadas, &s.Canceladas)
	}
	if err != nil {
		return nil, fmt.Errorf("get reservas stats: %w", err)
	}
	return &s, nil
}

func (r *ReservaRepo) InsertNotificacion(ctx context.Context, tipo, titulo, mensaje, usuarioID, urlAccion string) error {
	id := idgen.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO notificaciones (id, tipo, titulo, mensaje, usuario_id, url_accion)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, id, tipo, titulo, mensaje, usuarioID, urlAccion)
	return err
}

func (r *ReservaRepo) GetPagosByReserva(ctx context.Context, reservaID string) ([]PagoResumen, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, monto, moneda, metodo_pago, estado, referencia, comprobante,
		       crypto_address, crypto_tx_hash, crypto_confirmations, crypto_value_coin,
		       fecha_creacion, fecha_verificacion
		FROM pagos
		WHERE reserva_id = $1
		ORDER BY fecha_creacion DESC
	`, reservaID)
	if err != nil {
		return nil, fmt.Errorf("get pagos by reserva: %w", err)
	}
	defer rows.Close()

	var results []PagoResumen
	for rows.Next() {
		var p PagoResumen
		var cryptoVal *float64
		err := rows.Scan(
			&p.ID, &p.Monto, &p.Moneda, &p.MetodoPago, &p.Estado, &p.Referencia, &p.Comprobante,
			&p.CryptoAddress, &p.CryptoTxHash, &p.CryptoConfirmations, &cryptoVal,
			&p.FechaCreacion, &p.FechaVerificacion,
		)
		if err != nil {
			return nil, fmt.Errorf("scan pago: %w", err)
		}
		if cryptoVal != nil {
			s := fmt.Sprintf("%.8f", *cryptoVal)
			p.CryptoValueCoin = &s
		}
		results = append(results, p)
	}
	return results, nil
}

func (r *ReservaRepo) InsertPagoManual(ctx context.Context, pago *NuevoPago) (string, error) {
	id := idgen.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO pagos (id, reserva_id, usuario_id, monto, moneda, metodo_pago, estado,
		                   referencia, comprobante, banco_emisor, telefono_emisor, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7, $8, $9, $10, NOW())
	`, id, pago.ReservaID, pago.UsuarioID, pago.Monto, string(pago.Moneda), string(pago.MetodoPago),
		pago.Referencia, pago.ComprobanteURL, pago.BancoEmisor, pago.TelefonoEmisor)
	if err != nil {
		return "", fmt.Errorf("insert pago manual: %w", err)
	}
	return id, nil
}

func (r *ReservaRepo) ListByPropiedadID(ctx context.Context, propiedadID string, limit, offset int) ([]ReservaConHuesped, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM reservas WHERE propiedad_id = $1`, propiedadID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count reservas propiedad: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
		       r.fecha_entrada, r.fecha_salida, r.noches,
		       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
		       r.total, r.moneda, r.cantidad_huespedes, r.estado,
		       r.notas_huesped, r.fecha_creacion,
		       p.titulo, p.slug,
		       u.nombre, u.apellido, u.email, u.avatar_url,
		       ip.url,
		       COALESCE(pg2.estado, '')
		FROM reservas r
		JOIN propiedades p ON p.id = r.propiedad_id
		JOIN usuarios u ON u.id = r.huesped_id
		LEFT JOIN LATERAL (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id AND es_principal = true LIMIT 1) ip ON true
		LEFT JOIN LATERAL (SELECT estado FROM pagos WHERE reserva_id = r.id ORDER BY fecha_creacion DESC LIMIT 1) pg2 ON true
		WHERE r.propiedad_id = $1
		ORDER BY r.fecha_creacion DESC
		LIMIT $2 OFFSET $3
	`, propiedadID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list reservas propiedad: %w", err)
	}
	defer rows.Close()

	var results []ReservaConHuesped
	for rows.Next() {
		var item ReservaConHuesped
		var notasHuesped *string
		err := rows.Scan(
			&item.ID, &item.Codigo, &item.PropiedadID, &item.HuespedID,
			&item.FechaEntrada, &item.FechaSalida, &item.Noches,
			&item.PrecioPorNoche, &item.Subtotal, &item.ComisionPlataforma, &item.ComisionAnfitrion,
			&item.Total, &item.Moneda, &item.CantidadHuespedes, &item.Estado,
			&notasHuesped, &item.CreatedAt,
			&item.PropiedadTitulo, &item.PropiedadSlug,
			&item.HuespedNombre, &item.HuespedApellido, &item.HuespedEmail, &item.HuespedAvatarURL,
			&item.PropiedadImagenPrincipal,
			&item.EstadoPago,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan reserva propiedad: %w", err)
		}
		item.NotasHuesped = notasHuesped
		results = append(results, item)
	}
	return results, total, nil
}

type NuevoPago struct {
	ReservaID      string
	UsuarioID      string
	Monto          float64
	Moneda         enums.Moneda
	MetodoPago     enums.MetodoPagoEnum
	Referencia     string
	ComprobanteURL *string
	BancoEmisor    *string
	TelefonoEmisor *string
	Notas          *string
}

func (r *ReservaRepo) CrearWithDB(ctx context.Context, db DBTX, prop *PropiedadInfo, huespedID string, fechaEntrada, fechaSalida time.Time, cantidadHuespedes int, notasHuesped *string, comisionH, comisionA float64) (*models.Reserva, error) {
	noches := int(fechaSalida.Sub(fechaEntrada).Hours() / 24)
	if noches < 1 {
		noches = 1
	}

	subtotal := util.Round2(prop.PrecioPorNoche * float64(noches))
	comisionHuesped := util.Round2(subtotal * comisionH)
	comisionAnfitrion := util.Round2(subtotal * comisionA)
	total := util.Round2(subtotal + comisionHuesped)
	codigo := idgen.CodigoReserva()
	id := idgen.New()

	var notaVal *string
	if notasHuesped != nil && *notasHuesped != "" {
		notaVal = notasHuesped
	}

	_, err := db.Exec(ctx, `
		INSERT INTO reservas (id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida,
			noches, precio_por_noche, subtotal, comision_plataforma, comision_anfitrion, total,
			moneda, cantidad_huespedes, estado, notas_huesped, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE_PAGO', $15, NOW())
	`, id, codigo, prop.ID, huespedID, fechaEntrada, fechaSalida,
		noches, prop.PrecioPorNoche, subtotal, comisionHuesped, comisionAnfitrion,
		total, string(prop.Moneda), cantidadHuespedes, notaVal)
	if err != nil {
		return nil, fmt.Errorf("insert reserva: %w", err)
	}

	return &models.Reserva{
		ID:                 id,
		Codigo:             codigo,
		PropiedadID:        prop.ID,
		HuespedID:          huespedID,
		FechaEntrada:       fechaEntrada,
		FechaSalida:        fechaSalida,
		Noches:             noches,
		PrecioPorNoche:     prop.PrecioPorNoche,
		Subtotal:           subtotal,
		ComisionPlataforma: comisionHuesped,
		ComisionAnfitrion:  comisionAnfitrion,
		Total:              total,
		Moneda:             prop.Moneda,
		CantidadHuespedes:  cantidadHuespedes,
		Estado:             enums.EstadoReservaPendientePago,
		NotasHuesped:       notaVal,
	}, nil
}

func (r *ReservaRepo) InsertPagoManualWithDB(ctx context.Context, db DBTX, pago *NuevoPago) (string, error) {
	id := idgen.New()
	_, err := db.Exec(ctx, `
		INSERT INTO pagos (id, reserva_id, usuario_id, monto, moneda, metodo_pago, estado,
		                   referencia, comprobante, banco_emisor, telefono_emisor, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7, $8, $9, $10, NOW())
	`, id, pago.ReservaID, pago.UsuarioID, pago.Monto, string(pago.Moneda), string(pago.MetodoPago),
		pago.Referencia, pago.ComprobanteURL, pago.BancoEmisor, pago.TelefonoEmisor)
	if err != nil {
		return "", fmt.Errorf("insert pago manual: %w", err)
	}
	return id, nil
}

func (r *ReservaRepo) UpdateCuponDescuentoWithDB(ctx context.Context, db DBTX, reservaID, cuponID string, descuento, nuevoSubtotal, nuevaComision, nuevoTotal float64) error {
	_, err := db.Exec(ctx, `
		UPDATE reservas SET cupon_id = $1, descuento = $2,
			subtotal = $3, comision_plataforma = $4, total = $5
		WHERE id = $6`,
		cuponID, descuento, nuevoSubtotal, nuevaComision, nuevoTotal, reservaID)
	return err
}

func (r *ReservaRepo) InsertNotificacionWithDB(ctx context.Context, db DBTX, tipo, titulo, mensaje, usuarioID, urlAccion string) error {
	id := idgen.New()
	_, err := db.Exec(ctx, `
		INSERT INTO notificaciones (id, tipo, titulo, mensaje, usuario_id, url_accion)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, id, tipo, titulo, mensaje, usuarioID, urlAccion)
	return err
}

func (r *ReservaRepo) FindFechaBloqueada(ctx context.Context, propiedadID string, entrada, salida time.Time) (string, error) {
	var bloqueadaID string
	err := r.pool.QueryRow(ctx, `
		SELECT id FROM fechas_bloqueadas
		WHERE propiedad_id = $1
		  AND fecha_inicio < $3
		  AND fecha_fin > $2
		LIMIT 1
	`, propiedadID, entrada, salida).Scan(&bloqueadaID)
	if err == pgx.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("find fecha bloqueada: %w", err)
	}
	return bloqueadaID, nil
}

func (r *ReservaRepo) GetPropiedadBasica(ctx context.Context, propiedadID string) (id, titulo string, precio float64, moneda, propietarioID string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT id, titulo, precio_por_noche, moneda, propietario_id
		FROM propiedades WHERE id = $1
	`, propiedadID).Scan(&id, &titulo, &precio, &moneda, &propietarioID)
	if err != nil {
		return "", "", 0, "", "", fmt.Errorf("get propiedad basica: %w", err)
	}
	return
}

type FechaOcupadaRow struct {
	Inicio time.Time
	Fin    time.Time
	Estado string
}

func (r *ReservaRepo) ListFechasOcupadas(ctx context.Context, propiedadID string) ([]FechaOcupadaRow, []FechaOcupadaRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT fecha_entrada, fecha_salida, estado FROM reservas
		WHERE propiedad_id = $1
		  AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_CURSO')
	`, propiedadID)
	if err != nil {
		return nil, nil, fmt.Errorf("query fechas ocupadas reservas: %w", err)
	}
	defer rows.Close()

	var reservas []FechaOcupadaRow
	for rows.Next() {
		var f FechaOcupadaRow
		if err := rows.Scan(&f.Inicio, &f.Fin, &f.Estado); err != nil {
			return nil, nil, err
		}
		reservas = append(reservas, f)
	}

	blockedRows, err := r.pool.Query(ctx, `
		SELECT fecha_inicio, fecha_fin FROM fechas_bloqueadas
		WHERE propiedad_id = $1
	`, propiedadID)
	if err != nil {
		return nil, nil, fmt.Errorf("query fechas bloqueadas: %w", err)
	}
	defer blockedRows.Close()

	var bloqueadas []FechaOcupadaRow
	for blockedRows.Next() {
		var f FechaOcupadaRow
		if err := blockedRows.Scan(&f.Inicio, &f.Fin); err != nil {
			return nil, nil, err
		}
		f.Estado = "BLOQUEADA"
		bloqueadas = append(bloqueadas, f)
	}

	return reservas, bloqueadas, nil
}

func (r *ReservaRepo) ExistsSolapamiento(ctx context.Context, propiedadID string, entrada, salida time.Time) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM reservas
			WHERE propiedad_id = $1
			  AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_CURSO')
			  AND fecha_entrada < $3
			  AND fecha_salida > $2
		)
	`, propiedadID, entrada, salida).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check solapamiento reservas: %w", err)
	}
	if exists {
		return true, nil
	}

	err = r.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM fechas_bloqueadas
			WHERE propiedad_id = $1
			  AND fecha_inicio < $3
			  AND fecha_fin > $2
		)
	`, propiedadID, entrada, salida).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check solapamiento bloqueadas: %w", err)
	}
	return exists, nil
}

func (r *ReservaRepo) ExistsSolapamientoWithDB(ctx context.Context, db DBTX, propiedadID string, entrada, salida time.Time) (bool, error) {
	var exists bool
	err := db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM reservas
			WHERE propiedad_id = $1
			  AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE', 'PENDIENTE_CONFIRMACION', 'CONFIRMADA', 'EN_CURSO')
			  AND fecha_entrada < $3
			  AND fecha_salida > $2
			FOR UPDATE
		)
	`, propiedadID, entrada, salida).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check solapamiento reservas (tx): %w", err)
	}
	if exists {
		return true, nil
	}

	err = db.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM fechas_bloqueadas
			WHERE propiedad_id = $1
			  AND fecha_inicio < $3
			  AND fecha_fin > $2
			FOR UPDATE
		)
	`, propiedadID, entrada, salida).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check solapamiento bloqueadas (tx): %w", err)
	}
	return exists, nil
}

func (r *ReservaRepo) ExpirarPendientesWithDB(ctx context.Context, db DBTX) (int, error) {
	tag, err := db.Exec(ctx, `
		DELETE FROM reservas
		WHERE estado = 'PENDIENTE_PAGO'
		  AND fecha_creacion < NOW() - INTERVAL '15 minutes'
	`)
	if err != nil {
		return 0, fmt.Errorf("expirar pendientes: %w", err)
	}
	return int(tag.RowsAffected()), nil
}

func (r *ReservaRepo) EliminarPendientePago(ctx context.Context, reservaID, userID string) error {
	tag, err := r.pool.Exec(ctx, `
		DELETE FROM reservas
		WHERE id = $1 AND estado = 'PENDIENTE_PAGO' AND huesped_id = $2
	`, reservaID, userID)
	if err != nil {
		return fmt.Errorf("eliminar pendiente pago: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return bizerrors.ReservaNoEncontrada()
	}
	return nil
}
