SELECT column_name FROM information_schema.columns WHERE table_name = 'propiedades' AND column_name IN ('capacidad', 'capacidad_maxima') ORDER BY column_name;
