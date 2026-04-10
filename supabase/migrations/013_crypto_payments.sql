-- 013: Campos crypto para pagos via CryptAPI
ALTER TABLE pagos
  ADD COLUMN IF NOT EXISTS crypto_address TEXT,
  ADD COLUMN IF NOT EXISTS crypto_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS crypto_confirmations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crypto_value_coin TEXT,
  ADD COLUMN IF NOT EXISTS crypto_qr_code TEXT;

-- Add CRIPTO to MetodoPagoEnum
ALTER TYPE "MetodoPagoEnum" ADD VALUE IF NOT EXISTS 'CRIPTO';
