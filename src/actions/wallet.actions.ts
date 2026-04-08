'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
  const { data } = await supabase
    .from('wallet_transacciones')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(50)

  return data ?? []
}
