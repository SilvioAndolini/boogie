-- 005_cascade_delete_usuarios.sql
-- Set ON DELETE CASCADE on all foreign keys referencing usuarios

-- Drop and recreate FKs from Prisma-managed tables

-- propiedades.propietario_id
ALTER TABLE propiedades
  DROP CONSTRAINT propiedades_propietario_id_fkey,
  ADD CONSTRAINT propiedades_propietario_id_fkey
    FOREIGN KEY (propietario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- reservas.huesped_id
ALTER TABLE reservas
  DROP CONSTRAINT reservas_huesped_id_fkey,
  ADD CONSTRAINT reservas_huesped_id_fkey
    FOREIGN KEY (huesped_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- pagos.usuario_id
ALTER TABLE pagos
  DROP CONSTRAINT pagos_usuario_id_fkey,
  ADD CONSTRAINT pagos_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- metodos_pago.usuario_id
ALTER TABLE metodos_pago
  DROP CONSTRAINT metodos_pago_usuario_id_fkey,
  ADD CONSTRAINT metodos_pago_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- resenas.autor_id
ALTER TABLE resenas
  DROP CONSTRAINT resenas_autor_id_fkey,
  ADD CONSTRAINT resenas_autor_id_fkey
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- resenas.anfitrion_id
ALTER TABLE resenas
  DROP CONSTRAINT resenas_anfitrion_id_fkey,
  ADD CONSTRAINT resenas_anfitrion_id_fkey
    FOREIGN KEY (anfitrion_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- notificaciones.usuario_id
ALTER TABLE notificaciones
  DROP CONSTRAINT notificaciones_usuario_id_fkey,
  ADD CONSTRAINT notificaciones_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- admin_audit_log.admin_id
ALTER TABLE admin_audit_log
  DROP CONSTRAINT admin_audit_log_admin_id_fkey,
  ADD CONSTRAINT admin_audit_log_admin_id_fkey
    FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- verificaciones_documento.revisado_por (SET NULL since it's optional)
ALTER TABLE verificaciones_documento
  DROP CONSTRAINT verificaciones_documento_revisado_por_fkey,
  ADD CONSTRAINT verificaciones_documento_revisado_por_fkey
    FOREIGN KEY (revisado_por) REFERENCES usuarios(id) ON DELETE SET NULL;
