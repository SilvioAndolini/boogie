-- name: GetReservaByID :one
SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
       r.fecha_entrada, r.fecha_salida, r.noches,
       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
       r.total, r.moneda, r.cantidad_huespedes, r.estado,
       r.notas_huesped, r.fecha_creacion, r.fecha_confirmacion,
       r.fecha_cancelacion,
       p.titulo as propiedad_titulo, p.slug as propiedad_slug,
       p.propietario_id, p.politica_cancelacion,
       p.direccion as propiedad_direccion, p.ciudad as propiedad_ciudad,
       u.nombre as huesped_nombre, u.apellido as huesped_apellido, u.email as huesped_email
FROM reservas r
JOIN propiedades p ON p.id = r.propiedad_id
JOIN usuarios u ON u.id = r.huesped_id
WHERE r.id = $1;

-- name: GetReservaByCodigo :one
SELECT id, codigo, propiedad_id, huesped_id,
       fecha_entrada, fecha_salida, noches,
       precio_por_noche, subtotal, comision_plataforma, comision_anfitrion,
       total, moneda, cantidad_huespedes, estado,
       notas_huesped, fecha_creacion
FROM reservas
WHERE codigo = $1;

-- name: ListReservasByHuesped :many
SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
       r.fecha_entrada, r.fecha_salida, r.noches,
       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
       r.total, r.moneda, r.cantidad_huespedes, r.estado,
       r.notas_huesped, r.fecha_creacion,
       p.titulo as propiedad_titulo, p.slug as propiedad_slug,
       p.direccion as propiedad_direccion, p.ciudad as propiedad_ciudad
FROM reservas r
JOIN propiedades p ON p.id = r.propiedad_id
WHERE r.huesped_id = $1
ORDER BY r.fecha_creacion DESC
LIMIT $2 OFFSET $3;

-- name: CountReservasByHuesped :one
SELECT COUNT(*) FROM reservas WHERE huesped_id = $1;

-- name: ListReservasByPropietario :many
SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
       r.fecha_entrada, r.fecha_salida, r.noches,
       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
       r.total, r.moneda, r.cantidad_huespedes, r.estado,
       r.notas_huesped, r.fecha_creacion,
       p.titulo as propiedad_titulo, p.slug as propiedad_slug,
       u.nombre as huesped_nombre, u.apellido as huesped_apellido, u.email as huesped_email
FROM reservas r
JOIN propiedades p ON p.id = r.propiedad_id
JOIN usuarios u ON u.id = r.huesped_id
WHERE p.propietario_id = $1
ORDER BY r.fecha_creacion DESC
LIMIT $2 OFFSET $3;

-- name: CountReservasByPropietario :one
SELECT COUNT(*) FROM reservas r
JOIN propiedades p ON p.id = r.propiedad_id
WHERE p.propietario_id = $1;

-- name: ListReservasByPropietarioAndEstado :many
SELECT r.id, r.codigo, r.propiedad_id, r.huesped_id,
       r.fecha_entrada, r.fecha_salida, r.noches,
       r.precio_por_noche, r.subtotal, r.comision_plataforma, r.comision_anfitrion,
       r.total, r.moneda, r.cantidad_huespedes, r.estado,
       r.notas_huesped, r.fecha_creacion,
       p.titulo as propiedad_titulo, p.slug as propiedad_slug,
       u.nombre as huesped_nombre, u.apellido as huesped_apellido
FROM reservas r
JOIN propiedades p ON p.id = r.propiedad_id
JOIN usuarios u ON u.id = r.huesped_id
WHERE p.propietario_id = $1 AND r.estado = $2
ORDER BY r.fecha_creacion DESC
LIMIT $3 OFFSET $4;

-- name: InsertReserva :one
INSERT INTO reservas (
    id, codigo, propiedad_id, huesped_id,
    fecha_entrada, fecha_salida, noches,
    precio_por_noche, subtotal, comision_plataforma, comision_anfitrion,
    total, moneda, cantidad_huespedes, estado, notas_huesped, fecha_creacion
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE', $15, NOW()
) RETURNING id;

-- name: ConfirmReserva :exec
UPDATE reservas
SET estado = 'CONFIRMADA', fecha_confirmacion = NOW()
WHERE id = $1 AND estado = 'PENDIENTE';

-- name: RechazarReserva :exec
UPDATE reservas
SET estado = 'RECHAZADA', fecha_cancelacion = NOW()
WHERE id = $1 AND estado = 'PENDIENTE';

-- name: CancelarReservaHuesped :exec
UPDATE reservas
SET estado = 'CANCELADA_HUESPED', fecha_cancelacion = NOW()
WHERE id = $1 AND estado IN ('PENDIENTE', 'CONFIRMADA');

-- name: CancelarReservaAnfitrion :exec
UPDATE reservas
SET estado = 'CANCELADA_ANFITRION', fecha_cancelacion = NOW()
WHERE id = $1 AND estado IN ('PENDIENTE', 'CONFIRMADA');

-- name: CompletarReserva :exec
UPDATE reservas
SET estado = 'COMPLETADA'
WHERE id = $1 AND estado = 'EN_CURSO';

-- name: GetReservasStatsByPropietario :one
SELECT
    COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'CONFIRMADA') as confirmadas,
    COUNT(*) FILTER (WHERE estado = 'EN_CURSO') as en_curso,
    COUNT(*) FILTER (WHERE estado = 'COMPLETADA') as completadas,
    COUNT(*) FILTER (WHERE estado IN ('CANCELADA_HUESPED', 'CANCELADA_ANFITRION')) as canceladas
FROM reservas r
JOIN propiedades p ON p.id = r.propiedad_id
WHERE p.propietario_id = $1;

-- name: GetReservasStatsByHuesped :one
SELECT
    COUNT(*) FILTER (WHERE estado = 'PENDIENTE') as pendientes,
    COUNT(*) FILTER (WHERE estado = 'CONFIRMADA') as confirmadas,
    COUNT(*) FILTER (WHERE estado = 'EN_CURSO') as en_curso,
    COUNT(*) FILTER (WHERE estado = 'COMPLETADA') as completadas,
    COUNT(*) FILTER (WHERE estado IN ('CANCELADA_HUESPED', 'CANCELADA_ANFITRION')) as canceladas
FROM reservas
WHERE huesped_id = $1;

-- name: InsertNotificacion :exec
INSERT INTO notificaciones (tipo, titulo, mensaje, usuario_id, url_accion)
VALUES ($1, $2, $3, $4, $5);

-- name: GetFechasOcupadas :many
SELECT fecha_entrada as inicio, fecha_salida as fin
FROM reservas
WHERE propiedad_id = $1
  AND estado IN ('PENDIENTE', 'CONFIRMADA', 'EN_CURSO');

-- name: GetFechasBloqueadas :many
SELECT fecha_inicio as inicio, fecha_fin as fin
FROM fechas_bloqueadas
WHERE propiedad_id = $1;

-- name: ListPagosByReserva :many
SELECT id, monto, moneda, metodo_pago, estado, referencia, comprobante,
       crypto_address, crypto_tx_hash, crypto_confirmations, crypto_value_coin,
       fecha_creacion, fecha_verificacion
FROM pagos
WHERE reserva_id = $1
ORDER BY fecha_creacion DESC;

-- name: InsertPagoManual :one
INSERT INTO pagos (id, reserva_id, usuario_id, monto, moneda, metodo_pago, estado,
                   referencia, comprobante, banco_emisor, telefono_emisor, notas, fecha_creacion)
VALUES ($1, $2, $3, $4, $5, $6, 'PENDIENTE', $7, $8, $9, $10, $11, NOW())
RETURNING id;
