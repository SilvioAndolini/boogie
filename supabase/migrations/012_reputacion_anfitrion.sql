ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS reputacion DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reputacion_manual BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN usuarios.reputacion IS 'Reputacion del anfitrion. Si reputacion_manual es true, este valor fue seteado por un admin. Si es false, se calcula automaticamente desde las resenas.';
COMMENT ON COLUMN usuarios.reputacion_manual IS 'Si es true, la reputacion fue establecida manualmente por un admin y no se recalcula automaticamente.';
