'use server'

import { goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

export async function enviarNotificacionAdmin(formData: FormData) {
  const usuarioId = (formData.get('usuarioId') as string) || undefined
  const titulo = formData.get('titulo') as string
  const mensaje = formData.get('mensaje') as string
  const urlAccion = (formData.get('urlAccion') as string) || undefined

  try {
    const result = await goPost<{ broadcast?: boolean; total?: number }>('/api/v1/admin/notificaciones', { usuarioId, titulo, mensaje, urlAccion })
    revalidatePath('/admin/notificaciones')
    return { exito: true, ...result }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al enviar la notificación' }
  }
}

export async function getNotificacionesAdmin(filtros?: {
  pagina?: number
}) {
  try {
    const params = new URLSearchParams()
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    return await goGet<{
      data: Array<Record<string, unknown>>;
      total: number;
      pagina: number;
      totalPaginas: number;
    }>(qs ? `/api/v1/admin/notificaciones?${qs}` : '/api/v1/admin/notificaciones')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar notificaciones' }
  }
}
