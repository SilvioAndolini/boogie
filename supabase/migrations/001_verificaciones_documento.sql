CREATE TYPE metodo_verificacion AS ENUM ('METAMAP', 'MANUAL');
CREATE TYPE estado_verificacion AS ENUM ('PENDIENTE', 'EN_PROCESO', 'APROBADA', 'RECHAZADA');

CREATE TABLE verificaciones_documento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  metodo metodo_verificacion NOT NULL,
  estado estado_verificacion NOT NULL DEFAULT 'PENDIENTE',
  metamap_flow_id TEXT,
  metamap_identity_id TEXT,
  metamap_resultado JSONB,
  foto_frontal_url TEXT,
  foto_trasera_url TEXT,
  foto_selfie_url TEXT,
  revisado_por TEXT REFERENCES usuarios(id),
  motivo_rechazo TEXT,
  fecha_revision TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verificaciones_usuario ON verificaciones_documento(usuario_id);
CREATE INDEX idx_verificaciones_estado ON verificaciones_documento(estado);
CREATE INDEX idx_verificaciones_metamap_identity ON verificaciones_documento(metamap_identity_id);

ALTER TABLE verificaciones_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY verificaciones_propias ON verificaciones_documento
  FOR SELECT USING (usuario_id = auth.uid()::text);

CREATE POLICY verificaciones_insertar ON verificaciones_documento
  FOR INSERT WITH CHECK (usuario_id = auth.uid()::text);

CREATE POLICY verificaciones_admin_update ON verificaciones_documento
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::text AND rol = 'ADMIN')
  );

CREATE POLICY verificaciones_admin_select ON verificaciones_documento
  FOR SELECT USING (
    usuario_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid()::text AND rol = 'ADMIN')
  );
