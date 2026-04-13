package repository

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PagoRepo struct {
	pool *pgxpool.Pool
}

func NewPagoRepo(pool *pgxpool.Pool) *PagoRepo {
	return &PagoRepo{pool: pool}
}

type PagoConReserva struct {
	ID             string     `json:"id"`
	ReservaID      *string    `json:"reserva_id"`
	Monto          float64    `json:"monto"`
	Moneda         string     `json:"moneda"`
	MetodoPago     string     `json:"metodo_pago"`
	Estado         string     `json:"estado"`
	Referencia     string     `json:"referencia"`
	Comprobante    *string    `json:"comprobante"`
	FechaCreacion  time.Time  `json:"fecha_creacion"`
	PropiedadTitulo *string   `json:"propiedad_titulo"`
}

func (r *PagoRepo) GetMisPagos(ctx context.Context, userID string) ([]PagoConReserva, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.reserva_id, p.monto, p.moneda, p.metodo_pago,
		       p.estado, p.referencia, p.comprobante, p.fecha_creacion,
		       prop.titulo
		FROM pagos p
		LEFT JOIN reservas r ON r.id = p.reserva_id
		LEFT JOIN propiedades prop ON prop.id = r.propiedad_id
		WHERE p.usuario_id = $1
		ORDER BY p.fecha_creacion DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("get mis pagos: %w", err)
	}
	defer rows.Close()

	var results []PagoConReserva
	for rows.Next() {
		var p PagoConReserva
		if err := rows.Scan(
			&p.ID, &p.ReservaID, &p.Monto, &p.Moneda, &p.MetodoPago,
			&p.Estado, &p.Referencia, &p.Comprobante, &p.FechaCreacion,
			&p.PropiedadTitulo,
		); err != nil {
			return nil, fmt.Errorf("scan pago: %w", err)
		}
		results = append(results, p)
	}
	return results, nil
}

func (r *PagoRepo) GetByID(ctx context.Context, pagoID string) (*PagoConReserva, error) {
	var p PagoConReserva
	err := r.pool.QueryRow(ctx, `
		SELECT p.id, p.reserva_id, p.monto, p.moneda, p.metodo_pago,
		       p.estado, p.referencia, p.comprobante, p.fecha_creacion,
		       prop.titulo
		FROM pagos p
		LEFT JOIN reservas r ON r.id = p.reserva_id
		LEFT JOIN propiedades prop ON prop.id = r.propiedad_id
		WHERE p.id = $1
	`, pagoID).Scan(
		&p.ID, &p.ReservaID, &p.Monto, &p.Moneda, &p.MetodoPago,
		&p.Estado, &p.Referencia, &p.Comprobante, &p.FechaCreacion,
		&p.PropiedadTitulo,
	)
	if err != nil {
		return nil, fmt.Errorf("get pago by id: %w", err)
	}
	return &p, nil
}

func (r *PagoRepo) Verificar(ctx context.Context, pagoID, verificadoPor, estado string, notas *string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE pagos SET estado = $2, verificado_por = $3, notas_verificacion = $4,
			fecha_verificacion = NOW()
		WHERE id = $1
	`, pagoID, estado, verificadoPor, notas)
	return err
}

func (r *PagoRepo) GetReservaOwnerForPago(ctx context.Context, pagoID string) (reservaID, propietarioID string, estadoReserva string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT r.id, prop.propietario_id, r.estado
		FROM pagos p
		JOIN reservas r ON r.id = p.reserva_id
		JOIN propiedades prop ON prop.id = r.propiedad_id
		WHERE p.id = $1
	`, pagoID).Scan(&reservaID, &propietarioID, &estadoReserva)
	return
}

func (r *PagoRepo) ConfirmarReserva(ctx context.Context, reservaID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'CONFIRMADA', fecha_confirmacion = NOW()
		WHERE id = $1 AND estado = 'PENDIENTE'
	`, reservaID)
	return err
}

func (r *PagoRepo) InsertPagoSimple(ctx context.Context, reservaID, usuarioID string, monto float64, moneda enums.Moneda, metodo enums.MetodoPagoEnum, referencia string) (string, error) {
	id := fmt.Sprintf("%016x", rand.Int63())
	_, err := r.pool.Exec(ctx, `
		INSERT INTO pagos (id, reserva_id, usuario_id, monto, moneda, metodo_pago, estado, referencia, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7, NOW())
	`, id, reservaID, usuarioID, monto, string(moneda), string(metodo), referencia)
	if err != nil {
		return "", fmt.Errorf("insert pago simple: %w", err)
	}
	return id, nil
}

func (r *PagoRepo) InsertPagoConComprobante(ctx context.Context, reservaID, usuarioID string, monto float64, moneda enums.Moneda, metodo enums.MetodoPagoEnum, referencia string, comprobanteURL *string, bancoEmisor, telefonoEmisor *string) (string, error) {
	id := fmt.Sprintf("%016x", rand.Int63())
	_, err := r.pool.Exec(ctx, `
		INSERT INTO pagos (id, reserva_id, usuario_id, monto, moneda, metodo_pago, estado,
			referencia, comprobante, banco_emisor, telefono_emisor, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7, $8, $9, $10, NOW())
	`, id, reservaID, usuarioID, monto, string(moneda), string(metodo), referencia, comprobanteURL, bancoEmisor, telefonoEmisor)
	if err != nil {
		return "", fmt.Errorf("insert pago con comprobante: %w", err)
	}
	return id, nil
}

func (r *PagoRepo) ReservaBelongsToUser(ctx context.Context, reservaID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM reservas WHERE id = $1 AND huesped_id = $2)
	`, reservaID, userID).Scan(&exists)
	return exists, err
}

func (r *PagoRepo) InsertPagoCard(ctx context.Context, reservaID, usuarioID string, monto float64, externalTxID string) error {
	id := fmt.Sprintf("%016x", rand.Int63())
	_, err := r.pool.Exec(ctx, `
		INSERT INTO pagos (id, monto, moneda, metodo_pago, estado, referencia, fecha_creacion, reserva_id, usuario_id)
		VALUES ($1, $2, 'USD', 'TARJETA_INTERNACIONAL', 'PENDIENTE', $3, NOW(), $4, $5)
	`, id, monto, fmt.Sprintf("MoonPay TX: %s", externalTxID), reservaID, usuarioID)
	return err
}

func (r *PagoRepo) FindByReferencia(ctx context.Context, metodo, referencia string) (*PagoConReserva, error) {
	var p PagoConReserva
	err := r.pool.QueryRow(ctx, `
		SELECT p.id, p.reserva_id, p.monto, p.moneda, p.metodo_pago,
		       p.estado, p.referencia, p.comprobante, p.fecha_creacion, NULL::text
		FROM pagos p
		WHERE p.metodo_pago = $1 AND p.referencia = $2
		ORDER BY p.fecha_creacion DESC LIMIT 1
	`, metodo, referencia).Scan(
		&p.ID, &p.ReservaID, &p.Monto, &p.Moneda, &p.MetodoPago,
		&p.Estado, &p.Referencia, &p.Comprobante, &p.FechaCreacion,
		&p.PropiedadTitulo,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type WalletData struct {
	ID        string  `json:"id"`
	UsuarioID string  `json:"usuario_id"`
	Estado    string  `json:"estado"`
	SaldoUSD  float64 `json:"saldo_usd"`
	CreatedAt time.Time `json:"created_at"`
}

func (r *PagoRepo) GetWallet(ctx context.Context, userID string) (*WalletData, error) {
	var w WalletData
	err := r.pool.QueryRow(ctx, `
		SELECT id, usuario_id, estado, saldo_usd, created_at
		FROM wallets WHERE usuario_id = $1
	`, userID).Scan(&w.ID, &w.UsuarioID, &w.Estado, &w.SaldoUSD, &w.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *PagoRepo) CreateWallet(ctx context.Context, userID string) error {
	id := fmt.Sprintf("%016x", rand.Int63())
	_, err := r.pool.Exec(ctx, `
		INSERT INTO wallets (id, usuario_id, estado, saldo_usd, created_at)
		VALUES ($1, $2, 'ACTIVA', 0, NOW())
	`, id, userID)
	return err
}

type WalletTransaccion struct {
	ID            string     `json:"id"`
	WalletID      string     `json:"wallet_id"`
	Tipo          string     `json:"tipo"`
	MontoUSD      float64    `json:"monto_usd"`
	Descripcion   string     `json:"descripcion"`
	ReferenciaID  *string    `json:"referencia_id"`
	CreatedAt     time.Time  `json:"created_at"`
}

func (r *PagoRepo) GetWalletTransacciones(ctx context.Context, walletID string) ([]WalletTransaccion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, wallet_id, tipo, monto_usd, descripcion, referencia_id, created_at
		FROM wallet_transacciones
		WHERE wallet_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, walletID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []WalletTransaccion
	for rows.Next() {
		var t WalletTransaccion
		if err := rows.Scan(&t.ID, &t.WalletID, &t.Tipo, &t.MontoUSD, &t.Descripcion, &t.ReferenciaID, &t.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, t)
	}
	return results, nil
}

func (r *PagoRepo) InsertWalletTransaccion(ctx context.Context, walletID, tipo, descripcion string, montoUSD float64, referenciaID *string) (string, error) {
	id := fmt.Sprintf("%016x", rand.Int63())
	_, err := r.pool.Exec(ctx, `
		INSERT INTO wallet_transacciones (id, wallet_id, tipo, monto_usd, descripcion, referencia_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
	`, id, walletID, tipo, montoUSD, descripcion, referenciaID)
	if err != nil {
		return "", err
	}
	return id, nil
}
