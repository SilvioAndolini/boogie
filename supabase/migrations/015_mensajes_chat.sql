-- 015: Sistema de mensajería entre usuarios
-- Tablas: conversaciones, mensajes, mensajes_rapidos

-- ============================================
-- CONVERSACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS conversaciones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_1 TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  participante_2 TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  propiedad_id TEXT REFERENCES propiedades(id) ON DELETE SET NULL,
  reserva_id TEXT REFERENCES reservas(id) ON DELETE SET NULL,
  ultimo_mensaje_at TIMESTAMPTZ DEFAULT NOW(),
  ultimo_mensaje_preview TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT participante_1_diferente CHECK (participante_1 != participante_2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversaciones_participantes
  ON conversaciones (
    LEAST(participante_1, participante_2),
    GREATEST(participante_1, participante_2)
  );

CREATE INDEX IF NOT EXISTS idx_conversaciones_p1 ON conversaciones (participante_1);
CREATE INDEX IF NOT EXISTS idx_conversaciones_p2 ON conversaciones (participante_2);
CREATE INDEX IF NOT EXISTS idx_conversaciones_propiedad ON conversaciones (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_reserva ON conversaciones (reserva_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ultimo ON conversaciones (ultimo_mensaje_at DESC);

-- ============================================
-- MENSAJES
-- ============================================
CREATE TABLE IF NOT EXISTS mensajes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id TEXT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
  remitente_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido TEXT,
  tipo TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagen', 'rapido')),
  imagen_url TEXT,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes (conversacion_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_mensajes_remitente ON mensajes (remitente_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_no_leidos ON mensajes (conversacion_id, leido) WHERE leido = FALSE;

-- ============================================
-- MENSAJES RAPIDOS (plantillas por usuario)
-- ============================================
CREATE TABLE IF NOT EXISTS mensajes_rapidos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ambos' CHECK (tipo IN ('anfitrion', 'booger', 'ambos')),
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_rapidos_usuario ON mensajes_rapidos (usuario_id, orden);

-- ============================================
-- FUNCION: contar mensajes no leidos por usuario
-- ============================================
CREATE OR REPLACE FUNCTION mensajes_no_leidos(p_usuario_id TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM mensajes m
  JOIN conversaciones c ON c.id = m.conversacion_id
  WHERE m.remitente_id != p_usuario_id
    AND m.leido = FALSE
    AND (c.participante_1 = p_usuario_id OR c.participante_2 = p_usuario_id);
$$ LANGUAGE SQL STABLE;

-- ============================================
-- FUNCION: obtener o crear conversacion
-- ============================================
CREATE OR REPLACE FUNCTION obtener_o_crear_conversacion(
  p_usuario_1 TEXT,
  p_usuario_2 TEXT,
  p_propiedad_id TEXT DEFAULT NULL,
  p_reserva_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_conversacion_id TEXT;
BEGIN
  SELECT id INTO v_conversacion_id
  FROM conversaciones
  WHERE LEAST(participante_1, participante_2) = LEAST(p_usuario_1, p_usuario_2)
    AND GREATEST(participante_1, participante_2) = GREATEST(p_usuario_1, p_usuario_2)
  LIMIT 1;

  IF v_conversacion_id IS NULL THEN
    INSERT INTO conversaciones (participante_1, participante_2, propiedad_id, reserva_id)
    VALUES (p_usuario_1, p_usuario_2, p_propiedad_id, p_reserva_id)
    RETURNING id INTO v_conversacion_id;
  END IF;

  RETURN v_conversacion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE conversaciones;
