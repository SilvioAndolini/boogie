'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { headers } from 'next/headers'

export type EntidadAuditable =
  | 'usuario'
  | 'propiedad'
  | 'reserva'
  | 'pago'
  | 'verificacion'
  | 'wallet'
  | 'resena'
  | 'notificacion'
  | 'configuracion'

export async function requireAdmin() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado', userId: null } as const

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    console.warn(`[requireAdmin] Intento de acceso no autorizado: ${user.email}`)
    return { error: 'Sin permisos de administrador', userId: null } as const
  }

  return { userId: user.id, error: null } as const
}

export async function logAdminAction(params: {
  accion: string
  entidad: EntidadAuditable
  entidadId?: string
  detalles?: Record<string, unknown>
}) {
  const admin = createAdminClient()

  let ip: string | undefined
  let userAgent: string | undefined
  try {
    const hdrs = await headers()
    ip = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || undefined
    userAgent = hdrs.get('user-agent') || undefined
  } catch {}

  const user = await getUsuarioAutenticado()
  if (!user) return

  const { error } = await admin.from('admin_audit_log').insert({
    admin_id: user.id,
    accion: params.accion,
    entidad: params.entidad,
    entidad_id: params.entidadId || null,
    detalles: params.detalles || {},
    ip: ip || null,
    user_agent: userAgent || null,
  })

  if (error) {
    console.error('[logAdminAction] Error:', error.message)
  }
}
