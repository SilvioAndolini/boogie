-- Add coupon fields to reservas table
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS cupon_id TEXT,
  ADD COLUMN IF NOT EXISTS descuento NUMERIC(12,2) NOT NULL DEFAULT 0;
