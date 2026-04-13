'use server'

import { revalidatePath } from 'next/cache'
import { goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import type { PoliticaCancelacion, MetodoPagoEnum, EstadoPago } from '@/types'
import type { ResultadoAccion, ReservaConPropiedad } from '@/types/reserva'
import type { EstadoReserva } from '@/types'

export async function crearReserva(rawData: {
  propiedadId: string
  fechaEntrada: string
  fechaSalida: string
  cantidadHuespedes: number
  notasHuesped?: string
}): Promise<ResultadoAccion<ReservaConPropiedad>> {
  try {
    const reserva = await goPost<ReservaConPropiedad>('/api/v1/reservas', rawData)

    revalidatePath('/dashboard/mis-reservas')
    revalidatePath(`/propiedades/${rawData.propiedadId}`)

    return { exito: true, datos: reserva }
  } catch (err) {
    if (err instanceof GoAPIError) {
      return { exito: false, error: { codigo: err.code || 'ERR-010', mensaje: err.message } }
    }
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado al crear la reserva' } }
  }
}

export async function cancelarReserva(
  reservaId: string,
  motivo?: string
): Promise<ResultadoAccion<{ reembolso?: string }>> {
  try {
    const result = await goPost<{ reembolso?: string }>(`/api/v1/reservas/${reservaId}/cancelar`, { motivo })

    revalidatePath('/dashboard/mis-reservas')
    revalidatePath('/dashboard/reservas-recibidas')

    return { exito: true, datos: result }
  } catch (err) {
    if (err instanceof GoAPIError) {
      return { exito: false, error: { codigo: err.code || 'ERR-010', mensaje: err.message } }
    }
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado al cancelar' } }
  }
}

export async function confirmarORechazarReserva(
  reservaId: string,
  accion: 'confirmar' | 'rechazar',
  motivo?: string
): Promise<ResultadoAccion> {
  try {
    if (accion === 'confirmar') {
      await goPost(`/api/v1/reservas/${reservaId}/confirmar`)
    } else {
      await goPost(`/api/v1/reservas/${reservaId}/rechazar`, { motivo })
    }

    revalidatePath('/dashboard/reservas-recibidas')
    revalidatePath('/dashboard/mis-reservas')

    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) {
      return { exito: false, error: { codigo: err.code || 'ERR-010', mensaje: err.message } }
    }
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado' } }
  }
}

export async function getMisReservas(): Promise<ReservaConPropiedad[]> {
  try {
    return await goGet<ReservaConPropiedad[]>('/api/v1/reservas/mias')
  } catch (err) {
    console.error('[getMisReservas] Error:', err)
    return []
  }
}

export async function getReservasRecibidas(): Promise<ReservaConPropiedad[]> {
  try {
    return await goGet<ReservaConPropiedad[]>('/api/v1/reservas/recibidas')
  } catch (err) {
    console.error('[getReservasRecibidas] Error:', err)
    return []
  }
}

export async function getReservaStoreItems(reservaId: string) {
  try {
    return await goGet<Array<Record<string, unknown>>>(`/api/v1/reservas/${reservaId}/store-items`)
  } catch (err) {
    console.error('[getReservaStoreItems] Error:', err)
    return []
  }
}

export async function getReservaPorId(reservaId: string): Promise<ReservaConPropiedad | null> {
  try {
    return await goGet<ReservaConPropiedad>(`/api/v1/reservas/${reservaId}`)
  } catch (err) {
    console.error('[getReservaPorId] Error:', err)
    return null
  }
}

export async function confirmarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  const result = await confirmarORechazarReserva(reservaId, 'confirmar')
  if (!result.exito) {
    console.error('[confirmarReservaAction]', result.error)
  }
}

export async function rechazarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  const result = await confirmarORechazarReserva(reservaId, 'rechazar')
  if (!result.exito) {
    console.error('[rechazarReservaAction]', result.error)
  }
}

export async function cancelarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  const result = await cancelarReserva(reservaId)
  if (!result.exito) {
    console.error('[cancelarReservaAction]', result.error)
  }
}
