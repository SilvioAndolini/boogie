'use server'

import { createAdminClient } from '@/lib/supabase/admin'
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
    const result = await goPost<{ estado: string; fechaExpiracion?: string }>(`/api/v1/ofertas/${ofertaId}/responder`, {
      accion,
      motivoRechazo,
    })
    return { exito: true, estado: result.estado, fechaExpiracion: result.fechaExpiracion }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al responder la oferta'
    return { error: message }
  }
}

export async function getOfertasRecibidas() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const ofertas = await goGet<unknown[]>('/api/v1/ofertas/recibidas')
    return { ofertas }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al cargar ofertas'
    return { error: message }
  }
}

export async function getOfertasEnviadas() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const ofertas = await goGet<unknown[]>('/api/v1/ofertas/enviadas')
    return { ofertas }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al cargar ofertas'
    return { error: message }
  }
}

export async function getOfertaPorId(ofertaId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: oferta, error } = await supabase
    .from('boogie_ofertas')
    .select(`
      *, 
      propiedad:propiedades(id, titulo, precio_por_noche, moneda, propietario_id,
        imagenes:imagenes_propiedad(url, es_principal)),
      huesped:usuarios!huesped_id(id, nombre, apellido, email, avatar_url, verificado)
    `)
    .eq('id', ofertaId)
    .single()

  if (error || !oferta) return { error: 'Oferta no encontrada' }

  const huespedId = (oferta as Record<string, unknown>).huesped_id as string
  const propiedad = (oferta as Record<string, unknown>).propiedad as Record<string, unknown> | null
  const propietarioId = propiedad?.propietario_id as string

  if (huespedId !== user.id && propietarioId !== user.id) {
    return { error: 'No tienes permiso para ver esta oferta' }
  }

  return { oferta }
}
