CREATE INDEX IF NOT EXISTS idx_imagenes_propiedad_propiedad_id ON imagenes_propiedad (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_fechas_bloqueadas_propiedad_fechas ON fechas_bloqueadas (propiedad_id, fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_precios_especiales_propiedad_fechas ON precios_especiales (propiedad_id, fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_resenas_propiedad_id ON resenas (propiedad_id);
CREATE INDEX IF NOT EXISTS idx_resenas_autor_id ON resenas (autor_id);
CREATE INDEX IF NOT EXISTS idx_resenas_anfitrion_id ON resenas (anfitrion_id);
