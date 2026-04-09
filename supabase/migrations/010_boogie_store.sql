-- Boogie Store: Nuevas tablas
-- Ejecutar en Supabase SQL Editor

-- Enums
CREATE TYPE "CategoriaStoreProducto" AS ENUM ('HIGIENE', 'CUIDADO_PERSONAL', 'CONSUMIBLES', 'SNACKS', 'BEBIDAS', 'OTRO');
CREATE TYPE "CategoriaStoreServicio" AS ENUM ('GASTRONOMIA', 'UTILIDADES', 'TRANSPORTE', 'LIMPIEZA', 'OTRO');
CREATE TYPE "TipoPrecio" AS ENUM ('FIJO', 'POR_NOCHE');

-- Tabla de productos
CREATE TABLE "store_productos" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "imagen_url" TEXT,
    "categoria" "CategoriaStoreProducto" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_productos_pkey" PRIMARY KEY ("id")
);

-- Tabla de servicios
CREATE TABLE "store_servicios" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "tipo_precio" "TipoPrecio" NOT NULL,
    "imagen_url" TEXT,
    "categoria" "CategoriaStoreServicio" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_servicios_pkey" PRIMARY KEY ("id")
);

-- Tabla de items del store en reservas
CREATE TABLE "reserva_store_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "reserva_id" TEXT NOT NULL,
    "tipo_item" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "moneda" "Moneda" NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "producto_id" TEXT,
    "servicio_id" TEXT,
    CONSTRAINT "reserva_store_items_pkey" PRIMARY KEY ("id")
);

-- Indices
CREATE INDEX "store_productos_categoria_idx" ON "store_productos"("categoria");
CREATE INDEX "store_productos_activo_idx" ON "store_productos"("activo");
CREATE INDEX "store_servicios_categoria_idx" ON "store_servicios"("categoria");
CREATE INDEX "store_servicios_activo_idx" ON "store_servicios"("activo");
CREATE INDEX "reserva_store_items_reserva_id_idx" ON "reserva_store_items"("reserva_id");

-- Foreign keys
ALTER TABLE "reserva_store_items" ADD CONSTRAINT "reserva_store_items_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reserva_store_items" ADD CONSTRAINT "reserva_store_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "store_productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reserva_store_items" ADD CONSTRAINT "reserva_store_items_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "store_servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
