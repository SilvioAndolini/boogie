'use server'

 
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { pagoSchema } from '@/lib/validations'
import { getUsuarioAutenticado } from '@/lib/auth'

 
export async function registrarPago(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const datos = {
    reservaId: formData.get('reservaId') as string,
    metodoPago: formData.get('metodoPago') as string,
    referencia: (formData.get('referencia') as string) || undefined,
    monto: formData.get('monto') as string,
    moneda: (formData.get('moneda') as string) || 'USD',
  }

  const validacion = pagoSchema.safeParse({
    ...datos,
    monto: parseFloat(datos.monto),
  })

  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const data = validacion.data
  const supabase = createAdminClient()

  const { data: reserva } = await supabase
    .from('reservas')
    .select('id')
    .eq('id', data.reservaId)
    .eq('huesped_id', user!.id)
    .single()

  if (!reserva) return { error: 'Reserva no encontrada' }

  const { error: insertError } = await supabase.from('pagos').insert({
    reserva_id: data.reservaId,
    usuario_id: user!.id,
    monto: data.monto,
    moneda: data.moneda,
    metodo_pago: data.metodoPago,
    referencia: data.referencia,
    estado: 'PENDIENTE',
  })

  if (insertError) {
    console.error('[registrarPago] Error:', insertError)
    return { error: 'Error al registrar el pago' }
  }

  revalidatePath('/dashboard/pagos')
  return { exito: true, mensaje: 'Pago registrado. Será verificado pronto.' }
}

 
export async function verificarPago(pagoId: string, aprobado: boolean, notas?: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: pago } = await supabase
    .from('pagos')
    .select('id, reserva_id')
    .eq('id', pagoId)
    .single()

  if (!pago) return { error: 'Pago no encontrado' }

  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, estado, propiedad_id')
    .eq('id', pago.reserva_id)
    .single()

  if (!reserva) return { error: 'Reserva no encontrada' }

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('propietario_id')
    .eq('id', reserva.propiedad_id)
    .single()

  if (!propiedad || propiedad.propietario_id !== user.id) {
    return { error: 'Sin permisos para verificar este pago' }
  }

  const estado = aprobado ? 'VERIFICADO' : 'RECHAZADO'

 
  const { error: updateError } = await supabase
    .from('pagos')
    .update({
      estado,
      verificado_por: user.id,
      notas_verificacion: notas,
      fecha_verificacion: new Date().toISOString(),
    })
    .eq('id', pagoId)

  if (updateError) {
    console.error('[verificarPago] Error:', updateError)
    return { error: 'Error al verificar el pago' }
  }

  if (aprobado && reserva.estado === 'PENDIENTE') {
    await supabase
      .from('reservas')
      .update({ estado: 'CONFIRMADA', fecha_confirmacion: new Date().toISOString() })
      .eq('id', reserva.id)
  }

  revalidatePath('/dashboard/reservas-recibidas')
  revalidatePath('/dashboard/pagos')
  return { exito: true }
}
 
export async function getMisPagos() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('pagos')
    .select('*, reserva:reservas(id, propiedad_id, propiedades!propiedad_id(titulo))')
    .eq('usuario_id', user!.id)
    .order('fecha_creacion', { ascending: false })

  return data ?? []
}
