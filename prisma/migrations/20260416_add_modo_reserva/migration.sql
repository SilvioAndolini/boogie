ALTER TYPE "ModoReserva" IS EXISTS (
  SELECT 1 FROM pg_type t WHERE t.typname = 'ModoReserva'
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ModoReserva') THEN
    CREATE TYPE "ModoReserva" AS ENUM ('MANUAL', 'AUTOMATICO');
  END IF;
END $$;

ALTER TABLE propiedades ADD COLUMN IF NOT EXISTS modo_reserva "ModoReserva" NOT NULL DEFAULT 'MANUAL';
