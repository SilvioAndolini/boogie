CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
  estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'PAUSADA', 'SUSPENDIDA')),
  saldo_usd DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (saldo_usd >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('RECARGA', 'PAGO', 'REEMBOLSO')),
  monto_usd DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  referencia_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_usuario ON wallets(usuario_id);
CREATE INDEX idx_wallet_transacciones_wallet ON wallet_transacciones(wallet_id);
