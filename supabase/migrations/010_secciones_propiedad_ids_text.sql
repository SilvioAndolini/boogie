ALTER TABLE secciones_destacadas
ALTER COLUMN propiedad_ids TYPE TEXT[] USING propiedad_ids::TEXT[];
