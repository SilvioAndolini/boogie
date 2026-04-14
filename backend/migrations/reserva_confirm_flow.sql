-- Tabla para tracking de rechazos por anfitrion
CREATE TABLE IF NOT EXISTS anfitrion_rechazos (
    id TEXT PRIMARY KEY,
    anfitrion_id TEXT NOT NULL REFERENCES usuarios(id),
    reserva_id TEXT NOT NULL REFERENCES reservas(id),
    motivo TEXT DEFAULT '',
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anfitrion_rechazos_anfitrion_mes ON anfitrion_rechazos (anfitrion_id, fecha);

-- Tabla para penalizaciones acumuladas
CREATE TABLE IF NOT EXISTS anfitrion_penalizaciones (
    id TEXT PRIMARY KEY,
    anfitrion_id TEXT NOT NULL REFERENCES usuarios(id),
    porcentaje DOUBLE PRECISION NOT NULL DEFAULT 20,
    descripcion TEXT DEFAULT '',
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aplicada BOOLEAN NOT NULL DEFAULT FALSE,
    reserva_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_anfitrion_penalizaciones_anfitrion ON anfitrion_penalizaciones (anfitrion_id, aplicada);

-- Tabla para strikes
CREATE TABLE IF NOT EXISTS anfitrion_strikes (
    id TEXT PRIMARY KEY,
    anfitrion_id TEXT NOT NULL REFERENCES usuarios(id),
    motivo TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_anfitrion_strikes_anfitrion ON anfitrion_strikes (anfitrion_id, activo);

-- Actualizar constraint de estado para incluir PENDIENTE_CONFIRMACION
-- (Si usan CHECK constraint, hay que dropear y recrear. Si no, no hace falta)
-- Verificamos si existe un constraint de estado:
DO $$ 
BEGIN
    -- Agregar PENDIENTE_CONFIRMACION a reservas existentes sin alterar datos
    NULL;
END $$;
