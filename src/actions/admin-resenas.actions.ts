'use server'

import { goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

type ResenasResult = {
  resenas?: Array<Record<string, unknown>>;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  stats?: { total: number; promedio: number; distribucion: Record<string, number> };
  error?: string;
}

export async function getResenasAdmin(filtros?: {
  calificacionMin?: number
  busqueda?: string
  pagina?: number
}): Promise<ResenasResult> {
  try {
    const params = new URLSearchParams()
    if (filtros?.calificacionMin) params.set('calificacionMin', String(filtros.calificacionMin))
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda.trim())
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    return await goGet<{
      resenas: Array<Record<string, unknown>>;
      total: number;
      pagina: number;
      totalPaginas: number;
      stats: { total: number; promedio: number; distribucion: Record<string, number> };
    }>(qs ? `/api/v1/admin/resenas?${qs}` : '/api/v1/admin/resenas')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar reseñas' }
  }
}

export async function moderarResenaAdmin(formData: FormData) {
  const resenaId = formData.get('resenaId') as string
  const accion = formData.get('accion') as string
  const motivo = (formData.get('motivo') as string) || undefined

  try {
    await goPost('/api/v1/admin/resenas/moderar', { resenaId, accion, motivo })
    revalidatePath('/admin/resenas')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al moderar la reseña' }
  }
}
