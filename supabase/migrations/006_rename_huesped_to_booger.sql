-- 006_rename_huesped_to_booger.sql
-- Rename HUESPED enum value to BOOGER in the Rol enum

ALTER TYPE "Rol" RENAME VALUE 'HUESPED' TO 'BOOGER';
