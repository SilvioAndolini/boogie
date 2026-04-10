'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { adminVerificarPagoSchema } from '@/lib/admin-validations'
import { revalidatePath } from 'next/cache'

export async function getPagosAdmin(filtros?: {
  estado?: string
  metodoPago?: string
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
    .from('pagos')
    .select(`
      id, monto, moneda, monto_equivalente, moneda_equivalente, tasa_cambio,
      metodo_pago, referencia, comprobante, estado,
      fecha_creacion, fecha_verificacion, fecha_acreditacion,
      notas_verificacion,
      reservas (
        id, codigo, estado,
        propiedades (id, titulo),
        usuarios!reservas_huesped_id_fkey (id, nombre, apellido, email)
      ),
      usuarios!pagos_usuario_id_fkey (id, nombre, apellido, email)
    `, { count: 'exact' })
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + limite - 1)

  if (filtros?.estado && filtros.estado !== 'TODOS') {
    query = query.eq('estado', filtros.estado)
  }

  if (filtros?.metodoPago && filtros.metodoPago !== 'TODOS') {
    query = query.eq('metodo_pago', filtros.metodoPago)
  }

  if (filtros?.busqueda) {
    const q = filtros.busqueda.trim()
    query = query.or(`referencia.ilike.%${q}%,notas_verificacion.ilike.%${q}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[getPagosAdmin] Error:', error.message)
    return { error: 'Error al cargar pagos' }
  }

  return {
    pagos: data,
    total: count ?? 0,
    pagina,
    totalPaginas: Math.ceil((count ?? 0) / limite),
  }
}

export async function getPagosStatsAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const [pendientes, enVerificacion, verificados, acreditados, rechazados, totalResult] = await Promise.all([
    admin.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
    admin.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'EN_VERIFICACION'),
    admin.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'VERIFICADO'),
    admin.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'ACREDITADO'),
    admin.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'RECHAZADO'),
    admin.from('pagos').select('monto, moneda').in('estado', ['VERIFICADO', 'ACREDITADO']),
  ])

  let totalUSD = 0
  let totalVES = 0
  for (const p of (totalResult.data || [])) {
    if (p.moneda === 'USD') totalUSD += Number(p.monto)
    else totalVES += Number(p.monto)
  }

  return {
    pendientes: pendientes.count ?? 0,
    enVerificacion: enVerificacion.count ?? 0,
    verificados: verificados.count ?? 0,
    acreditados: acreditados.count ?? 0,
    rechazados: rechazados.count ?? 0,
    totalProcesadoUSD: totalUSD,
    totalProcesadoVES: totalVES,
  }
}

export async function verificarPagoAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    pagoId: formData.get('pagoId') as string,
    accion: formData.get('accion') as 'VERIFICADO' | 'ACREDITADO' | 'RECHAZADO',
    notasVerificacion: (formData.get('notasVerificacion') as string) || undefined,
  }

  const parsed = adminVerificarPagoSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { pagoId, accion, notasVerificacion } = parsed.data
  const admin = createAdminClient()

  const { data: pago } = await admin
    .from('pagos')
    .select('estado, monto, moneda, metodo_pago, referencia')
    .eq('id', pagoId)
    .single()

  if (!pago) return { error: 'Pago no encontrado' }

  const transicionesValidas: Record<string, string[]> = {
    PENDIENTE: ['VERIFICADO', 'RECHAZADO'],
    EN_VERIFICACION: ['VERIFICADO', 'RECHAZADO'],
    VERIFICADO: ['ACREDITADO', 'RECHAZADO'],
  }

  if (!transicionesValidas[pago.estado]?.includes(accion)) {
    return { error: `No se puede cambiar de "${pago.estado}" a "${accion}"` }
  }

  const updateData: Record<string, unknown> = {
    estado: accion,
    notas_verificacion: notasVerificacion || null,
  }

  if (accion === 'VERIFICADO') updateData.fecha_verificacion = new Date().toISOString()
  if (accion === 'ACREDITADO') updateData.fecha_acreditacion = new Date().toISOString()

  const { error: updateError } = await admin
    .from('pagos')
    .update(updateData)
    .eq('id', pagoId)

  if (updateError) {
    console.error('[verificarPagoAdmin] Error:', updateError.message)
    return { error: 'Error al actualizar el pago' }
  }

  await logAdminAction({
    accion: `PAGO_${accion}`,
    entidad: 'pago',
    entidadId: pagoId,
    detalles: { estadoAnterior: pago.estado, nuevoEstado: accion, monto: pago.monto, moneda: pago.moneda, metodo: pago.metodo_pago },
  })

  if (accion === 'VERIFICADO') {
    const { data: pagoCompleto } = await admin
      .from('pagos')
      .select('reserva_id, reservas (estado)')
      .eq('id', pagoId)
      .single()

    if (pagoCompleto?.reserva_id) {
      const reservaEstado = (pagoCompleto.reservas as unknown as { estado: string })?.estado
      if (reservaEstado === 'PENDIENTE') {
        await admin
          .from('reservas')
          .update({ estado: 'CONFIRMADA', fecha_confirmacion: new Date().toISOString() })
          .eq('id', pagoCompleto.reserva_id)

        await logAdminAction({
          accion: 'AUTO_CONFIRMAR_RESERVA',
          entidad: 'reserva',
          entidadId: pagoCompleto.reserva_id,
          detalles: { motivo: 'Pago verificado' },
        })
      }
    }
  }

  revalidatePath('/admin/pagos')
  return { exito: true }
}
