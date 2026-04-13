'use server'

import { goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'

type ReservasResult = {
  reservas?: Array<Record<string, unknown>>;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  error?: string;
}

type ReservasStatsResult = {
  pendientes?: number;
  confirmadas?: number;
  enCurso?: number;
  completadas?: number;
  canceladas?: number;
  error?: string;
}

export async function getReservasAdmin(filtros?: {
  estado?: string
  busqueda?: string
  pagina?: number
}): Promise<ReservasResult> {
  try {
    const params = new URLSearchParams()
    if (filtros?.estado && filtros.estado !== 'TODOS') params.set('estado', filtros.estado)
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda.trim())
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    return await goGet<{
      reservas: Array<Record<string, unknown>>;
      total: number;
      pagina: number;
      totalPaginas: number;
    }>(qs ? `/api/v1/admin/reservas?${qs}` : '/api/v1/admin/reservas')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar reservas' }
  }
}

export async function getReservaDetalleAdmin(reservaId: string) {
  try {
    const data = await goGet<Record<string, unknown>>(`/api/v1/admin/reservas/${reservaId}`)
    const cotizacion = await getCotizacionEuro()
    return {
      reserva: data,
      tasaBCV: cotizacion.tasa,
      fuenteBCV: cotizacion.fuente,
    }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Reserva no encontrada' }
  }
}

export async function accionReservaAdmin(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  const accion = formData.get('accion') as string
  const motivo = (formData.get('motivo') as string) || undefined

  try {
    await goPost('/api/v1/admin/reservas/accion', { reservaId, accion, motivo })
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar la reserva' }
  }
}

export async function getReservasStatsAdmin(): Promise<ReservasStatsResult> {
  try {
    return await goGet<{
      pendientes: number;
      confirmadas: number;
      enCurso: number;
      completadas: number;
      canceladas: number;
    }>('/api/v1/admin/reservas/stats')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar estadísticas de reservas' }
  }
}
