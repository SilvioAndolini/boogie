'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'

export async function getTasaBCV() {
  const cotizacion = await getCotizacionEuro()
  return { tasa: cotizacion.tasa, fuente: cotizacion.fuente }
}

export async function crearRecargaWallet(datos: {
  monto_usd: number
  metodo: string
  datos_pago: Record<string, string>
}) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  if (!datos.monto_usd || datos.monto_usd <= 0) {
    return { error: 'Monto inválido' }
  }

  const supabase = createAdminClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (!wallet) return { error: 'No tienes una wallet activa' }

  const descripcion = `Recarga ${datos.metodo.replace(/_/g, ' ')} - Ref: ${datos.datos_pago.referencia || 'Pendiente'}`

  const { data, error } = await supabase
    .from('wallet_transacciones')
    .insert({
      id: crypto.randomUUID(),
      wallet_id: wallet.id,
      tipo: 'RECARGA',
      monto_usd: datos.monto_usd,
      descripcion,
      referencia_id: datos.datos_pago.referencia || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[crearRecargaWallet] Error:', error.message)
    return { error: 'Error al registrar la recarga' }
  }

  revalidatePath('/dashboard/pagos/configuracion')
  revalidatePath('/dashboard/pagos/configuracion/wallet')
  return { transaccion: data }
}

export async function getWallet() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[getWallet] Error:', error.message)
    return { error: 'Error al consultar wallet' }
  }

  return { wallet: data }
}

export async function activarWallet() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: existente } = await supabase
    .from('wallets')
    .select('id')
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (existente) {
    return { error: 'Ya tienes una Boogie Wallet activa' }
  }

  const { error } = await supabase
    .from('wallets')
    .insert({
      usuario_id: user.id,
      estado: 'ACTIVA',
      saldo_usd: 0,
    })

  if (error) {
    console.error('[activarWallet] Error:', error.message)
    return { error: 'Error al activar tu wallet' }
  }

  revalidatePath('/dashboard/pagos/configuracion')
  revalidatePath('/dashboard/pagos/configuracion/wallet')
  return { exito: true }
}

export async function getWalletTransacciones(walletId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  const supabase = createAdminClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id')
    .eq('id', walletId)
    .eq('usuario_id', user.id)
    .maybeSingle()

  if (!wallet) return []

  const { data } = await supabase
    .from('wallet_transacciones')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}
