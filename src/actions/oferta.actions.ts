'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { crearOfertaSchema, responderOfertaSchema } from '@/lib/oferta-validations'
import { calcularNoches } from '@/lib/format'
import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'
import { PLANES_SUSCRIPCION } from '@/lib/constants'
import type { Moneda } from '@/types'

const HORAS_PARA_PAGAR = 2

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
  const noches = calcularNoches(data.fechaEntrada, data.fechaSalida)
  if (noches < 1) return { error: 'La estancia debe ser de al menos 1 noche' }

  const supabase = createAdminClient()

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('id, precio_por_noche, moneda, propietario_id, capacidad_maxima, estado_publicacion, estancia_minima, estancia_maxima')
    .eq('id', data.propiedadId)
    .single()

  if (!propiedad || propiedad.estado_publicacion !== 'PUBLICADA') {
    return { error: 'Propiedad no disponible' }
  }

  if (propiedad.propietario_id === user.id) {
    return { error: 'No puedes ofertar en tu propia propiedad' }
  }

  if (data.cantidadHuespedes > propiedad.capacidad_maxima) {
    return { error: `Máximo ${propiedad.capacidad_maxima} huéspedes` }
  }

  if (noches < (propiedad.estancia_minima ?? 1)) {
    return { error: `Estancia mínima de ${propiedad.estancia_minima ?? 1} noches` }
  }

  if (propiedad.estancia_maxima && noches > propiedad.estancia_maxima) {
    return { error: `Estancia máxima de ${propiedad.estancia_maxima} noches` }
  }

  const precioOriginal = Number(propiedad.precio_por_noche) * noches
  const precioOfertado = data.precioOfertado

  if (precioOfertado > precioOriginal * 1.1) {
    return { error: `La oferta no puede superar el precio original ($${precioOriginal.toFixed(2)})` }
  }

  if (precioOfertado < precioOriginal * 0.3) {
    return { error: 'La oferta es demasiado baja (mínimo 30% del precio original)' }
  }

  const { data: existente } = await supabase
    .from('boogie_ofertas')
    .select('id')
    .eq('propiedad_id', data.propiedadId)
    .eq('huesped_id', user.id)
    .in('estado', ['PENDIENTE', 'ACEPTADA'])
    .limit(1)

  if (existente && existente.length > 0) {
    return { error: 'Ya tienes una oferta activa para esta propiedad' }
  }

  const disponibilidad = await verificarDisponibilidad(
    data.propiedadId,
    data.fechaEntrada,
    data.fechaSalida
  )
  if (!disponibilidad.disponible) {
    return { error: 'Las fechas seleccionadas no están disponibles' }
  }

  const { data: oferta, error: insertError } = await supabase
    .from('boogie_ofertas')
    .insert({
      propiedad_id: data.propiedadId,
      huesped_id: user.id,
      fecha_entrada: data.fechaEntrada.toISOString().split('T')[0],
      fecha_salida: data.fechaSalida.toISOString().split('T')[0],
      noches,
      cantidad_huespedes: data.cantidadHuespedes,
      precio_original: precioOriginal,
      precio_ofertado: precioOfertado,
      moneda: data.moneda,
      mensaje: data.mensaje || null,
      estado: 'PENDIENTE',
    })
    .select('id, codigo')
    .single()

  if (insertError) {
    console.error('[crearOferta] Error:', insertError.message)
    return { error: 'Error al crear la oferta' }
  }

  return { exito: true, oferta: { id: oferta.id, codigo: oferta.codigo } }
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
  const supabase = createAdminClient()

  const { data: oferta } = await supabase
    .from('boogie_ofertas')
    .select('id, estado, propiedad_id, propiedades:propiedad_id(propietario_id)')
    .eq('id', ofertaId)
    .single()

  if (!oferta) return { error: 'Oferta no encontrada' }
  if (oferta.estado !== 'PENDIENTE') return { error: 'Esta oferta ya fue respondida' }

  const propietarioId = (oferta as unknown as Record<string, Record<string, unknown>>)?.propiedades?.propietario_id
  if (propietarioId !== user.id) return { error: 'Solo el anfitrión puede responder' }

  if (accion === 'RECHAZADA') {
    const { error: updateError } = await supabase
      .from('boogie_ofertas')
      .update({
        estado: 'RECHAZADA',
        motivo_rechazo: motivoRechazo || null,
        fecha_rechazada: new Date().toISOString(),
      })
      .eq('id', ofertaId)

    if (updateError) return { error: 'Error al rechazar la oferta' }
    return { exito: true, estado: 'RECHAZADA' }
  }

  if (accion === 'ACEPTADA') {
    const disponibilidad = await verificarDisponibilidad(
      oferta.propiedad_id as string,
      new Date(),
      new Date()
    )

    const fechaExpiracion = new Date()
    fechaExpiracion.setHours(fechaExpiracion.getHours() + HORAS_PARA_PAGAR)

    const { error: updateError } = await supabase
      .from('boogie_ofertas')
      .update({
        estado: 'ACEPTADA',
        fecha_aprobada: new Date().toISOString(),
        fecha_expiracion: fechaExpiracion.toISOString(),
      })
      .eq('id', ofertaId)

    if (updateError) {
      console.error('[responderOferta] Error:', updateError.message)
      return { error: 'Error al aceptar la oferta' }
    }

    return { exito: true, estado: 'ACEPTADA', fechaExpiracion: fechaExpiracion.toISOString() }
  }

  return { error: 'Acción no válida' }
}

export async function getOfertasRecibidas() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: ofertas, error } = await supabase
    .from('boogie_ofertas')
    .select(`
      id, codigo, estado, precio_ofertado, precio_original, moneda,
      fecha_entrada, fecha_salida, noches, cantidad_huespedes,
      mensaje, motivo_rechazo, fecha_creacion, fecha_aprobada, fecha_expiracion,
      propiedad:propiedades(id, titulo, imagenes:imagenes_propiedad(url, es_principal)),
      huesped:usuarios!huesped_id(id, nombre, apellido, email, avatar_url, verificado)
    `)
    .eq('propiedades.propietario_id', user.id)
    .in('estado', ['PENDIENTE', 'ACEPTADA'])
    .order('fecha_creacion', { ascending: false })

  if (error) return { error: 'Error al cargar ofertas' }
  return { ofertas }
}

export async function getOfertasEnviadas() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: ofertas, error } = await supabase
    .from('boogie_ofertas')
    .select(`
      id, codigo, estado, precio_ofertado, precio_original, moneda,
      fecha_entrada, fecha_salida, noches, cantidad_huespedes,
      mensaje, fecha_creacion, fecha_expiracion, fecha_aprobada,
      propiedad:propiedades(id, titulo, imagenes:imagenes_propiedad(url, es_principal))
    `)
    .eq('huesped_id', user.id)
    .order('fecha_creacion', { ascending: false })

  if (error) return { error: 'Error al cargar ofertas' }
  return { ofertas }
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
