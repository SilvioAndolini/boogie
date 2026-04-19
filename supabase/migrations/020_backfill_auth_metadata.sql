-- Backfill app_metadata.rol and user_metadata (cedula, telefono)
-- from public.usuarios into auth.users for all existing users.
-- This enables the middleware to use JWT claims instead of DB queries.

CREATE OR REPLACE FUNCTION public.backfill_auth_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT u.id, u.rol, u.cedula, u.telefono
    FROM public.usuarios u
    WHERE EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id::uuid)
  LOOP
    UPDATE auth.users
    SET app_metadata = COALESCE(app_metadata, '{}'::jsonb)
                      || jsonb_build_object('rol', rec.rol)
    WHERE id = rec.id::uuid;

    IF rec.cedula IS NOT NULL AND rec.telefono IS NOT NULL THEN
      UPDATE auth.users
      SET user_metadata = COALESCE(user_metadata, '{}'::jsonb)
                          || jsonb_build_object(
                            'cedula', rec.cedula,
                            'telefono', rec.telefono
                          )
      WHERE id = rec.id::uuid;
    END IF;
  END LOOP;
END;
$$;

SELECT public.backfill_auth_metadata();

DROP FUNCTION public.backfill_auth_metadata();
