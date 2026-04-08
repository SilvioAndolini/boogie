CREATE TYPE entidad_auditable AS ENUM (
  'usuario',
  'propiedad',
  'reserva',
  'pago',
  'verificacion',
  'wallet',
  'resena',
  'notificacion',
  'configuracion'
);

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES usuarios(id),
  accion TEXT NOT NULL,
  entidad entidad_auditable NOT NULL,
  entidad_id TEXT,
  detalles JSONB DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_entidad ON admin_audit_log(entidad, entidad_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_accion ON admin_audit_log(accion);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_admin_select ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::text AND rol = 'ADMIN')
  );

CREATE POLICY audit_admin_insert ON admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::text AND rol = 'ADMIN')
  );
