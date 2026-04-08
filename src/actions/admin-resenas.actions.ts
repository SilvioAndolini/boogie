'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { adminModerarResenaSchema } from '@/lib/admin-validations'
import { revalidatePath } from 'next/cache'

export async function getResenasAdmin(filtros?: {
  calificacionMin?: number
  busqueda?: string
  pagina?: number
}) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const pagina = filtros?.pagina || 1
  const limite = 30
  const offset = (pagina - 1) * limite

  let query = admin
    .from('resenas')
    .select(`
      id, calificacion, limpieza, comunicacion, ubicacion, valor,
      comentario, respuesta, fecha_creacion, fecha_respuesta,
      oculta,
      propiedades (id, titulo),
      usuarios!resenas_autor_id_fkey (id, nombre, apellido, email, avatar_url),
      reservas (id, codigo)
    `, { count: 'exact' })
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + limite - 1)

  if (filtros?.calificacionMin) {
    query = query.gte('calificacion', filtros.calificacionMin)
  }

  if (filtros?.busqueda) {
    const q = filtros.busqueda.trim()
    query = query.or(`comentario.ilike.%${q}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[getResenasAdmin] Error:', error.message)
    return { error: 'Error al cargar reseñas' }
  }

  const { count: totalResenas } = await admin
    .from('resenas')
    .select('id', { count: 'exact', head: true })

  const { data: avgData } = await admin
    .from('resenas')
    .select('calificacion')

  const promedio = avgData && avgData.length > 0
    ? avgData.reduce((sum, r) => sum + (r.calificacion || 0), 0) / avgData.length
    : 0

  const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of (avgData || [])) {
    const c = r.calificacion || 0
    if (c >= 1 && c <= 5) distribucion[c]++
  }

  return {
    resenas: data,
    total: count ?? 0,
    pagina,
    totalPaginas: Math.ceil((count ?? 0) / limite),
    stats: {
      total: totalResenas ?? 0,
      promedio: Math.round(promedio * 10) / 10,
      distribucion,
    },
  }
}

export async function moderarResenaAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    resenaId: formData.get('resenaId') as string,
    accion: formData.get('accion') as string,
    motivo: (formData.get('motivo') as string) || undefined,
  }

  const parsed = adminModerarResenaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { resenaId, accion, motivo } = parsed.data
  const admin = createAdminClient()

  if (accion === 'eliminar') {
    const { error } = await admin.from('resenas').delete().eq('id', resenaId)
    if (error) {
      console.error('[moderarResenaAdmin] Error deleting:', error.message)
      return { error: 'Error al eliminar la reseña' }
    }
  } else if (accion === 'ocultar') {
    const { error } = await admin.from('resenas').update({ oculta: true }).eq('id', resenaId)
    if (error) {
      console.error('[moderarResenaAdmin] Error hiding:', error.message)
      return { error: 'Error al ocultar la reseña' }
    }
  } else if (accion === 'mostrar') {
    const { error } = await admin.from('resenas').update({ oculta: false }).eq('id', resenaId)
    if (error) {
      console.error('[moderarResenaAdmin] Error showing:', error.message)
      return { error: 'Error al mostrar la reseña' }
    }
  }

  await logAdminAction({
    accion: `RESENA_${accion.toUpperCase()}`,
    entidad: 'resena',
    entidadId: resenaId,
    detalles: { accion, motivo: motivo || null },
  })

  revalidatePath('/admin/resenas')
  return { exito: true }
}
