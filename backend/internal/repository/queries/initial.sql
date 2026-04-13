-- name: GetUsuarioByID :one
SELECT id, email, nombre, apellido, rol, plan_suscripcion, verificado, activo, reputacion, created_at
FROM usuarios
WHERE id = $1;

-- name: GetPropiedadByID :one
SELECT id, propietario_id, titulo, slug, tipo_propiedad, precio_por_noche, moneda,
       politica_cancelacion, capacidad, dormitorios, banos, direccion, ciudad, estado,
       latitud, longitud, estado_publicacion, calificacion, cantidad_resenas, created_at
FROM propiedades
WHERE id = $1;

-- name: GetReservaByID :one
SELECT id, codigo, propiedad_id, huesped_id, fecha_entrada, fecha_salida,
       noches, precio_por_noche, subtotal, comision_plataforma, comision_anfitrion,
       total, moneda, cantidad_huespedes, estado, created_at
FROM reservas
WHERE id = $1;

-- name: FindConflictingReservas :many
SELECT id FROM reservas
WHERE propiedad_id = $1
  AND estado IN ('PENDIENTE', 'CONFIRMADA', 'EN_CURSO')
  AND fecha_entrada < $3
  AND fecha_salida > $2
LIMIT 1;

-- name: FindFechasBloqueadas :many
SELECT id FROM fechas_bloqueadas
WHERE propiedad_id = $1
  AND fecha_inicio < $3
  AND fecha_fin > $2
LIMIT 1;

-- name: InsertPago :one
INSERT INTO pagos (id, reserva_id, usuario_id, monto, moneda, metodo_pago, estado, referencia, fecha_creacion)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id;

-- name: UpdatePagoCrypto :exec
UPDATE pagos
SET crypto_tx_hash = $2, crypto_confirmations = $3, crypto_value_coin = $4,
    estado = $5, referencia = $6, fecha_verificacion = $7
WHERE id = $1;

-- name: UpdateReservaEstado :exec
UPDATE reservas
SET estado = $2, fecha_confirmacion = $3
WHERE id = $1;
