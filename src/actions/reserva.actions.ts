'use server'

import * as Sentry from '@sentry/nextjs'

import { revalidatePath } from 'next/cache'
import { goGet, goPost, goPut, GoAPIError } from '@/lib/go-api-client'
import type { PoliticaCancelacion, MetodoPagoEnum, EstadoPago, Moneda, EstadoReserva } from '@/types'
import type { ResultadoAccion, ReservaConPropiedad } from '@/types/reserva'

export async function crearReserva(rawData: {
  propiedadId: string
  fechaEntrada: string
  fechaSalida: string
  cantidadHuespedes: number
  notasHuesped?: string
  cuponCodigo?: string
  storeItems?: Array<{
    tipo: string
    nombre: string
    cantidad: number
    precio: number
    moneda: string
    tipoPrecio?: string
    id: string
  }>
  noches?: number
}): Promise<ResultadoAccion<ReservaConPropiedad>> {
  try {
    const storeItems = (rawData.storeItems || []).map((item) => ({
      tipo_item: item.tipo,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      moneda: item.moneda,
      subtotal: (item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE'
        ? item.precio * (rawData.noches || 1)
        : item.precio) * item.cantidad,
      producto_id: item.tipo === 'producto' ? item.id : null,
      servicio_id: item.tipo === 'servicio' ? item.id : null,
    }))

    const body: Record<string, unknown> = {
      propiedadId: rawData.propiedadId,
      fechaEntrada: rawData.fechaEntrada,
      fechaSalida: rawData.fechaSalida,
      cantidadHuespedes: rawData.cantidadHuespedes,
      notasHuesped: rawData.notasHuesped || null,
      cuponCodigo: rawData.cuponCodigo || '',
      storeItems,
    }

    const reserva = await goPost<ReservaConPropiedad>('/api/v1/reservas', body)

    revalidatePath('/dashboard/mis-reservas')
    revalidatePath('/dashboard/reservas-recibidas')
    revalidatePath(`/propiedades/${rawData.propiedadId}`)

    return { exito: true, datos: reserva }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) {
      return { exito: false, error: { codigo: err.code || 'ERR-010', mensaje: err.message } }
    }
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado al crear la reserva' } }
  }
}

export async function cancelarReserva(
  reservaId: string,
  motivo?: string,
  propiedadId?: string,
): Promise<ResultadoAccion<{ reembolso?: string }>> {
  try {
    const result = await goPost<{ reembolso?: string }>(`/api/v1/reservas/${reservaId}/cancelar`, { motivo })

    revalidatePath('/dashboard/mis-reservas')
    revalidatePath('/dashboard/reservas-recibidas')
    revalidatePath('/dashboard/pagos')
    revalidatePath('/admin/reservas')
    revalidatePath('/admin/pagos')
    if (propiedadId) {
      revalidatePath(`/propiedades/${propiedadId}`)
    }

    return { exito: true, datos: result }
  } catch (err) {
      Sentry.captureException(err)
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
    revalidatePath('/dashboard/pagos')
    revalidatePath('/admin/reservas')
    revalidatePath('/admin/pagos')

    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
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
      estadoPago: (r.estado_pago || '') as string,
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
      Sentry.captureException(err)
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
      estadoPago: r.estado_pago as string | undefined,
    }))
  } catch (err) {
      Sentry.captureException(err)
    console.error('[getReservasRecibidas] Error:', err)
    return []
  }
}

export async function getReservaStoreItems(reservaId: string) {
  try {
    const items = await goGet<Array<Record<string, unknown>>>(`/api/v1/reservas/${reservaId}/store-items`)
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export async function getReservaPorId(reservaId: string): Promise<ReservaConPropiedad | null> {
  try {
    const r = await goGet<Record<string, unknown>>(`/api/v1/reservas/${reservaId}`)
    if (!r) return null
    return {
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
      fechaCancelacion: (r.fecha_cancelacion || r.cancelada_en) as string | null,
      propiedad: {
        id: r.propiedad_id as string,
        titulo: (r.propiedad_titulo || r.PropiedadTitulo || '') as string,
        direccion: (r.propiedad_direccion || r.PropiedadDireccion || '') as string,
        politicaCancelacion: (r.propiedad_politica_cancelacion || r.PoliticaCancelacion || 'FLEXIBLE') as PoliticaCancelacion,
      },
      pago: r.pago as ReservaConPropiedad['pago'],
    } as ReservaConPropiedad
  } catch (err) {
      Sentry.captureException(err)
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
  revalidatePath('/dashboard/reservas-recibidas')
  revalidatePath('/dashboard/mis-reservas')
  revalidatePath('/dashboard/pagos')
  revalidatePath('/admin/reservas')
  revalidatePath('/admin/pagos')
}

export async function rechazarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  const result = await confirmarORechazarReserva(reservaId, 'rechazar')
  if (!result.exito) {
    console.error('[rechazarReservaAction]', result.error)
  }
  revalidatePath('/dashboard/reservas-recibidas')
  revalidatePath('/dashboard/mis-reservas')
  revalidatePath('/dashboard/pagos')
  revalidatePath('/admin/reservas')
  revalidatePath('/admin/pagos')
}

export async function cancelarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  const propiedadId = formData.get('propiedadId') as string | null
  const result = await cancelarReserva(reservaId, undefined, propiedadId || undefined)
  if (!result.exito) {
    console.error('[cancelarReservaAction]', result.error)
  }
  if (propiedadId) {
    revalidatePath(`/propiedades/${propiedadId}`)
  }
}

export interface PropiedadModoReserva {
  id: string
  titulo: string
  modoReserva: 'MANUAL' | 'AUTOMATICO'
  imagenUrl: string | null
}

export async function getModosReserva(): Promise<PropiedadModoReserva[]> {
  try {
    const raw = await goGet<Record<string, unknown>[]>('/api/v1/reservas/modos-reserva')
    if (!Array.isArray(raw)) return []
    return raw.map((r) => ({
      id: r.id as string,
      titulo: r.titulo as string,
      modoReserva: (r.modo_reserva || 'MANUAL') as 'MANUAL' | 'AUTOMATICO',
      imagenUrl: (r.imagen_url ?? null) as string | null,
    }))
  } catch (err) {
      Sentry.captureException(err)
    console.error('[getModosReserva] Error:', err)
    return []
  }
}

export async function updateModoReserva(
  propiedadId: string,
  modo: 'MANUAL' | 'AUTOMATICO'
): Promise<ResultadoAccion> {
  try {
    await goPut('/api/v1/reservas/modos-reserva', { propiedadId, modo })
    revalidatePath('/dashboard/reservas-recibidas')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) {
      return { exito: false, error: { codigo: err.code || 'ERR-020', mensaje: err.message } }
    }
    return { exito: false, error: { codigo: 'ERR-020', mensaje: 'Error al actualizar modo de reserva' } }
  }
}
