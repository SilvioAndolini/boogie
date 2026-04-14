'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { goGet, goPost } from '@/lib/go-api-client'

export async function getTasaBCV() {
  try {
    const data = await goGet<{ tasa: number; fuente: string }>('/api/v1/exchange-rate')
    return { tasa: data.tasa, fuente: data.fuente }
  } catch {
    return { tasa: 78.39, fuente: 'Ref.' }
  }
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

  try {
    const transaccion = await goPost<Record<string, unknown>>('/api/v1/wallet/recarga', datos)
    revalidatePath('/dashboard/pagos/configuracion')
    revalidatePath('/dashboard/pagos/configuracion/wallet')
    return { transaccion }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al registrar la recarga'
    return { error: message }
  }
}

export async function getWallet() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const wallet = await goGet<Record<string, unknown> & { id: string }>('/api/v1/wallet')
    return { wallet }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al consultar wallet'
    return { error: message }
  }
}

export async function activarWallet() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    await goPost('/api/v1/wallet/activar')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al activar tu wallet'
    return { error: message }
  }

  revalidatePath('/dashboard/pagos/configuracion')
  revalidatePath('/dashboard/pagos/configuracion/wallet')
  return { exito: true }
}

export async function getWalletTransacciones(walletId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  try {
    return await goGet<Record<string, unknown>[]>(`/api/v1/wallet/${walletId}/transacciones`) ?? []
  } catch {
    return []
  }
}
