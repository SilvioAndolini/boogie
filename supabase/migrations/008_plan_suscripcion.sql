-- Agregar columna plan_suscripcion a tabla usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS plan_suscripcion VARCHAR(20) NOT NULL DEFAULT 'FREE';

-- Comentario
COMMENT ON COLUMN usuarios.plan_suscripcion IS 'Plan de suscripción: FREE o ULTRA';
