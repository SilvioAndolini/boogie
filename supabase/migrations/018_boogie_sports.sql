-- =============================================
-- 018: Boogie Sports — Canchas Deportivas
-- =============================================

-- Enum de tipo de cancha
CREATE TYPE tipo_cancha AS ENUM (
  'PADEL', 'TENIS', 'BASKET', 'FUTBOL', 'FUTBOLITO',
  'VOLEIBOL', 'MULTIPROPOSITO'
);

-- Tabla principal de canchas deportivas
CREATE TABLE canchas_deportivas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  tipo_cancha tipo_cancha NOT NULL,
  superficie TEXT,
  es_iluminada BOOLEAN DEFAULT false,
  precio_por_hora DECIMAL(10,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'VES')),
  capacidad_maxima INT NOT NULL DEFAULT 1,
  duracion_minima INT NOT NULL DEFAULT 60,
  horario_apertura TEXT NOT NULL DEFAULT '06:00',
  horario_cierre TEXT NOT NULL DEFAULT '22:00',
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  estado TEXT NOT NULL,
  zona TEXT,
  latitud FLOAT,
  longitud FLOAT,
  reglas TEXT,
  politica_cancelacion TEXT NOT NULL DEFAULT 'MODERADA' CHECK (politica_cancelacion IN ('FLEXIBLE', 'MODERADA', 'ESTRICTA')),
  slug TEXT UNIQUE,
  estado_publicacion TEXT NOT NULL DEFAULT 'BORRADOR' CHECK (estado_publicacion IN ('BORRADOR', 'PENDIENTE_REVISION', 'PUBLICADA', 'PAUSADA', 'SUSPENDIDA')),
  destacada BOOLEAN DEFAULT false,
  fecha_publicacion TIMESTAMPTZ,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  vistas_totales INT DEFAULT 0,
  rating_promedio FLOAT,
  total_resenas INT DEFAULT 0,
  dueno_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_canchas_ciudad ON canchas_deportivas(ciudad);
CREATE INDEX idx_canchas_estado ON canchas_deportivas(estado);
CREATE INDEX idx_canchas_tipo ON canchas_deportivas(tipo_cancha);
CREATE INDEX idx_canchas_publicacion ON canchas_deportivas(estado_publicacion);
CREATE INDEX idx_canchas_precio ON canchas_deportivas(precio_por_hora);
CREATE INDEX idx_canchas_rating ON canchas_deportivas(rating_promedio);
CREATE INDEX idx_canchas_dueno ON canchas_deportivas(dueno_id);

-- Imágenes de canchas
CREATE TABLE imagenes_cancha (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt TEXT,
  categoria TEXT DEFAULT 'otro',
  orden INT DEFAULT 0,
  es_principal BOOLEAN DEFAULT false,
  cancha_id TEXT NOT NULL REFERENCES canchas_deportivas(id) ON DELETE CASCADE,
  fecha_subida TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_imagenes_cancha_cancha ON imagenes_cancha(cancha_id);

-- Amenidades de canchas (reutiliza tabla amenidades)
CREATE TABLE cancha_amenidades (
  cancha_id TEXT NOT NULL REFERENCES canchas_deportivas(id) ON DELETE CASCADE,
  amenidad_id TEXT NOT NULL REFERENCES amenidades(id),
  PRIMARY KEY (cancha_id, amenidad_id)
);

-- Reservas de canchas
CREATE TABLE reservas_cancha (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  duracion_minutos INT NOT NULL,
  precio_por_hora DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  comision_plataforma DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'VES')),
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA')),
  cantidad_jugadores INT DEFAULT 1,
  notas TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_confirmacion TIMESTAMPTZ,
  fecha_cancelacion TIMESTAMPTZ,
  cancha_id TEXT NOT NULL REFERENCES canchas_deportivas(id),
  huesped_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE INDEX idx_reservas_cancha_cancha_fecha ON reservas_cancha(cancha_id, fecha, hora_inicio, hora_fin);
CREATE INDEX idx_reservas_cancha_huesped ON reservas_cancha(huesped_id);
CREATE INDEX idx_reservas_cancha_estado ON reservas_cancha(estado);

-- Pagos de canchas
CREATE TABLE pagos_cancha (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  monto DECIMAL(10,2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'VES')),
  monto_equivalente DECIMAL(10,2),
  moneda_equivalente TEXT,
  tasa_cambio DECIMAL(12,6),
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE', 'EFECTIVO_FARMATODO', 'USDT', 'EFECTIVO', 'CRIPTO', 'WALLET')),
  referencia TEXT,
  comprobante TEXT,
  crypto_address TEXT,
  crypto_tx_hash TEXT,
  crypto_confirmations INT DEFAULT 0,
  crypto_value_coin TEXT,
  crypto_qr_code TEXT,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_VERIFICACION', 'VERIFICADO', 'ACREDITADO', 'RECHAZADO', 'REEMBOLSADO')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_verificacion TIMESTAMPTZ,
  verificado_por TEXT,
  notas_verificacion TEXT,
  reserva_id TEXT NOT NULL REFERENCES reservas_cancha(id),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id)
);

CREATE INDEX idx_pagos_cancha_estado ON pagos_cancha(estado);
CREATE INDEX idx_pagos_cancha_reserva ON pagos_cancha(reserva_id);

-- Reseñas de canchas
CREATE TABLE resenas_cancha (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT NOT NULL,
  respuesta TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_respuesta TIMESTAMPTZ,
  cancha_id TEXT NOT NULL REFERENCES canchas_deportivas(id),
  autor_id TEXT NOT NULL REFERENCES usuarios(id),
  reserva_id TEXT UNIQUE NOT NULL REFERENCES reservas_cancha(id)
);

CREATE INDEX idx_resenas_cancha_cancha ON resenas_cancha(cancha_id);

-- Amenidades deportivas
INSERT INTO amenidades (id, nombre, icono, categoria) VALUES
  (gen_random_uuid(), 'Iluminación nocturna', 'lightbulb', 'ESENCIALES'),
  (gen_random_uuid(), 'Vestuarios', 'shirt', 'ESENCIALES'),
  (gen_random_uuid(), 'Duchas', 'droplets', 'ESENCIALES'),
  (gen_random_uuid(), 'Estacionamiento', 'car', 'ESENCIALES'),
  (gen_random_uuid(), 'Arriendo de equipos', 'package', 'COMODIDADES'),
  (gen_random_uuid(), 'Cancha techada', 'warehouse', 'COMODIDADES'),
  (gen_random_uuid(), 'Graderías', 'users', 'COMODIDADES'),
  (gen_random_uuid(), 'Servicio de bar', 'beer', 'SERVICIOS'),
  (gen_random_uuid(), 'Puntuación electrónica', 'monitor', 'COMODIDADES'),
  (gen_random_uuid(), 'Césped sintético', 'leaf', 'COMODIDADES');

-- RLS Policies
ALTER TABLE canchas_deportivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_cancha ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancha_amenidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas_cancha ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_cancha ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas_cancha ENABLE ROW LEVEL SECURITY;

-- Canchas: cualquiera puede ver publicadas, dueños pueden ver las suyas
CREATE POLICY "Canchas publicadas visibles" ON canchas_deportivas FOR SELECT USING (estado_publicacion = 'PUBLICADA');
CREATE POLICY "Dueno ve sus canchas" ON canchas_deportivas FOR SELECT USING (dueno_id = auth.uid()::text);
CREATE POLICY "Dueno crea canchas" ON canchas_deportivas FOR INSERT WITH CHECK (dueno_id = auth.uid()::text);
CREATE POLICY "Dueno actualiza canchas" ON canchas_deportivas FOR UPDATE USING (dueno_id = auth.uid()::text);
CREATE POLICY "Dueno elimina canchas" ON canchas_deportivas FOR DELETE USING (dueno_id = auth.uid()::text);

-- Imágenes cancha
CREATE POLICY "Imagenes cancha visibles" ON imagenes_cancha FOR SELECT USING (true);
CREATE POLICY "Dueno gestiona imagenes" ON imagenes_cancha FOR ALL USING (
  cancha_id IN (SELECT id FROM canchas_deportivas WHERE dueno_id = auth.uid()::text)
);

-- Amenidades cancha
CREATE POLICY "Amenidades cancha visibles" ON cancha_amenidades FOR SELECT USING (true);
CREATE POLICY "Dueno gestiona amenidades" ON cancha_amenidades FOR ALL USING (
  cancha_id IN (SELECT id FROM canchas_deportivas WHERE dueno_id = auth.uid()::text)
);

-- Reservas cancha
CREATE POLICY "Huesped ve sus reservas cancha" ON reservas_cancha FOR SELECT USING (huesped_id = auth.uid()::text);
CREATE POLICY "Dueno ve reservas de sus canchas" ON reservas_cancha FOR SELECT USING (
  cancha_id IN (SELECT id FROM canchas_deportivas WHERE dueno_id = auth.uid()::text)
);
CREATE POLICY "Huesped crea reserva cancha" ON reservas_cancha FOR INSERT WITH CHECK (huesped_id = auth.uid()::text);
CREATE POLICY "Dueno actualiza reserva cancha" ON reservas_cancha FOR UPDATE USING (
  cancha_id IN (SELECT id FROM canchas_deportivas WHERE dueno_id = auth.uid()::text) OR huesped_id = auth.uid()::text
);

-- Pagos cancha
CREATE POLICY "Usuario ve sus pagos cancha" ON pagos_cancha FOR SELECT USING (usuario_id = auth.uid()::text);
CREATE POLICY "Dueno ve pagos de sus canchas" ON pagos_cancha FOR SELECT USING (
  reserva_id IN (SELECT rc.id FROM reservas_cancha rc JOIN canchas_deportivas cd ON rc.cancha_id = cd.id WHERE cd.dueno_id = auth.uid()::text)
);
CREATE POLICY "Usuario crea pago cancha" ON pagos_cancha FOR INSERT WITH CHECK (usuario_id = auth.uid()::text);

-- Reseñas cancha
CREATE POLICY "Resenas cancha visibles" ON resenas_cancha FOR SELECT USING (true);
CREATE POLICY "Autor crea resena cancha" ON resenas_cancha FOR INSERT WITH CHECK (autor_id = auth.uid()::text);
CREATE POLICY "Dueno responde resena cancha" ON resenas_cancha FOR UPDATE USING (
  cancha_id IN (SELECT id FROM canchas_deportivas WHERE dueno_id = auth.uid()::text)
);
