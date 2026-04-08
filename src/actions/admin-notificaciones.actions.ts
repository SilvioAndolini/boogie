'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { adminNotificacionSchema } from '@/lib/admin-validations'
import { revalidatePath } from 'next/cache'

export async function enviarNotificacionAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    usuarioId: (formData.get('usuarioId') as string) || undefined,
    titulo: formData.get('titulo') as string,
    mensaje: formData.get('mensaje') as string,
    urlAccion: (formData.get('urlAccion') as string) || undefined,
  }

  const parsed = adminNotificacionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { usuarioId, titulo, mensaje, urlAccion } = parsed.data
  const admin = createAdminClient()

  if (usuarioId) {
    const { error } = await admin.from('notificaciones').insert({
      tipo: 'SISTEMA',
      titulo,
      mensaje,
      url_accion: urlAccion || null,
      usuario_id: usuarioId,
    })
    if (error) {
      console.error('[enviarNotificacionAdmin] Error:', error.message)
      return { error: 'Error al enviar la notificación' }
    }
  } else {
    const { data: usuarios } = await admin
      .from('usuarios')
      .select('id')
      .eq('activo', true)

    if (!usuarios || usuarios.length === 0) {
      return { error: 'No hay usuarios activos' }
    }

    const inserts = usuarios.map((u) => ({
      tipo: 'SISTEMA' as const,
      titulo,
      mensaje,
      url_accion: urlAccion || null,
      usuario_id: u.id,
    }))

    const { error } = await admin.from('notificaciones').insert(inserts)
    if (error) {
      console.error('[enviarNotificacionAdmin] Error broadcast:', error.message)
      return { error: 'Error al enviar notificaciones' }
    }

    await logAdminAction({
      accion: 'NOTIFICACION_BROADCAST',
      entidad: 'notificacion',
      detalles: { titulo, totalUsuarios: usuarios.length },
    })

    revalidatePath('/admin/notificaciones')
    return { exito: true, broadcast: true, total: usuarios.length }
  }

  await logAdminAction({
    accion: 'NOTIFICACION_ENVIADA',
    entidad: 'notificacion',
    detalles: { titulo, usuarioId },
  })

  revalidatePath('/admin/notificaciones')
  return { exito: true }
}

export async function getNotificacionesAdmin(filtros?: {
  pagina?: number
}) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const pagina = filtros?.pagina || 1
  const limite = 30
  const offset = (pagina - 1) * limite

  const { data, error, count } = await admin
    .from('notificaciones')
    .select(`
      id, tipo, titulo, mensaje, leida, url_accion, fecha_creacion,
      usuarios (id, nombre, apellido, email)
    `, { count: 'exact' })
    .eq('tipo', 'SISTEMA')
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) {
    console.error('[getNotificacionesAdmin] Error:', error.message)
    return { error: 'Error al cargar notificaciones' }
  }

  return {
    notificaciones: data,
    total: count ?? 0,
    pagina,
    totalPaginas: Math.ceil((count ?? 0) / limite),
  }
}
