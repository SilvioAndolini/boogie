ALTER TYPE "MetodoPagoEnum" ADD VALUE IF NOT EXISTS 'WALLET';

ALTER TYPE "MetodoPagoEnum" RENAME TO "_MetodoPagoEnum_old";

CREATE TYPE "MetodoPagoEnum" AS ENUM (
  'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE', 'EFECTIVO_FARMATODO',
  'USDT', 'EFECTIVO', 'CRIPTO', 'WALLET'
);

ALTER TABLE pagos ALTER COLUMN metodo_pago TYPE "MetodoPagoEnum"
  USING metodo_pago::text::"MetodoPagoEnum";

DROP TYPE "_MetodoPagoEnum_old";
