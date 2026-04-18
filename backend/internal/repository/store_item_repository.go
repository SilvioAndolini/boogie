package repository

import (
	"context"
	"fmt"

	"github.com/boogie/backend/internal/domain/idgen"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StoreItemRepo struct {
	pool *pgxpool.Pool
}

func NewStoreItemRepo(pool *pgxpool.Pool) *StoreItemRepo {
	return &StoreItemRepo{pool: pool}
}

type StoreItemInput struct {
	ReservaID      string
	TipoItem       string
	Nombre         string
	Cantidad       int
	PrecioUnitario float64
	Moneda         string
	Subtotal       float64
	ProductoID     *string
	ServicioID     *string
}

func (r *StoreItemRepo) InsertBatch(ctx context.Context, items []StoreItemInput) error {
	for _, item := range items {
		id := idgen.New()
		_, err := r.pool.Exec(ctx, `
			INSERT INTO reserva_store_items (id, reserva_id, tipo_item, nombre, cantidad, precio_unitario, moneda, subtotal, producto_id, servicio_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, id, item.ReservaID, item.TipoItem, item.Nombre, item.Cantidad, item.PrecioUnitario, item.Moneda, item.Subtotal, item.ProductoID, item.ServicioID)
		if err != nil {
			return fmt.Errorf("insert store item: %w", err)
		}
	}
	return nil
}

func (r *StoreItemRepo) InsertBatchWithDB(ctx context.Context, db DBTX, items []StoreItemInput) error {
	for _, item := range items {
		id := idgen.New()
		_, err := db.Exec(ctx, `
			INSERT INTO reserva_store_items (id, reserva_id, tipo_item, nombre, cantidad, precio_unitario, moneda, subtotal, producto_id, servicio_id)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, id, item.ReservaID, item.TipoItem, item.Nombre, item.Cantidad, item.PrecioUnitario, item.Moneda, item.Subtotal, item.ProductoID, item.ServicioID)
		if err != nil {
			return fmt.Errorf("insert store item: %w", err)
		}
	}
	return nil
}
