'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { adminActualizarReservaSchema } from '@/lib/admin-validations'
import { puedeTransicionar } from '@/lib/reservas/estados'
import type { EstadoReserva } from '@/types'
import { ESTADO_RESERVA_LABELS } from '@/types/reserva'

export async function getReservasAdmin(filtros?: {
  estado?: string
  busqueda?: string
  pagina?: number
}) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const pagina = filtros?.pagina || 1
  const limite = 30
  const offset = (pagina - 1) * limite

  let query = admin
    .from('reservas')
    .select(`
      id, codigo, fecha_entrada, fecha_salida, noches,
      precio_por_noche, subtotal, comision_plataforma, total, moneda,
      estado, cantidad_huespedes, notas_huesped, notas_internas,
      fecha_creacion, fecha_confirmacion, fecha_cancelacion,
      propiedades (id, titulo, slug, ciudad, estado),
      usuarios!reservas_huesped_id_fkey (id, nombre, apellido, email, avatar_url)
    `, { count: 'exact' })
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + limite - 1)

  if (filtros?.estado && filtros.estado !== 'TODOS') {
    query = query.eq('estado', filtros.estado)
  }

  if (filtros?.busqueda) {
    const q = filtros.busqueda.trim()
    query = query.or(`codigo.ilike.%${q}%,notas_huesped.ilike.%${q}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[getReservasAdmin] Error:', error.message)
    return { error: 'Error al cargar reservas' }
  }

  return {
    reservas: data,
    total: count ?? 0,
    pagina,
    totalPaginas: Math.ceil((count ?? 0) / limite),
  }
}

export async function getReservaDetalleAdmin(reservaId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('reservas')
    .select(`
      id, codigo, fecha_entrada, fecha_salida, noches,
      precio_por_noche, subtotal, comision_plataforma, comision_anfitrion, total, moneda,
      estado, cantidad_huespedes, notas_huesped, notas_internas,
      fecha_creacion, fecha_confirmacion, fecha_cancelacion,
      propiedades (id, titulo, slug, ciudad, estado, direccion, precio_por_noche, moneda,
        usuarios!propiedades_propietario_id_fkey (id, nombre, apellido, email, telefono)),
      usuarios!reservas_huesped_id_fkey (id, nombre, apellido, email, telefono, avatar_url, cedula),
      pagos (id, monto, moneda, metodo_pago, referencia, estado, fecha_creacion, fecha_verificacion, notas_verificacion)
    `)
    .eq('id', reservaId)
    .single()

  if (error) {
    console.error('[getReservaDetalleAdmin] Error:', error.message)
    return { error: 'Reserva no encontrada' }
  }

  const { data: auditLog } = await admin
    .from('admin_audit_log')
    .select('accion, creado_en, detalles, usuarios (nombre, apellido, email)')
    .eq('entidad', 'reserva')
    .eq('entidad_id', reservaId)
    .order('creado_en', { ascending: false })
    .limit(10)

  return {
    reserva: data,
    timeline: auditLog || [],
  }
}

export async function accionReservaAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    reservaId: formData.get('reservaId') as string,
    accion: formData.get('accion') as string,
    motivo: (formData.get('motivo') as string) || undefined,
  }

  const parsed = adminActualizarReservaSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { reservaId, accion, motivo } = parsed.data
  const admin = createAdminClient()

  const { data: reserva } = await admin
    .from('reservas')
    .select('estado, codigo')
    .eq('id', reservaId)
    .single()

  if (!reserva) return { error: 'Reserva no encontrada' }

  let nuevoEstado: EstadoReserva
  let accionLabel: string

  switch (accion) {
    case 'confirmar':
      nuevoEstado = 'CONFIRMADA'
      accionLabel = 'CONFIRMAR_RESERVA'
      break
    case 'rechazar':
      nuevoEstado = 'RECHAZADA'
      accionLabel = 'RECHAZAR_RESERVA'
      break
    case 'cancelar':
      nuevoEstado = 'CANCELADA_ANFITRION'
      accionLabel = 'CANCELAR_RESERVA_ADMIN'
      break
    default:
      return { error: 'Acción inválida' }
  }

  if (!puedeTransicionar(reserva.estado, nuevoEstado)) {
    const labelActual = ESTADO_RESERVA_LABELS[reserva.estado as EstadoReserva] || reserva.estado
    const labelNuevo = ESTADO_RESERVA_LABELS[nuevoEstado] || nuevoEstado
    return { error: `No se puede cambiar de ${labelActual} a ${labelNuevo}` }
  }

  const updateData: Record<string, unknown> = { estado: nuevoEstado }
  if (nuevoEstado === 'CONFIRMADA') updateData.fecha_confirmacion = new Date().toISOString()
  if (nuevoEstado === 'CANCELADA_ANFITRION') updateData.fecha_cancelacion = new Date().toISOString()

  const { error: updateError } = await admin
    .from('reservas')
    .update(updateData)
    .eq('id', reservaId)

  if (updateError) {
    console.error('[accionReservaAdmin] Error:', updateError.message)
    return { error: 'Error al actualizar la reserva' }
  }

  await logAdminAction({
    accion: accionLabel,
    entidad: 'reserva',
    entidadId: reservaId,
    detalles: { codigo: reserva.codigo, estadoAnterior: reserva.estado, nuevoEstado, motivo: motivo || null },
  })

  return { exito: true }
}

export async function getReservasStatsAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const [pendientes, confirmadas, enCurso, completadas, canceladas] = await Promise.all([
    admin.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
    admin.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'CONFIRMADA'),
    admin.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'EN_CURSO'),
    admin.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'COMPLETADA'),
    admin.from('reservas').select('id', { count: 'exact', head: true }).in('estado', ['CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA']),
  ])

  return {
    pendientes: pendientes.count ?? 0,
    confirmadas: confirmadas.count ?? 0,
    enCurso: enCurso.count ?? 0,
    completadas: completadas.count ?? 0,
    canceladas: canceladas.count ?? 0,
  }
}
