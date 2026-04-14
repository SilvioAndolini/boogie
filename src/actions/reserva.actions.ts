'use server'

import { revalidatePath } from 'next/cache'
import { goGet, goPost, GoAPIError } from '@/lib/go-api-client'
import type { PoliticaCancelacion, MetodoPagoEnum, EstadoPago, Moneda, EstadoReserva } from '@/types'
import type { ResultadoAccion, ReservaConPropiedad } from '@/types/reserva'

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
    const raw = await goGet<Record<string, unknown>[]>('/api/v1/reservas/mias')
    if (!Array.isArray(raw)) return []
    return raw.map((r) => ({
      id: r.id as string,
      codigo: r.codigo as string,
      fechaEntrada: r.fecha_entrada as string,
      fechaSalida: r.fecha_salida as string,
      noches: r.noches as number,
      precioPorNoche: String(r.precio_por_noche),
      subtotal: String(r.subtotal),
      comisionPlataforma: String(r.comision_plataforma),
      total: String(r.total),
      moneda: r.moneda as Moneda,
      cantidadHuespedes: r.cantidad_huespedes as number,
      estado: r.estado as EstadoReserva,
      notasHuesped: r.notas_huesped as string | null,
      fechaCreacion: (r.fecha_creacion || r.created_at) as string,
      fechaConfirmacion: r.fecha_confirmacion as string | null,
      fechaCancelacion: r.fecha_cancelacion as string | null,
      propiedad: {
        id: r.propiedad_id as string,
        titulo: (r.propiedad_titulo || 'Propiedad') as string,
        direccion: (r.propiedad_direccion || '') as string,
        politicaCancelacion: (r.propiedad_politica_cancelacion || 'FLEXIBLE') as PoliticaCancelacion,
        imagenPrincipal: r.propiedad_imagen_principal as string | undefined,
      },
    }))
  } catch (err) {
    console.error('[getMisReservas] Error:', err)
    return []
  }
}

export async function getReservasRecibidas(): Promise<ReservaConPropiedad[]> {
  try {
    const raw = await goGet<Record<string, unknown>[]>('/api/v1/reservas/recibidas')
    if (!Array.isArray(raw)) return []
    return raw.map((r) => ({
      id: r.id as string,
      codigo: r.codigo as string,
      fechaEntrada: r.fecha_entrada as string,
      fechaSalida: r.fecha_salida as string,
      noches: r.noches as number,
      precioPorNoche: String(r.precio_por_noche),
      subtotal: String(r.subtotal),
      comisionPlataforma: String(r.comision_plataforma),
      total: String(r.total),
      moneda: r.moneda as Moneda,
      cantidadHuespedes: r.cantidad_huespedes as number,
      estado: r.estado as EstadoReserva,
      notasHuesped: r.notas_huesped as string | null,
      fechaCreacion: (r.fecha_creacion || r.created_at) as string,
      fechaConfirmacion: r.fecha_confirmacion as string | null,
      fechaCancelacion: r.fecha_cancelacion as string | null,
      propiedad: {
        id: r.propiedad_id as string,
        titulo: (r.propiedad_titulo || 'Propiedad') as string,
        direccion: '',
        politicaCancelacion: 'FLEXIBLE' as PoliticaCancelacion,
        imagenPrincipal: r.propiedad_imagen_principal as string | undefined,
      },
      huesped: {
        id: r.huesped_id as string,
        nombre: (r.huesped_nombre || '') as string,
        apellido: (r.huesped_apellido || '') as string,
        avatarUrl: r.huesped_avatar_url as string | null,
      },
    }))
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
