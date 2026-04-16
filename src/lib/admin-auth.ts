'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { isCeoEmail } from '@/lib/admin-constants'

export async function requireAdmin() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado', userId: null, isCeo: false } as const

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol, email')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    console.warn(`[requireAdmin] Intento de acceso no autorizado: ${user.email}`)
    return { error: 'Sin permisos de administrador', userId: null, isCeo: false } as const
  }

  return { userId: user.id, error: null, isCeo: isCeoEmail(usuario.email) } as const
}
