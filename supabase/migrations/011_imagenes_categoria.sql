ALTER TABLE imagenes_propiedad
ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) DEFAULT 'otro';

COMMENT ON COLUMN imagenes_propiedad.categoria IS 'Categoria de la foto: habitaciones, banos, cocina, areas_comunes, exterior, piscina, vistas, otro';
