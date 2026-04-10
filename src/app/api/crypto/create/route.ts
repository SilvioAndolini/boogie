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
    const {
      reservaId,
      monto,
      propiedadId,
      fechaEntrada,
      fechaSalida,
      cantidadHuespedes,
    } = body as {
      reservaId?: string
      monto: number
      propiedadId?: string
      fechaEntrada?: string
      fechaSalida?: string
      cantidadHuespedes?: number
    }

    if (!monto || monto <= 0) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
    }

    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet no configurada' }, { status: 500 })
    }

    let reservaIdFinal = reservaId

    if (!reservaIdFinal && propiedadId && fechaEntrada && fechaSalida && cantidadHuespedes) {
      const { crearReserva } = await import('@/actions/reserva.actions')
      const result = await crearReserva({
        propiedadId,
        fechaEntrada,
        fechaSalida,
        cantidadHuespedes,
      })
      if (result.exito && result.datos) {
        reservaIdFinal = result.datos.id
      } else {
        const msg = result.error?.mensaje || 'Error al crear la reserva'
        return NextResponse.json({ error: msg }, { status: 400 })
      }
    }

    if (!reservaIdFinal) {
      return NextResponse.json({ error: 'Falta reservaId o datos de reserva' }, { status: 400 })
    }

    const callbackBase = process.env.NEXT_PUBLIC_APP_URL || APP_URL
    const callbackUrl = `${callbackBase}/api/crypto/callback?reservaId=${reservaIdFinal}&monto=${monto}&secret=${process.env.CRYPTAPI_CALLBACK_SECRET || ''}`

    const result = await createCryptapiAddress({
      callbackUrl,
      address: walletAddress,
      pending: 1,
    })

    try {
      const admin = createAdminClient()
      const { error: insertError } = await admin.from('pagos').insert({
        id: crypto.randomUUID(),
        monto,
        moneda: 'USD',
        metodo_pago: 'CRIPTO',
        estado: 'PENDIENTE',
        referencia: 'Crypto - pendiente TX',
        fecha_creacion: new Date().toISOString(),
        reserva_id: reservaIdFinal,
        usuario_id: user.id,
        crypto_address: result.address_in,
      })
      if (insertError) {
        console.error('[crypto/create] DB insert error:', insertError)
      }
    } catch (dbErr) {
      console.error('[crypto/create] DB insert exception:', dbErr)
    }

    return NextResponse.json({
      address: result.address_in,
      reservaId: reservaIdFinal,
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
