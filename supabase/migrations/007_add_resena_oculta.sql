-- 007_add_resena_oculta.sql
-- Add oculta column to resenas for admin moderation

ALTER TABLE resenas ADD COLUMN IF NOT EXISTS oculta BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_resenas_oculta ON resenas(oculta) WHERE oculta = true;
