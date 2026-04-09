CREATE TABLE IF NOT EXISTS secciones_destacadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(100) NOT NULL,
  subtitulo VARCHAR(200),
  tipo_filtro VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  filtro_estado VARCHAR(50),
  filtro_ciudad VARCHAR(100),
  propiedad_ids UUID[] DEFAULT '{}',
  orden INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN secciones_destacadas.tipo_filtro IS 'MANUAL: admin elige propiedades | RATING: mejores valoradas | POPULAR: mas reservadas';
COMMENT ON COLUMN secciones_destacadas.filtro_estado IS 'Filtro por estado (ubicacion) cuando tipo_filtro no es MANUAL';
COMMENT ON COLUMN secciones_destacadas.filtro_ciudad IS 'Filtro por ciudad cuando tipo_filtro no es MANUAL';

INSERT INTO secciones_destacadas (titulo, subtitulo, tipo_filtro, filtro_estado, orden) VALUES
  ('Mejores Boogies', 'Los mejor valorados por nuestra comunidad', 'RATING', NULL, 1),
  ('Boogies populares en Caracas', 'Los favoritos en la capital', 'POPULAR', 'Distrito Capital', 2),
  ('Boogies de ensueño en La Guaira', 'Escapadas perfectas frente al mar', 'POPULAR', 'Vargas', 3);
