'use server'

import { goApi, goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

type PagosResult = {
  data?: Array<Record<string, unknown>>;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  error?: string;
}

type PagosStatsResult = {
  PENDIENTE?: number;
  EN_VERIFICACION?: number;
  VERIFICADO?: number;
  ACREDITADO?: number;
  RECHAZADO?: number;
  REEMBOLSADO?: number;
  error?: string;
}

export async function getPagosAdmin(filtros?: {
  estado?: string
  metodoPago?: string
  busqueda?: string
  pagina?: number
}): Promise<PagosResult> {
  try {
    const params = new URLSearchParams()
    if (filtros?.estado && filtros.estado !== 'TODOS') params.set('estado', filtros.estado)
    if (filtros?.metodoPago && filtros.metodoPago !== 'TODOS') params.set('metodoPago', filtros.metodoPago)
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda.trim())
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    const outer = await goApi<Record<string, unknown>>(qs ? `/api/v1/admin/pagos?${qs}` : '/api/v1/admin/pagos', { raw: true })
    const raw = (outer?.data ?? outer) as Record<string, unknown>
    return {
      data: (raw?.data ?? []) as Array<Record<string, unknown>>,
      total: (raw?.total ?? 0) as number,
      pagina: (raw?.pagina ?? 1) as number,
      totalPaginas: (raw?.totalPaginas ?? 0) as number,
    }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar pagos' }
  }
}

export async function getPagosStatsAdmin(): Promise<PagosStatsResult> {
  try {
    return await goGet<PagosStatsResult>('/api/v1/admin/pagos/stats')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar estadísticas de pagos' }
  }
}

export async function verificarPagoAdmin(formData: FormData) {
  const pagoId = formData.get('pagoId') as string
  const accion = formData.get('accion') as string
  const notasVerificacion = (formData.get('notasVerificacion') as string) || undefined

  try {
    await goPost('/api/v1/admin/pagos/verificar', { pagoId, accion, notasVerificacion })
    revalidatePath('/admin/pagos')
    revalidatePath('/admin/reservas')
    revalidatePath('/dashboard/mis-reservas')
    revalidatePath('/dashboard/reservas-recibidas')
    revalidatePath('/dashboard/pagos')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar el pago' }
  }
}
