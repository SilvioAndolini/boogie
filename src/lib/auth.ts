// Shared auth utilities - Server-side only
import { createClient } from '@/lib/supabase/server'

export async function getUsuarioAutenticado() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUsuarioAutenticadoConSesion() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return { user: session?.user ?? null, session }
}
