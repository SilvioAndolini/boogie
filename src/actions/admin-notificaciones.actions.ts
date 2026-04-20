'use server'

import * as Sentry from '@sentry/nextjs'

import { goApi, goPost, GoAPIError } from '@/lib/go-api-client'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function enviarNotificacionAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const usuarioId = (formData.get('usuarioId') as string) || undefined
  const titulo = formData.get('titulo') as string
  const mensaje = formData.get('mensaje') as string
  const urlAccion = (formData.get('urlAccion') as string) || undefined

  try {
    const result = await goPost<{ broadcast?: boolean; total?: number }>('/api/v1/admin/notificaciones', { usuarioId, titulo, mensaje, urlAccion })
    revalidatePath('/admin/notificaciones')
    return { exito: true, ...result }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al enviar la notificación' }
  }
}

export async function getNotificacionesAdmin(filtros?: {
  pagina?: number
}) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    const params = new URLSearchParams()
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    const outer = await goApi<Record<string, unknown>>(qs ? `/api/v1/admin/notificaciones?${qs}` : '/api/v1/admin/notificaciones', { raw: true })
    const raw = (outer?.data ?? outer) as Record<string, unknown>
    return {
      data: (raw?.data ?? []) as Array<Record<string, unknown>>,
      total: (raw?.total ?? 0) as number,
      pagina: (raw?.pagina ?? 1) as number,
      totalPaginas: (raw?.totalPaginas ?? 0) as number,
    }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar notificaciones' }
  }
}
