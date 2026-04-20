'use server'

import * as Sentry from '@sentry/nextjs'

import { goApi, goPost, GoAPIError } from '@/lib/go-api-client'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

type ResenasResult = {
  data?: Array<Record<string, unknown>>;
  stats?: { total: number; promedio: number; distribucion: Record<string, number> };
  error?: string;
}

export async function getResenasAdmin(filtros?: {
  calificacionMin?: number
  busqueda?: string
  pagina?: number
}): Promise<ResenasResult> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    const params = new URLSearchParams()
    if (filtros?.calificacionMin) params.set('calificacionMin', String(filtros.calificacionMin))
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda.trim())
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    const outer = await goApi<Record<string, unknown>>(qs ? `/api/v1/admin/resenas?${qs}` : '/api/v1/admin/resenas', { raw: true })
    const raw = (outer?.data ?? outer) as Record<string, unknown>
    return {
      data: (raw?.data ?? []) as Array<Record<string, unknown>>,
      stats: raw?.stats as { total: number; promedio: number; distribucion: Record<string, number> } | undefined,
    }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar reseñas' }
  }
}

export async function moderarResenaAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const resenaId = formData.get('resenaId') as string
  const accion = formData.get('accion') as string
  const motivo = (formData.get('motivo') as string) || undefined

  try {
    await goPost('/api/v1/admin/resenas/moderar', { resenaId, accion, motivo })
    revalidatePath('/admin/resenas')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al moderar la reseña' }
  }
}
