package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TiendaRepo struct {
	pool *pgxpool.Pool
}

func NewTiendaRepo(pool *pgxpool.Pool) *TiendaRepo {
	return &TiendaRepo{pool: pool}
}

type StoreProducto struct {
	ID           string   `json:"id"`
	Nombre       string   `json:"nombre"`
	Descripcion  *string  `json:"descripcion"`
	Precio       float64  `json:"precio"`
	Moneda       string   `json:"moneda"`
	ImagenURL    *string  `json:"imagen_url"`
	Categoria    string   `json:"categoria"`
	Activo       bool     `json:"activo"`
	Orden        int      `json:"orden"`
}

type StoreServicio struct {
	ID          string   `json:"id"`
	Nombre      string   `json:"nombre"`
	Descripcion *string  `json:"descripcion"`
	Precio      float64  `json:"precio"`
	Moneda      string   `json:"moneda"`
	TipoPrecio  string   `json:"tipo_precio"`
	ImagenURL   *string  `json:"imagen_url"`
	Categoria   string   `json:"categoria"`
	Activo      bool     `json:"activo"`
	Orden       int      `json:"orden"`
}

func (r *TiendaRepo) GetProductosActivos(ctx context.Context) ([]StoreProducto, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, nombre, descripcion, precio, moneda, imagen_url, categoria, activo, orden
		FROM store_productos WHERE activo = true ORDER BY orden ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []StoreProducto
	for rows.Next() {
		var p StoreProducto
		if err := rows.Scan(&p.ID, &p.Nombre, &p.Descripcion, &p.Precio, &p.Moneda, &p.ImagenURL, &p.Categoria, &p.Activo, &p.Orden); err != nil {
			return nil, err
		}
		results = append(results, p)
	}
	return results, nil
}

func (r *TiendaRepo) GetServiciosActivos(ctx context.Context) ([]StoreServicio, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, nombre, descripcion, precio, moneda, tipo_precio, imagen_url, categoria, activo, orden
		FROM store_servicios WHERE activo = true ORDER BY orden ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []StoreServicio
	for rows.Next() {
		var s StoreServicio
		if err := rows.Scan(&s.ID, &s.Nombre, &s.Descripcion, &s.Precio, &s.Moneda, &s.TipoPrecio, &s.ImagenURL, &s.Categoria, &s.Activo, &s.Orden); err != nil {
			return nil, err
		}
		results = append(results, s)
	}
	return results, nil
}

func (r *TiendaRepo) GetAllProductos(ctx context.Context) ([]StoreProducto, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, nombre, descripcion, precio, moneda, imagen_url, categoria, activo, orden
		FROM store_productos ORDER BY orden ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []StoreProducto
	for rows.Next() {
		var p StoreProducto
		if err := rows.Scan(&p.ID, &p.Nombre, &p.Descripcion, &p.Precio, &p.Moneda, &p.ImagenURL, &p.Categoria, &p.Activo, &p.Orden); err != nil {
			return nil, err
		}
		results = append(results, p)
	}
	return results, nil
}

func (r *TiendaRepo) GetAllServicios(ctx context.Context) ([]StoreServicio, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, nombre, descripcion, precio, moneda, tipo_precio, imagen_url, categoria, activo, orden
		FROM store_servicios ORDER BY orden ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []StoreServicio
	for rows.Next() {
		var s StoreServicio
		if err := rows.Scan(&s.ID, &s.Nombre, &s.Descripcion, &s.Precio, &s.Moneda, &s.TipoPrecio, &s.ImagenURL, &s.Categoria, &s.Activo, &s.Orden); err != nil {
			return nil, err
		}
		results = append(results, s)
	}
	return results, nil
}

func (r *TiendaRepo) CrearProducto(ctx context.Context, nombre string, descripcion *string, precio float64, moneda, categoria string, imagenURL *string, orden int) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO store_productos (nombre, descripcion, precio, moneda, imagen_url, categoria, orden, activo) VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
		nombre, descripcion, precio, moneda, imagenURL, categoria, orden)
	return err
}

func (r *TiendaRepo) ActualizarProducto(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, imagenURL *string, categoria *string, activo *bool, orden *int) error {
	sets := []string{}
	args := []interface{}{}
	argIdx := 2

	if nombre != nil { sets = append(sets, fmt.Sprintf("nombre = $%d", argIdx)); args = append(args, *nombre); argIdx++ }
	if descripcion != nil { sets = append(sets, fmt.Sprintf("descripcion = $%d", argIdx)); args = append(args, *descripcion); argIdx++ }
	if precio != nil { sets = append(sets, fmt.Sprintf("precio = $%d", argIdx)); args = append(args, *precio); argIdx++ }
	if moneda != nil { sets = append(sets, fmt.Sprintf("moneda = $%d", argIdx)); args = append(args, *moneda); argIdx++ }
	if imagenURL != nil { sets = append(sets, fmt.Sprintf("imagen_url = $%d", argIdx)); args = append(args, *imagenURL); argIdx++ }
	if categoria != nil { sets = append(sets, fmt.Sprintf("categoria = $%d", argIdx)); args = append(args, *categoria); argIdx++ }
	if activo != nil { sets = append(sets, fmt.Sprintf("activo = $%d", argIdx)); args = append(args, *activo); argIdx++ }
	if orden != nil { sets = append(sets, fmt.Sprintf("orden = $%d", argIdx)); args = append(args, *orden); argIdx++ }

	if len(sets) == 0 {
		return nil
	}

	q := fmt.Sprintf("UPDATE store_productos SET %s WHERE id = $1", strings.Join(sets, ", "))
	args = append([]interface{}{id}, args...)
	_, err := r.pool.Exec(ctx, q, args...)
	return err
}

func (r *TiendaRepo) EliminarProducto(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM store_productos WHERE id = $1`, id)
	return err
}

func (r *TiendaRepo) CrearServicio(ctx context.Context, nombre string, descripcion *string, precio float64, moneda, tipoPrecio, categoria string, imagenURL *string, orden int) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO store_servicios (nombre, descripcion, precio, moneda, tipo_precio, imagen_url, categoria, orden, activo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
		nombre, descripcion, precio, moneda, tipoPrecio, imagenURL, categoria, orden)
	return err
}

func (r *TiendaRepo) ActualizarServicio(ctx context.Context, id string, nombre *string, descripcion *string, precio *float64, moneda *string, tipoPrecio *string, imagenURL *string, categoria *string, activo *bool, orden *int) error {
	sets := []string{}
	args := []interface{}{}
	argIdx := 2

	if nombre != nil { sets = append(sets, fmt.Sprintf("nombre = $%d", argIdx)); args = append(args, *nombre); argIdx++ }
	if descripcion != nil { sets = append(sets, fmt.Sprintf("descripcion = $%d", argIdx)); args = append(args, *descripcion); argIdx++ }
	if precio != nil { sets = append(sets, fmt.Sprintf("precio = $%d", argIdx)); args = append(args, *precio); argIdx++ }
	if moneda != nil { sets = append(sets, fmt.Sprintf("moneda = $%d", argIdx)); args = append(args, *moneda); argIdx++ }
	if tipoPrecio != nil { sets = append(sets, fmt.Sprintf("tipo_precio = $%d", argIdx)); args = append(args, *tipoPrecio); argIdx++ }
	if imagenURL != nil { sets = append(sets, fmt.Sprintf("imagen_url = $%d", argIdx)); args = append(args, *imagenURL); argIdx++ }
	if categoria != nil { sets = append(sets, fmt.Sprintf("categoria = $%d", argIdx)); args = append(args, *categoria); argIdx++ }
	if activo != nil { sets = append(sets, fmt.Sprintf("activo = $%d", argIdx)); args = append(args, *activo); argIdx++ }
	if orden != nil { sets = append(sets, fmt.Sprintf("orden = $%d", argIdx)); args = append(args, *orden); argIdx++ }

	if len(sets) == 0 {
		return nil
	}

	q := fmt.Sprintf("UPDATE store_servicios SET %s WHERE id = $1", strings.Join(sets, ", "))
	args = append([]interface{}{id}, args...)
	_, err := r.pool.Exec(ctx, q, args...)
	return err
}

func (r *TiendaRepo) EliminarServicio(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM store_servicios WHERE id = $1`, id)
	return err
}
