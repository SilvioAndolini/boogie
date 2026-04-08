'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getMetodosPago() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('metodos_pago')
    .select('*')
    .eq('usuario_id', user.id)
    .order('principal', { ascending: false })

  if (error) {
    console.error('[getMetodosPago] Error:', error.message)
    return { error: 'Error al consultar métodos de pago' }
  }

  return { metodos: data }
}

export async function crearMetodoPago(datos: {
  tipo: string
  banco?: string
  telefono?: string
  cedula?: string
  numero_cuenta?: string
  titular?: string
  email_zelle?: string
  direccion_usdt?: string
}) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: existentes } = await supabase
    .from('metodos_pago')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('tipo', datos.tipo)

  if (existentes && existentes.length > 0) {
    return { error: 'Ya tienes un método de este tipo configurado' }
  }

  const { data, error } = await supabase
    .from('metodos_pago')
    .insert({
      id: crypto.randomUUID(),
      usuario_id: user.id,
      tipo: datos.tipo,
      banco: datos.banco || null,
      telefono: datos.telefono || null,
      cedula: datos.cedula || null,
      numero_cuenta: datos.numero_cuenta || null,
      titular: datos.titular || null,
      email_zelle: datos.email_zelle || null,
      direccion_usdt: datos.direccion_usdt || null,
      activo: true,
      principal: false,
    })
    .select()
    .single()

  if (error) {
    console.error('[crearMetodoPago] Error:', error.message)
    return { error: 'Error al guardar el método de pago' }
  }

  revalidatePath('/dashboard/pagos/configuracion')
  return { metodo: data }
}

export async function eliminarMetodoPago(id: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('metodos_pago')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) {
    console.error('[eliminarMetodoPago] Error:', error.message)
    return { error: 'Error al eliminar el método de pago' }
  }

  revalidatePath('/dashboard/pagos/configuracion')
  return { exito: true }
}
