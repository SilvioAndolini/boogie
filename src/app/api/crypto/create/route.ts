import { NextRequest, NextResponse } from 'next/server'
import { createCryptapiAddress, getWalletAddress, CRYPTAPI_TICKER, CRYPTAPI_NETWORK, CRYPTAPI_CURRENCY } from '@/lib/crypto/cryptapi'
import { APP_URL } from '@/lib/constants'
import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const user = await getUsuarioAutenticado()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { reservaId, monto } = body as { reservaId: string; monto: number }

    if (!reservaId || !monto || monto <= 0) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
    }

    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet no configurada' }, { status: 500 })
    }

    const callbackBase = process.env.NEXT_PUBLIC_APP_URL || APP_URL
    const callbackUrl = `${callbackBase}/api/crypto/callback?reservaId=${reservaId}&monto=${monto}&secret=${process.env.CRYPTAPI_CALLBACK_SECRET || ''}`

    const result = await createCryptapiAddress({
      callbackUrl,
      address: walletAddress,
      pending: 1,
    })

    const admin = createAdminClient()
    await admin.from('pagos').insert({
      id: crypto.randomUUID(),
      monto,
      moneda: 'USD',
      metodo_pago: 'CRIPTO',
      estado: 'PENDIENTE',
      referencia: 'Crypto - pendiente TX',
      fecha_creacion: new Date().toISOString(),
      reserva_id: reservaId,
      usuario_id: user.id,
      crypto_address: result.address_in,
    })

    return NextResponse.json({
      address: result.address_in,
      ticker: CRYPTAPI_TICKER,
      network: CRYPTAPI_NETWORK,
      currency: CRYPTAPI_CURRENCY,
      amount: monto,
    })
  } catch (err) {
    console.error('[crypto/create] Error:', err)
    return NextResponse.json({ error: 'Error al generar direccion crypto' }, { status: 500 })
  }
}
