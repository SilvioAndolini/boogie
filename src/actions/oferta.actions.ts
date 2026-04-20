'use server'

import * as Sentry from '@sentry/nextjs'

import { getUsuarioAutenticado } from '@/lib/auth'
import { crearOfertaSchema, responderOfertaSchema } from '@/lib/oferta-validations'
import { goGet, goPost } from '@/lib/go-api-client'
import type { Moneda } from '@/types'

export async function crearOferta(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'Debes iniciar sesión' }

  const raw = {
    propiedadId: formData.get('propiedadId') as string,
    fechaEntrada: formData.get('fechaEntrada') as string,
    fechaSalida: formData.get('fechaSalida') as string,
    cantidadHuespedes: formData.get('cantidadHuespedes') as string,
    precioOfertado: formData.get('precioOfertado') as string,
    moneda: (formData.get('moneda') as string) || 'USD',
    mensaje: (formData.get('mensaje') as string) || undefined,
  }

  const parsed = crearOfertaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const data = parsed.data

  try {
    const oferta = await goPost<{ id: string; codigo: string }>('/api/v1/ofertas', {
      propiedadId: data.propiedadId,
      fechaEntrada: data.fechaEntrada.toISOString().split('T')[0],
      fechaSalida: data.fechaSalida.toISOString().split('T')[0],
      cantidadHuespedes: data.cantidadHuespedes,
      precioOfertado: data.precioOfertado,
      moneda: data.moneda,
      mensaje: data.mensaje,
    })
    return { exito: true, oferta }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al crear la oferta'
    return { error: message }
  }
}

export async function responderOferta(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'Debes iniciar sesión' }

  const parsed = responderOfertaSchema.safeParse({
    ofertaId: formData.get('ofertaId') as string,
    accion: formData.get('accion') as string,
    motivoRechazo: (formData.get('motivoRechazo') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { ofertaId, accion, motivoRechazo } = parsed.data

  try {
    const result = await goPost<{ estado: string; fecha_expiracion?: string }>(`/api/v1/ofertas/${ofertaId}/responder`, {
      accion,
      motivoRechazo,
    })
    return { exito: true, estado: result.estado, fechaExpiracion: result.fecha_expiracion }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al responder la oferta'
    return { error: message }
  }
}

function mapOferta(o: Record<string, unknown>) {
  return {
    id: o.id,
    codigo: o.codigo,
    estado: o.estado,
    precio_ofertado: o.precio_ofertado,
    precio_original: o.precio_original,
    moneda: o.moneda,
    fecha_entrada: o.fecha_entrada,
    fecha_salida: o.fecha_salida,
    noches: o.noches,
    cantidad_huespedes: o.cantidad_huespedes,
    mensaje: o.mensaje,
    fecha_creacion: o.fecha_creacion,
    fecha_expiracion: o.fecha_expiracion,
    fecha_rechazada: o.fecha_rechazada,
    motivo_rechazo: o.motivo_rechazo,
    reserva_id: o.reserva_id,
    propiedad: {
      id: o.propiedad_id,
      titulo: o.propiedad_titulo,
      imagenes: o.imagen_principal
        ? [{ url: o.imagen_principal, es_principal: true }]
        : [],
    },
    huesped: {
      id: o.huesped_id,
      nombre: o.huesped_nombre,
      apellido: o.huesped_apellido,
      avatar_url: o.huesped_avatar,
    },
  }
}

export async function getOfertasRecibidas() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const raw = await goGet<Record<string, unknown>[]>('/api/v1/ofertas/recibidas')
    const ofertas = (raw ?? []).map(mapOferta)
    return { ofertas }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al cargar ofertas'
    return { error: message }
  }
}

export async function getOfertasEnviadas() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const raw = await goGet<Record<string, unknown>[]>('/api/v1/ofertas/enviadas')
    const ofertas = (raw ?? []).map(mapOferta)
    return { ofertas }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al cargar ofertas'
    return { error: message }
  }
}

export async function getOfertaPorId(ofertaId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const oferta = await goGet<Record<string, unknown>>(`/api/v1/ofertas/${ofertaId}`)
    return { oferta }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al cargar la oferta'
    return { error: message }
  }
}
