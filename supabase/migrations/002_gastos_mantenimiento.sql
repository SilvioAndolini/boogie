-- Tabla de gastos de mantenimiento para propiedades (boogies)
CREATE TABLE IF NOT EXISTS gastos_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id TEXT NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
  moneda TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'VES')),
  categoria TEXT NOT NULL CHECK (categoria IN ('reparacion', 'limpieza', 'mobiliario', 'servicios', 'otro')),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gastos_propiedad ON gastos_mantenimiento(propiedad_id);
CREATE INDEX idx_gastos_fecha ON gastos_mantenimiento(fecha);
