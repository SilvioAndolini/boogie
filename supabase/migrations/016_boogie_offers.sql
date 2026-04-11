-- Migración: Boogie Offers (Negocia tu Boogie)
-- Sistema de ofertas donde el huésped propone un precio y el anfitrión acepta/rechaza
-- Al aceptar, el huésped tiene 2 horas para pagar

CREATE TABLE IF NOT EXISTS boogie_ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(30) UNIQUE DEFAULT 'OFR-' || substr(gen_random_uuid()::text, 1, 8),

  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  huesped_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  fecha_entrada DATE NOT NULL,
  fecha_salida DATE NOT NULL,
  noches INT NOT NULL,
  cantidad_huespedes INT NOT NULL DEFAULT 1,

  precio_original DECIMAL(10, 2) NOT NULL,
  precio_ofertado DECIMAL(10, 2) NOT NULL,
  moneda VARCHAR(3) DEFAULT 'USD',

  estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
    CHECK (estado IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA', 'PAGADA')),

  mensaje TEXT,
  motivo_rechazo TEXT,

  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_aprobada TIMESTAMPTZ,
  fecha_expiracion TIMESTAMPTZ,
  fecha_rechazada TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  reserva_id UUID REFERENCES reservas(id)
);

CREATE INDEX IF NOT EXISTS idx_boogie_ofertas_propiedad_estado ON boogie_ofertas(propiedad_id, estado);
CREATE INDEX IF NOT EXISTS idx_boogie_ofertas_huesped_estado ON boogie_ofertas(huesped_id, estado);
CREATE INDEX IF NOT EXISTS idx_boogie_ofertas_expiracion ON boogie_ofertas(estado, fecha_expiracion);

CREATE OR REPLACE FUNCTION update_boogie_ofertas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_boogie_ofertas_updated_at
    BEFORE UPDATE ON boogie_ofertas
    FOR EACH ROW
    EXECUTE FUNCTION update_boogie_ofertas_updated_at();

-- Actualizar enum de estado de oferta si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'estadooferta') THEN
        CREATE TYPE estadooferta AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA', 'PAGADA');
    END IF;
END
$$;
