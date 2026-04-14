'use server'

import { goApi, goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'

type ReservasResult = {
  data?: Array<Record<string, unknown>>;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  error?: string;
}

type ReservasStatsResult = {
  PENDIENTE_PAGO?: number;
  PENDIENTE?: number;
  CONFIRMADA?: number;
  EN_CURSO?: number;
  COMPLETADA?: number;
  CANCELADA_HUESPED?: number;
  CANCELADA_ANFITRION?: number;
  RECHAZADA?: number;
  ANULADA?: number;
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
    const outer = await goApi<Record<string, unknown>>(qs ? `/api/v1/admin/reservas?${qs}` : '/api/v1/admin/reservas', { raw: true })
    const raw = (outer?.data ?? outer) as Record<string, unknown>
    return {
      data: (raw?.data ?? []) as Array<Record<string, unknown>>,
      total: (raw?.total ?? 0) as number,
      pagina: (raw?.pagina ?? 1) as number,
      totalPaginas: (raw?.totalPaginas ?? 0) as number,
    }
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
      timeline: (data?.timeline ?? []) as Array<Record<string, unknown>>,
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
      PENDIENTE: number;
      CONFIRMADA: number;
      EN_CURSO: number;
      COMPLETADA: number;
      CANCELADA_HUESPED: number;
      CANCELADA_ANFITRION: number;
      RECHAZADA: number;
    }>('/api/v1/admin/reservas/stats')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar estadísticas de reservas' }
  }
}
