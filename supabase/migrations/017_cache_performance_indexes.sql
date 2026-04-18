CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propiedades_estado_publicacion
  ON propiedades (estado_publicacion);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propiedades_search_composite
  ON propiedades (estado_publicacion, ciudad, categoria);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propiedades_capacidad
  ON propiedades (capacidad_maxima);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propiedades_fecha_actualizacion
  ON propiedades (fecha_actualizacion DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_propiedades_es_express
  ON propiedades (es_express) WHERE es_express = true;
