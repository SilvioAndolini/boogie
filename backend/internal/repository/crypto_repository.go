package repository

import (
	"context"
	"fmt"

	"github.com/boogie/backend/internal/domain/enums"
	"github.com/boogie/backend/internal/domain/idgen"
	"github.com/boogie/backend/internal/domain/util"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CryptoRepo handles database operations for crypto payments.
type CryptoRepo struct {
	pool *pgxpool.Pool
}

func NewCryptoRepo(pool *pgxpool.Pool) *CryptoRepo {
	return &CryptoRepo{pool: pool}
}

func (r *CryptoRepo) Pool() *pgxpool.Pool {
	return r.pool
}

// InsertReservaCrypto creates a reserva in PENDIENTE_PAGO state with crypto payment info.
func (r *CryptoRepo) InsertReservaCrypto(ctx context.Context, propiedadID, huespedID string, precioPorNoche float64, moneda enums.Moneda, fechaEntrada, fechaSalida string, cantidadHuespedes int, comisionRateH, comisionRateA float64) (string, error) {
	id := idgen.New()
	codigo := idgen.CodigoReserva()
	noches := 1

	subtotal := util.Round2(precioPorNoche * float64(noches))
	comisionH := util.Round2(subtotal * comisionRateH)
	comisionA := util.Round2(subtotal * comisionRateA)
	total := util.Round2(subtotal + comisionH)

	_, err := r.pool.Exec(ctx, `
		INSERT INTO reservas (id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida,
			noches, precio_por_noche, subtotal, comision_plataforma, comision_anfitrion, total,
			moneda, cantidad_huespedes, estado, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE_PAGO', NOW())
	`, id, codigo, propiedadID, huespedID, fechaEntrada, fechaSalida,
		noches, precioPorNoche, subtotal, comisionH, comisionA, total, string(moneda), cantidadHuespedes,
	)
	if err != nil {
		return "", fmt.Errorf("insert reserva crypto: %w", err)
	}
	return id, nil
}

// InsertCryptoPago creates a crypto payment record.
func (r *CryptoRepo) InsertCryptoPago(ctx context.Context, reservaID, usuarioID string, monto float64, cryptoAddress string) error {
	id := idgen.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO pagos (id, monto, moneda, metodo_pago, estado, referencia, fecha_creacion,
			reserva_id, usuario_id, crypto_address)
		VALUES ($1, $2, 'USD', 'CRIPTO', 'PENDIENTE', 'Crypto - pendiente TX', NOW(), $3, $4, $5)
	`, id, monto, reservaID, usuarioID, cryptoAddress)
	if err != nil {
		return fmt.Errorf("insert crypto pago: %w", err)
	}
	return nil
}

// GetCryptoPagoByReserva finds the latest crypto payment for a reserva.
func (r *CryptoRepo) GetCryptoPagoByReserva(ctx context.Context, reservaID string) (pagoID, estado string, pagoReservaID string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT id, estado, reserva_id FROM pagos
		WHERE metodo_pago = 'CRIPTO' AND reserva_id = $1
		ORDER BY fecha_creacion DESC LIMIT 1
	`, reservaID).Scan(&pagoID, &estado, &pagoReservaID)
	return
}

// GetCryptoPagoByPropiedad finds the latest crypto payment for a propiedad+date range.
func (r *CryptoRepo) GetCryptoPagoByPropiedad(ctx context.Context, propiedadID, fechaEntrada, fechaSalida string) (pagoID, estado string, pagoReservaID string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT p.id, p.estado, p.reserva_id FROM pagos p
		JOIN reservas r ON p.reserva_id = r.id
		WHERE p.metodo_pago = 'CRIPTO'
		  AND r.propiedad_id = $1
		  AND r.fecha_entrada >= $2
		  AND r.fecha_salida <= $3
		ORDER BY p.fecha_creacion DESC LIMIT 1
	`, propiedadID, fechaEntrada, fechaSalida).Scan(&pagoID, &estado, &pagoReservaID)
	return
}

// UpdateCryptoPago updates a crypto payment with transaction info.
func (r *CryptoRepo) UpdateCryptoPago(ctx context.Context, pagoID, txHash, ref, estado string, confirmations int, valueCoin string, verifiedAt *string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE pagos SET crypto_tx_hash = $1, crypto_confirmations = $2, crypto_value_coin = $3,
			referencia = $4, estado = $5, fecha_verificacion = $6 WHERE id = $7
	`, txHash, confirmations, valueCoin, ref, estado, verifiedAt, pagoID)
	if err != nil {
		return fmt.Errorf("update crypto pago: %w", err)
	}
	return nil
}

// ConfirmarReservaFromCrypto transitions a reserva from PENDIENTE_PAGO/PENDIENTE to CONFIRMADA.
func (r *CryptoRepo) ConfirmarReservaFromCrypto(ctx context.Context, reservaID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'CONFIRMADA', fecha_confirmacion = NOW()
		WHERE id = $1 AND estado IN ('PENDIENTE_PAGO','PENDIENTE')
	`, reservaID)
	if err != nil {
		return fmt.Errorf("confirmar reserva from crypto: %w", err)
	}
	return nil
}

// InsertNotificacion inserts a notification record.
func (r *CryptoRepo) InsertNotificacion(ctx context.Context, tipo, titulo, mensaje, usuarioID, urlAccion string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO notificaciones (tipo, titulo, mensaje, usuario_id, url_accion, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, tipo, titulo, mensaje, usuarioID, urlAccion)
	if err != nil {
		return fmt.Errorf("insert notificacion crypto: %w", err)
	}
	return nil
}

func (r *CryptoRepo) InsertReservaCryptoWithDB(ctx context.Context, db DBTX, propiedadID, huespedID string, precioPorNoche float64, moneda enums.Moneda, fechaEntrada, fechaSalida string, cantidadHuespedes int, comisionRateH, comisionRateA float64) (string, error) {
	id := idgen.New()
	codigo := idgen.CodigoReserva()
	noches := 1

	subtotal := util.Round2(precioPorNoche * float64(noches))
	comisionH := util.Round2(subtotal * comisionRateH)
	comisionA := util.Round2(subtotal * comisionRateA)
	total := util.Round2(subtotal + comisionH)

	_, err := db.Exec(ctx, `
		INSERT INTO reservas (id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida,
			noches, precio_por_noche, subtotal, comision_plataforma, comision_anfitrion, total,
			moneda, cantidad_huespedes, estado, fecha_creacion)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE_PAGO', NOW())
	`, id, codigo, propiedadID, huespedID, fechaEntrada, fechaSalida,
		noches, precioPorNoche, subtotal, comisionH, comisionA, total, string(moneda), cantidadHuespedes,
	)
	if err != nil {
		return "", fmt.Errorf("insert reserva crypto (tx): %w", err)
	}
	return id, nil
}

func (r *CryptoRepo) InsertCryptoPagoWithDB(ctx context.Context, db DBTX, reservaID, usuarioID string, monto float64, cryptoAddress string) error {
	id := idgen.New()
	_, err := db.Exec(ctx, `
		INSERT INTO pagos (id, monto, moneda, metodo_pago, estado, referencia, fecha_creacion,
			reserva_id, usuario_id, crypto_address)
		VALUES ($1, $2, 'USD', 'CRIPTO', 'PENDIENTE', 'Crypto - pendiente TX', NOW(), $3, $4, $5)
	`, id, monto, reservaID, usuarioID, cryptoAddress)
	if err != nil {
		return fmt.Errorf("insert crypto pago (tx): %w", err)
	}
	return nil
}

func (r *CryptoRepo) InsertNotificacionWithDB(ctx context.Context, db DBTX, tipo, titulo, mensaje, usuarioID, urlAccion string) error {
	_, err := db.Exec(ctx, `
		INSERT INTO notificaciones (tipo, titulo, mensaje, usuario_id, url_accion, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`, tipo, titulo, mensaje, usuarioID, urlAccion)
	if err != nil {
		return fmt.Errorf("insert notificacion crypto (tx): %w", err)
	}
	return nil
}

func (r *CryptoRepo) CancelarCryptoFallida(ctx context.Context, reservaID, userID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE pagos SET estado = 'ANULADA', referencia = 'Crypto - verificacion fallida, cancelada por usuario'
		WHERE reserva_id = $1 AND metodo_pago = 'CRIPTO' AND estado = 'PENDIENTE'
	`, reservaID)
	if err != nil {
		return fmt.Errorf("cancel crypto pago: %w", err)
	}
	_, err = r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'ANULADA'
		WHERE id = $1 AND huesped_id = $2 AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE')
	`, reservaID, userID)
	if err != nil {
		return fmt.Errorf("cancel crypto reserva: %w", err)
	}
	return nil
}

func (r *CryptoRepo) ExpirarCryptoAbandonados(ctx context.Context) (int, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE reservas SET estado = 'ANULADA'
		WHERE estado IN ('PENDIENTE_PAGO')
		  AND fecha_creacion < NOW() - INTERVAL '2 hours'
		  AND id IN (SELECT reserva_id FROM pagos WHERE metodo_pago = 'CRIPTO' AND estado = 'PENDIENTE')
	`)
	if err != nil {
		return 0, fmt.Errorf("expirar reservas crypto: %w", err)
	}
	n := int(tag.RowsAffected())

	_, err = r.pool.Exec(ctx, `
		UPDATE pagos SET estado = 'ANULADA', referencia = 'Crypto - expirada automaticamente (sin TX en 2h)'
		WHERE metodo_pago = 'CRIPTO' AND estado = 'PENDIENTE'
		  AND fecha_creacion < NOW() - INTERVAL '2 hours'
	`)
	if err != nil {
		return n, fmt.Errorf("expirar pagos crypto: %w", err)
	}
	return n, nil
}

func (r *CryptoRepo) GetCryptoPagoStatus(ctx context.Context, reservaID string) (estado, txHash string, confirmations int, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT estado, COALESCE(crypto_tx_hash,''), COALESCE(crypto_confirmations,0)
		FROM pagos WHERE reserva_id = $1 AND metodo_pago = 'CRIPTO'
		ORDER BY fecha_creacion DESC LIMIT 1
	`, reservaID).Scan(&estado, &txHash, &confirmations)
	return
}

func (r *CryptoRepo) SolicitarVerificacionManual(ctx context.Context, reservaID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE pagos SET estado = 'VERIFICACION_MANUAL', referencia = 'Verificacion manual solicitada'
		WHERE reserva_id = $1 AND metodo_pago = 'CRIPTO'
	`, reservaID)
	return err
}

func (r *CryptoRepo) CancelarCryptoFallidaWithDB(ctx context.Context, db DBTX, reservaID, userID string) error {
	_, err := db.Exec(ctx, `
		UPDATE pagos SET estado = 'ANULADA', referencia = 'Crypto - verificacion fallida, cancelada por usuario'
		WHERE reserva_id = $1 AND metodo_pago = 'CRIPTO' AND estado = 'PENDIENTE'
	`, reservaID)
	if err != nil {
		return fmt.Errorf("cancel crypto pago: %w", err)
	}
	_, err = db.Exec(ctx, `
		UPDATE reservas SET estado = 'ANULADA'
		WHERE id = $1 AND huesped_id = $2 AND estado IN ('PENDIENTE_PAGO', 'PENDIENTE')
	`, reservaID, userID)
	if err != nil {
		return fmt.Errorf("cancel crypto reserva: %w", err)
	}
	return nil
}

func (r *CryptoRepo) ExpirarCryptoAbandonadosWithDB(ctx context.Context, db DBTX) (int, error) {
	tag, err := db.Exec(ctx, `
		UPDATE reservas SET estado = 'ANULADA'
		WHERE estado IN ('PENDIENTE_PAGO')
		  AND fecha_creacion < NOW() - INTERVAL '2 hours'
		  AND id IN (SELECT reserva_id FROM pagos WHERE metodo_pago = 'CRIPTO' AND estado = 'PENDIENTE')
	`)
	if err != nil {
		return 0, fmt.Errorf("expirar reservas crypto: %w", err)
	}
	n := int(tag.RowsAffected())

	_, err = db.Exec(ctx, `
		UPDATE pagos SET estado = 'ANULADA', referencia = 'Crypto - expirada automaticamente (sin TX en 2h)'
		WHERE metodo_pago = 'CRIPTO' AND estado = 'PENDIENTE'
		  AND fecha_creacion < NOW() - INTERVAL '2 hours'
	`)
	if err != nil {
		return n, fmt.Errorf("expirar pagos crypto: %w", err)
	}
	return n, nil
}
