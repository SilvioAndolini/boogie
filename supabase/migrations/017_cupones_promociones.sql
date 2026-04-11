-- Migración: Cupones y Promociones
-- Sistema de códigos promocionales con criterios de aplicación

CREATE TABLE IF NOT EXISTS cupones (
  id TEXT PRIMARY KEY DEFAULT ('cpn_' || substr(gen_random_uuid()::text, 1, 12)),
  codigo VARCHAR(30) UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,

  tipo_descuento VARCHAR(20) NOT NULL DEFAULT 'PORCENTAJE'
    CHECK (tipo_descuento IN ('PORCENTAJE', 'MONTO_FIJO', 'NOCHES_GRATIS')),
  valor_descuento DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'USD',
  max_descuento DECIMAL(10, 2),

  tipo_aplicacion VARCHAR(30) NOT NULL DEFAULT 'CUALQUIER_RESERVA'
    CHECK (tipo_aplicacion IN (
      'PRIMERA_RESERVA', 'CUALQUIER_RESERVA', 'SOLO_ANFITRIONES', 'SOLO_HUESPEDES',
      'PROPIEDAD_ESPECIFICA', 'CIUDAD_ESPECIFICA', 'PLAN_ULTRA', 'RESERVA_MINIMA',
      'TEMPORADA_ALTA', 'TEMPORADA_BAJA', 'RESENA_POSITIVA', 'CUMPLEANERO',
      'USUARIO_NUEVO', 'USUARIO_ESPECIFICO'
    )),
  valor_aplicacion TEXT,

  min_compra DECIMAL(10, 2),
  min_noches INT,
  max_usos INT,
  max_usos_por_usuario INT DEFAULT 1,

  usos_actuales INT DEFAULT 0,

  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ NOT NULL,

  activo BOOLEAN DEFAULT TRUE,
  creado_por TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo, fecha_inicio, fecha_fin);

CREATE TABLE IF NOT EXISTS cupon_usos (
  id TEXT PRIMARY KEY DEFAULT ('cpu_' || substr(gen_random_uuid()::text, 1, 12)),
  cupon_id TEXT NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  reserva_id TEXT REFERENCES reservas(id),
  descuento_aplicado DECIMAL(10, 2) NOT NULL,
  fecha_uso TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cupon_usos_cupon ON cupon_usos(cupon_id);
CREATE INDEX IF NOT EXISTS idx_cupon_usos_usuario ON cupon_usos(usuario_id);

CREATE OR REPLACE FUNCTION update_cupones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cupones_updated_at ON cupones;
CREATE TRIGGER trg_cupones_updated_at
    BEFORE UPDATE ON cupones
    FOR EACH ROW
    EXECUTE FUNCTION update_cupones_updated_at();

-- Tabla de configuración dinámica (tasas de comisión, etc.)
CREATE TABLE IF NOT EXISTS platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO platform_config (key, value) VALUES
  ('comision_huesped', '{"valor": 0.06}'),
  ('comision_anfitrion', '{"valor": 0.03}')
ON CONFLICT (key) DO NOTHING;
