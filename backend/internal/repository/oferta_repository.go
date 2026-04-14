package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type OfertaRepo struct {
	pool *pgxpool.Pool
}

func NewOfertaRepo(pool *pgxpool.Pool) *OfertaRepo {
	return &OfertaRepo{pool: pool}
}

type Oferta struct {
	ID                string     `json:"id"`
	Codigo            string     `json:"codigo"`
	PropiedadID       string     `json:"propiedad_id"`
	HuespedID         string     `json:"huesped_id"`
	FechaEntrada      time.Time  `json:"fecha_entrada"`
	FechaSalida       time.Time  `json:"fecha_salida"`
	Noches            int        `json:"noches"`
	CantidadHuespedes int        `json:"cantidad_huespedes"`
	PrecioOriginal    float64    `json:"precio_original"`
	PrecioOfertado    float64    `json:"precio_ofertado"`
	Moneda            string     `json:"moneda"`
	Estado            string     `json:"estado"`
	Mensaje           *string    `json:"mensaje"`
	MotivoRechazo     *string    `json:"motivo_rechazo"`
	FechaCreacion     time.Time  `json:"fecha_creacion"`
	FechaAprobada     *time.Time `json:"fecha_aprobada"`
	FechaExpiracion   *time.Time `json:"fecha_expiracion"`
	FechaRechazada    *time.Time `json:"fecha_rechazada"`
	ReservaID         *string    `json:"reserva_id"`
}

type OfertaConPropiedad struct {
	Oferta
	PropiedadTitulo string  `json:"propiedad_titulo"`
	ImagenPrincipal *string `json:"imagen_principal"`
	HuespedNombre   string  `json:"huesped_nombre"`
	HuespedApellido string  `json:"huesped_apellido"`
	HuespedAvatar   *string `json:"huesped_avatar"`
}

func (r *OfertaRepo) Crear(ctx context.Context, o *Oferta) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `
		INSERT INTO boogie_ofertas (propiedad_id, huesped_id, fecha_entrada, fecha_salida, noches,
			cantidad_huespedes, precio_original, precio_ofertado, moneda, estado, mensaje)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDIENTE', $10)
		RETURNING id
	`, o.PropiedadID, o.HuespedID, o.FechaEntrada, o.FechaSalida, o.Noches,
		o.CantidadHuespedes, o.PrecioOriginal, o.PrecioOfertado, o.Moneda, o.Mensaje).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("crear oferta: %w", err)
	}
	return id, nil
}

func (r *OfertaRepo) GetByID(ctx context.Context, id string) (*Oferta, error) {
	var o Oferta
	err := r.pool.QueryRow(ctx, `
		SELECT id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida, noches,
		       cantidad_huespedes, precio_original, precio_ofertado, moneda, estado,
		       mensaje, motivo_rechazo, fecha_creacion, fecha_aprobada, fecha_expiracion, fecha_rechazada, reserva_id
		FROM boogie_ofertas WHERE id = $1
	`, id).Scan(&o.ID, &o.Codigo, &o.PropiedadID, &o.HuespedID, &o.FechaEntrada, &o.FechaSalida, &o.Noches,
		&o.CantidadHuespedes, &o.PrecioOriginal, &o.PrecioOfertado, &o.Moneda, &o.Estado,
		&o.Mensaje, &o.MotivoRechazo, &o.FechaCreacion, &o.FechaAprobada, &o.FechaExpiracion, &o.FechaRechazada, &o.ReservaID)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OfertaRepo) ExistsActive(ctx context.Context, propiedadID, huespedID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM boogie_ofertas
			WHERE propiedad_id = $1 AND huesped_id = $2 AND estado IN ('PENDIENTE','ACEPTADA'))
	`, propiedadID, huespedID).Scan(&exists)
	return exists, err
}

func (r *OfertaRepo) Responder(ctx context.Context, ofertaID, estado string, motivoRechazo *string) error {
	if estado == "RECHAZADA" {
		_, err := r.pool.Exec(ctx, `
			UPDATE boogie_ofertas SET estado = $2, motivo_rechazo = $3, fecha_rechazada = NOW() WHERE id = $1
		`, ofertaID, estado, motivoRechazo)
		return err
	}
	if estado == "ACEPTADA" {
		_, err := r.pool.Exec(ctx, `
			UPDATE boogie_ofertas SET estado = $2, fecha_aprobada = NOW(),
				fecha_expiracion = NOW() + INTERVAL '2 hours' WHERE id = $1
		`, ofertaID, estado)
		return err
	}
	return fmt.Errorf("estado invalido")
}

func (r *OfertaRepo) GetRecibidas(ctx context.Context, propietarioID string) ([]OfertaConPropiedad, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT o.id, COALESCE(o.codigo,''), o.propiedad_id, o.huesped_id, o.fecha_entrada, o.fecha_salida, o.noches,
		       o.cantidad_huespedes, o.precio_original, o.precio_ofertado, o.moneda, o.estado,
		       o.mensaje, o.motivo_rechazo, o.fecha_creacion, o.fecha_aprobada, o.fecha_expiracion, o.fecha_rechazada, o.reserva_id,
		       p.titulo,
		       (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1),
		       u.nombre, u.apellido, u.avatar_url
		FROM boogie_ofertas o
		JOIN propiedades p ON p.id = o.propiedad_id
		JOIN usuarios u ON u.id = o.huesped_id
		WHERE p.propietario_id = $1 AND o.estado IN ('PENDIENTE','ACEPTADA')
		ORDER BY o.fecha_creacion DESC
	`, propietarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []OfertaConPropiedad
	for rows.Next() {
		var item OfertaConPropiedad
		if err := rows.Scan(
			&item.ID, &item.Codigo, &item.PropiedadID, &item.HuespedID, &item.FechaEntrada, &item.FechaSalida, &item.Noches,
			&item.CantidadHuespedes, &item.PrecioOriginal, &item.PrecioOfertado, &item.Moneda, &item.Estado,
			&item.Mensaje, &item.MotivoRechazo, &item.FechaCreacion, &item.FechaAprobada, &item.FechaExpiracion, &item.FechaRechazada, &item.ReservaID,
			&item.PropiedadTitulo, &item.ImagenPrincipal,
			&item.HuespedNombre, &item.HuespedApellido, &item.HuespedAvatar,
		); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *OfertaRepo) GetEnviadas(ctx context.Context, huespedID string) ([]OfertaConPropiedad, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT o.id, COALESCE(o.codigo,''), o.propiedad_id, o.huesped_id, o.fecha_entrada, o.fecha_salida, o.noches,
		       o.cantidad_huespedes, o.precio_original, o.precio_ofertado, o.moneda, o.estado,
		       o.mensaje, o.motivo_rechazo, o.fecha_creacion, o.fecha_aprobada, o.fecha_expiracion, o.fecha_rechazada, o.reserva_id,
		       p.titulo,
		       (SELECT url FROM imagenes_propiedad WHERE propiedad_id = p.id ORDER BY orden LIMIT 1),
		       '', '', NULL
		FROM boogie_ofertas o
		JOIN propiedades p ON p.id = o.propiedad_id
		WHERE o.huesped_id = $1
		ORDER BY o.fecha_creacion DESC
	`, huespedID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []OfertaConPropiedad
	for rows.Next() {
		var item OfertaConPropiedad
		if err := rows.Scan(
			&item.ID, &item.Codigo, &item.PropiedadID, &item.HuespedID, &item.FechaEntrada, &item.FechaSalida, &item.Noches,
			&item.CantidadHuespedes, &item.PrecioOriginal, &item.PrecioOfertado, &item.Moneda, &item.Estado,
			&item.Mensaje, &item.MotivoRechazo, &item.FechaCreacion, &item.FechaAprobada, &item.FechaExpiracion, &item.FechaRechazada, &item.ReservaID,
			&item.PropiedadTitulo, &item.ImagenPrincipal,
			&item.HuespedNombre, &item.HuespedApellido, &item.HuespedAvatar,
		); err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *OfertaRepo) GetPropietarioID(ctx context.Context, propiedadID string) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx, `SELECT propietario_id FROM propiedades WHERE id = $1`, propiedadID).Scan(&id)
	return id, err
}

func (r *OfertaRepo) GetPropiedadPrecio(ctx context.Context, propiedadID string) (precio float64, moneda string, capacidad int, estanciaMin int, estanciaMax *int, propietarioID string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT precio_por_noche, moneda, capacidad, estancia_minima, estancia_maxima, propietario_id
		FROM propiedades WHERE id = $1 AND estado_publicacion = 'PUBLICADA'
	`, propiedadID).Scan(&precio, &moneda, &capacidad, &estanciaMin, &estanciaMax, &propietarioID)
	return
}
