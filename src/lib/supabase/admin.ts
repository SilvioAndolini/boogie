// Cliente de Supabase con privilegios de administrador (service role)
// Solo usar en operaciones del backend que requieran permisos elevados

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
