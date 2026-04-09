'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { crearReservaSchema } from '@/lib/validations'
import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'
import { calcularPrecioReserva, calcularReembolsoCompleto } from '@/lib/reservas/calculos'
import type { PoliticaCancelacion, MetodoPagoEnum, EstadoPago } from '@/types'
import { puedeTransicionar, sePuedeCancelar } from '@/lib/reservas/estados'
import { calcularNoches } from '@/lib/format'
import type { ResultadoAccion, ReservaConPropiedad } from '@/types/reserva'
import type { EstadoReserva } from '@/types'
import { getUsuarioAutenticado } from '@/lib/auth'

export async function crearReserva(rawData: {
  propiedadId: string
  fechaEntrada: string
  fechaSalida: string
  cantidadHuespedes: number
  notasHuesped?: string
}): Promise<ResultadoAccion<ReservaConPropiedad>> {
  try {
    console.log('[crearReserva] Inicio')
    const user = await getUsuarioAutenticado()
    if (!user) return { exito: false, error: { codigo: 'ERR-004', mensaje: 'Debes iniciar sesión para reservar' } }
    console.log('[crearReserva] User:', user.id)

    const validacion = crearReservaSchema.safeParse(rawData)
    if (!validacion.success) {
      console.log('[crearReserva] Validación falló:', validacion.error.issues[0].message)
      return { exito: false, error: { codigo: 'ERR-001', mensaje: validacion.error.issues[0].message } }
    }

    const datos = validacion.data
    const admin = createAdminClient()
    console.log('[crearReserva] Buscando propiedad:', datos.propiedadId)

    const { data: propiedad } = await admin
      .from('propiedades')
      .select('id, titulo, precio_por_noche, moneda, capacidad_maxima, estancia_minima, estancia_maxima, estado_publicacion, politica_cancelacion, propietario_id')
      .eq('id', datos.propiedadId)
      .single()

    if (!propiedad || propiedad.estado_publicacion !== 'PUBLICADA') {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: 'La propiedad no está disponible' } }
    }
    console.log('[crearReserva] Propiedad encontrada:', propiedad.titulo)

    if (propiedad.propietario_id === user.id) {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: 'No puedes reservar tu propia propiedad' } }
    }

    if (datos.cantidadHuespedes > propiedad.capacidad_maxima) {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: `La capacidad máxima es de ${propiedad.capacidad_maxima} huéspedes` } }
    }

    const noches = calcularNoches(datos.fechaEntrada, datos.fechaSalida)
    if (noches < propiedad.estancia_minima) {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: `La estancia mínima es de ${propiedad.estancia_minima} noche${propiedad.estancia_minima > 1 ? 's' : ''}` } }
    }
    if (propiedad.estancia_maxima && noches > propiedad.estancia_maxima) {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: `La estancia máxima es de ${propiedad.estancia_maxima} noches` } }
    }

    const disponibilidad = await verificarDisponibilidad(datos.propiedadId, datos.fechaEntrada, datos.fechaSalida)
    if (!disponibilidad.disponible) {
      const msg = disponibilidad.conflicto?.tipo === 'FECHA_BLOQUEADA'
        ? 'Las fechas seleccionadas están bloqueadas'
        : 'Las fechas seleccionadas ya no están disponibles'
      return { exito: false, error: { codigo: 'ERR-003', mensaje: msg } }
    }

    const precio = Number(propiedad.precio_por_noche)
    const calculo = calcularPrecioReserva(precio, datos.fechaEntrada, datos.fechaSalida, propiedad.moneda)

    const codigoReserva = 'BOO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    const reservaId = crypto.randomUUID()

    const { data: reserva, error: insertError } = await admin
      .from('reservas')
      .insert({
        id: reservaId,
        codigo: codigoReserva,
        propiedad_id: datos.propiedadId,
        huesped_id: user.id,
        fecha_entrada: datos.fechaEntrada,
        fecha_salida: datos.fechaSalida,
        noches: calculo.noches,
        precio_por_noche: calculo.precioPorNoche,
        subtotal: calculo.subtotal,
        comision_plataforma: calculo.comisionHuesped,
        comision_anfitrion: calculo.comisionAnfitrion,
        total: calculo.total,
        moneda: calculo.moneda,
        cantidad_huespedes: datos.cantidadHuespedes,
        notas_huesped: datos.notasHuesped || null,
        estado: 'PENDIENTE',
      })
      .select('id, codigo')
      .single()

    if (insertError || !reserva) {
      console.error('[crearReserva] Error insert:', insertError)
      return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error al crear la reserva. Intenta de nuevo.' } }
    }
    console.log('[crearReserva] Reserva creada:', reserva.id)

    await admin.from('notificaciones').insert({
      tipo: 'NUEVA_RESERVA',
      titulo: 'Nueva reserva recibida',
      mensaje: `Tienes una nueva reserva para "${propiedad.titulo}" del ${new Date(datos.fechaEntrada).toLocaleDateString('es-VE')} al ${new Date(datos.fechaSalida).toLocaleDateString('es-VE')}.`,
      usuario_id: propiedad.propietario_id,
      url_accion: '/dashboard/reservas-recibidas',
    })

    revalidatePath('/dashboard/mis-reservas')
    revalidatePath(`/propiedades/${datos.propiedadId}`)

    return {
      exito: true,
      datos: {
        id: reserva.id,
        codigo: reserva.codigo,
        fechaEntrada: new Date(datos.fechaEntrada).toISOString(),
        fechaSalida: new Date(datos.fechaSalida).toISOString(),
        noches: calculo.noches,
        precioPorNoche: String(calculo.precioPorNoche),
        subtotal: String(calculo.subtotal),
        comisionPlataforma: String(calculo.comisionHuesped),
        total: String(calculo.total),
        moneda: calculo.moneda,
        cantidadHuespedes: datos.cantidadHuespedes,
        estado: 'PENDIENTE',
        notasHuesped: datos.notasHuesped || null,
        fechaCreacion: new Date().toISOString(),
        fechaConfirmacion: null,
        fechaCancelacion: null,
        propiedad: {
          id: datos.propiedadId,
          titulo: propiedad.titulo,
          direccion: '',
          politicaCancelacion: propiedad.politica_cancelacion,
        },
      },
    }
  } catch (err) {
    console.error('[crearReserva] Error:', err)
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado al crear la reserva' } }
  }
}

export async function cancelarReserva(
  reservaId: string,
  motivo?: string
): Promise<ResultadoAccion<{ reembolso?: string }>> {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) return { exito: false, error: { codigo: 'ERR-004', mensaje: 'Debes iniciar sesión' } }

    const admin = createAdminClient()

    const { data: reserva } = await admin
      .from('reservas')
      .select('id, estado, huesped_id, total, comision_plataforma, fecha_entrada, propiedad_id, propiedades!propiedad_id(propietario_id, titulo, politica_cancelacion)')
      .eq('id', reservaId)
      .single()

    if (!reserva) {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: 'Reserva no encontrada' } }
    }

    const r = reserva as Record<string, unknown>
    const prop = r.propiedades as Record<string, unknown>
    const estadoActual = r.estado as EstadoReserva
    const esHuesped = r.huesped_id === user.id
    const esAnfitrion = prop.propietario_id === user.id

    if (!esHuesped && !esAnfitrion) {
      return { exito: false, error: { codigo: 'ERR-005', mensaje: 'No tienes permisos sobre esta reserva' } }
    }

    if (!sePuedeCancelar(estadoActual)) {
      return { exito: false, error: { codigo: 'ERR-006', mensaje: 'Esta reserva no se puede cancelar en su estado actual' } }
    }

    const nuevoEstado: EstadoReserva = esHuesped ? 'CANCELADA_HUESPED' : 'CANCELADA_ANFITRION'
    if (!puedeTransicionar(estadoActual, nuevoEstado)) {
      return { exito: false, error: { codigo: 'ERR-006', mensaje: 'Transición de estado no permitida' } }
    }

    let reembolsoMsg = ''
    if (esHuesped && estadoActual === 'CONFIRMADA') {
      const reembolso = calcularReembolsoCompleto(
        Number(r.total),
        Number(r.comision_plataforma),
        prop.politica_cancelacion as PoliticaCancelacion,
        new Date(r.fecha_entrada as string)
      )
      reembolsoMsg = reembolso.mensaje
    }

    const { error: updateError } = await admin
      .from('reservas')
      .update({
        estado: nuevoEstado,
        fecha_cancelacion: new Date().toISOString(),
        notas_internas: motivo ? `Motivo de cancelación: ${motivo}` : null,
      })
      .eq('id', reservaId)

    if (updateError) {
      console.error('[cancelarReserva] Error:', updateError)
      return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error al cancelar la reserva' } }
    }

    const destinatarioId = esHuesped ? (prop.propietario_id as string) : (r.huesped_id as string)
    await admin.from('notificaciones').insert({
      tipo: 'RESERVA_CANCELADA',
      titulo: 'Reserva cancelada',
      mensaje: `La reserva para "${prop.titulo}" ha sido cancelada.${reembolsoMsg ? ` ${reembolsoMsg}` : ''}`,
      usuario_id: destinatarioId,
      url_accion: esHuesped ? '/dashboard/reservas-recibidas' : '/dashboard/mis-reservas',
    })

    revalidatePath('/dashboard/mis-reservas')
    revalidatePath('/dashboard/reservas-recibidas')

    return { exito: true, datos: { reembolso: reembolsoMsg || undefined } }
  } catch (err) {
    console.error('[cancelarReserva] Error:', err)
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado al cancelar' } }
  }
}

export async function confirmarORechazarReserva(
  reservaId: string,
  accion: 'confirmar' | 'rechazar',
  motivo?: string
): Promise<ResultadoAccion> {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) return { exito: false, error: { codigo: 'ERR-004', mensaje: 'Debes iniciar sesión' } }

    const admin = createAdminClient()

    const { data: reserva } = await admin
      .from('reservas')
      .select('id, estado, huesped_id, propiedad_id, propiedades!propiedad_id(propietario_id, titulo)')
      .eq('id', reservaId)
      .single()

    if (!reserva) {
      return { exito: false, error: { codigo: 'ERR-002', mensaje: 'Reserva no encontrada' } }
    }

    const r = reserva as Record<string, unknown>
    const prop = r.propiedades as Record<string, unknown>
    const estadoActual = r.estado as EstadoReserva

    if (prop.propietario_id !== user.id) {
      return { exito: false, error: { codigo: 'ERR-005', mensaje: 'Solo el anfitrión puede realizar esta acción' } }
    }

    if (estadoActual !== 'PENDIENTE') {
      return { exito: false, error: { codigo: 'ERR-006', mensaje: `La reserva está en estado ${estadoActual} y no puede ser ${accion === 'confirmar' ? 'confirmada' : 'rechazada'}` } }
    }

    const nuevoEstado: EstadoReserva = accion === 'confirmar' ? 'CONFIRMADA' : 'RECHAZADA'
    if (!puedeTransicionar(estadoActual, nuevoEstado)) {
      return { exito: false, error: { codigo: 'ERR-006', mensaje: 'Transición de estado no permitida' } }
    }

    const updateData: Record<string, unknown> = { estado: nuevoEstado }
    if (accion === 'confirmar') {
      updateData.fecha_confirmacion = new Date().toISOString()
    }
    if (motivo) {
      updateData.notas_internas = `Motivo de ${accion}: ${motivo}`
    }

    const { error: updateError } = await admin
      .from('reservas')
      .update(updateData)
      .eq('id', reservaId)

    if (updateError) {
      console.error('[confirmarORechazar] Error:', updateError)
      return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error al procesar la reserva' } }
    }

    await admin.from('notificaciones').insert({
      tipo: accion === 'confirmar' ? 'RESERVA_CONFIRMADA' : 'RESERVA_CANCELADA',
      titulo: accion === 'confirmar' ? 'Reserva confirmada' : 'Reserva rechazada',
      mensaje: accion === 'confirmar'
        ? `Tu reserva para "${prop.titulo}" ha sido confirmada por el anfitrión.`
        : `Tu reserva para "${prop.titulo}" ha sido rechazada.${motivo ? ` Motivo: ${motivo}` : ''}`,
      usuario_id: r.huesped_id as string,
      url_accion: '/dashboard/mis-reservas',
    })

    revalidatePath('/dashboard/reservas-recibidas')
    revalidatePath('/dashboard/mis-reservas')

    return { exito: true }
  } catch (err) {
    console.error('[confirmarORechazar] Error:', err)
    return { exito: false, error: { codigo: 'ERR-010', mensaje: 'Error inesperado' } }
  }
}

export async function getMisReservas(): Promise<ReservaConPropiedad[]> {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) return []

    const admin = createAdminClient()

    const { data: reservas } = await admin
      .from('reservas')
      .select(`
        id, codigo, fecha_entrada, fecha_salida, noches, precio_por_noche,
        subtotal, comision_plataforma, total, moneda, cantidad_huespedes,
        estado, notas_huesped, fecha_creacion, fecha_confirmacion, fecha_cancelacion,
        propiedades!propiedad_id(id, titulo, direccion, politica_cancelacion),
        pagos(id, monto, metodo_pago, estado, referencia, fecha_creacion)
      `)
      .eq('huesped_id', user.id)
      .order('fecha_creacion', { ascending: false })

    if (!reservas) return []
    return (reservas as Record<string, unknown>[]).map(mapReservaConPropiedad)
  } catch (err) {
    console.error('[getMisReservas] Error:', err)
    return []
  }
}

export async function getReservasRecibidas(): Promise<ReservaConPropiedad[]> {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) return []

    const admin = createAdminClient()

    const { data: misPropiedades } = await admin
      .from('propiedades')
      .select('id')
      .eq('propietario_id', user.id)

    if (!misPropiedades || misPropiedades.length === 0) return []

    const propiedadIds = misPropiedades.map((p: Record<string, unknown>) => p.id)

    const { data: reservas } = await admin
      .from('reservas')
      .select(`
        id, codigo, fecha_entrada, fecha_salida, noches, precio_por_noche,
        subtotal, comision_plataforma, total, moneda, cantidad_huespedes,
        estado, notas_huesped, fecha_creacion, fecha_confirmacion, fecha_cancelacion,
        propiedades!propiedad_id(id, titulo, direccion, politica_cancelacion),
        huesped:huesped_id(id, nombre, apellido, avatar_url),
        pagos(id, monto, metodo_pago, estado, referencia, fecha_creacion)
      `)
      .in('propiedad_id', propiedadIds)
      .order('fecha_creacion', { ascending: false })

    if (!reservas) return []
    return (reservas as Record<string, unknown>[]).map(mapReservaConPropiedad)
  } catch (err) {
    console.error('[getReservasRecibidas] Error:', err)
    return []
  }
}

export async function getReservaStoreItems(reservaId: string) {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) return []

    const admin = createAdminClient()

    const { data: reserva } = await admin
      .from('reservas')
      .select('id, huesped_id, propiedad_id, propiedades!propiedad_id(propietario_id)')
      .eq('id', reservaId)
      .single()

    if (!reserva) return []

    const r = reserva as Record<string, unknown>
    const prop = r.propiedades as Record<string, unknown>
    if (r.huesped_id !== user.id && prop.propietario_id !== user.id) return []

    const { data: items } = await admin
      .from('reserva_store_items')
      .select('*, producto:producto_id(imagen_url), servicio:servicio_id(imagen_url)')
      .eq('reserva_id', reservaId)

    if (!items) return []
    return items
  } catch (err) {
    console.error('[getReservaStoreItems] Error:', err)
    return []
  }
}

export async function getReservaPorId(reservaId: string): Promise<ReservaConPropiedad | null> {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) {
      console.error('[getReservaPorId] No hay usuario autenticado')
      return null
    }

    const admin = createAdminClient()

    const { data: reserva, error: queryError } = await admin
      .from('reservas')
      .select(`
        id, codigo, fecha_entrada, fecha_salida, noches, precio_por_noche,
        subtotal, comision_plataforma, total, moneda, cantidad_huespedes,
        estado, notas_huesped, fecha_creacion, fecha_confirmacion, fecha_cancelacion,
        propiedad_id,
        huesped_id,
        propiedades!propiedad_id(id, titulo, direccion, politica_cancelacion),
        huesped:huesped_id(id, nombre, apellido, avatar_url),
        pagos(id, monto, metodo_pago, estado, referencia, fecha_creacion)
      `)
      .eq('id', reservaId)
      .single()

    if (queryError) {
      console.error('[getReservaPorId] Query error:', queryError)
      return null
    }

    if (!reserva) return null

    const r = reserva as Record<string, unknown>

    if (r.huesped_id !== user.id) {
      const prop = r.propiedades as Record<string, unknown>
      const { data: propCheck } = await admin
        .from('propiedades')
        .select('propietario_id')
        .eq('id', r.propiedad_id)
        .single()

      if (!propCheck || (propCheck as Record<string, unknown>).propietario_id !== user.id) {
        console.error('[getReservaPorId] Usuario no autorizado')
        return null
      }
    }

    return mapReservaConPropiedad(r)
  } catch (err) {
    console.error('[getReservaPorId] Error:', err)
    return null
  }
}

function mapReservaConPropiedad(r: Record<string, unknown>): ReservaConPropiedad {
  const prop = (r.propiedades as Record<string, unknown>) || {}
  const huesped = r.huesped as Record<string, unknown> | undefined
  const pagos = r.pagos as Record<string, unknown>[] | undefined

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
    moneda: (r.moneda as 'USD' | 'VES') || 'USD',
    cantidadHuespedes: r.cantidad_huespedes as number,
    estado: r.estado as EstadoReserva,
    notasHuesped: (r.notas_huesped as string) || null,
    fechaCreacion: r.fecha_creacion as string,
    fechaConfirmacion: (r.fecha_confirmacion as string) || null,
    fechaCancelacion: (r.fecha_cancelacion as string) || null,
    propiedad: {
      id: prop.id as string,
      titulo: prop.titulo as string,
      direccion: (prop.direccion as string) || '',
      politicaCancelacion: (prop.politica_cancelacion as PoliticaCancelacion) ?? 'MODERADA' as PoliticaCancelacion,
    },
    huesped: huesped ? {
      id: huesped.id as string,
      nombre: huesped.nombre as string,
      apellido: huesped.apellido as string,
      avatarUrl: (huesped.avatar_url as string) || null,
    } : undefined,
    pago: pagos && pagos.length > 0 ? {
      id: pagos[0].id as string,
      monto: String(pagos[0].monto),
      metodoPago: pagos[0].metodo_pago as MetodoPagoEnum,
      estado: pagos[0].estado as EstadoPago,
      referencia: (pagos[0].referencia as string) || null,
      fechaCreacion: pagos[0].fecha_creacion as string,
    } : undefined,
  }
}
export async function confirmarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  await confirmarORechazarReserva(reservaId, 'confirmar')
}

export async function rechazarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  await confirmarORechazarReserva(reservaId, 'rechazar')
}

export async function cancelarReservaAction(formData: FormData) {
  const reservaId = formData.get('reservaId') as string
  await cancelarReserva(reservaId)
}
