import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCallbackSecret, CRYPTAPI_MIN_CONFIRMATIONS } from '@/lib/crypto/cryptapi'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reservaId = searchParams.get('reservaId')
    const propiedadId = searchParams.get('propiedadId')
    const fechaEntrada = searchParams.get('fechaEntrada')
    const fechaSalida = searchParams.get('fechaSalida')
    const secret = searchParams.get('secret')
    const txHash = searchParams.get('tx_hash') || searchParams.get('tx_in')
    const valueCoin = searchParams.get('value_coin') || searchParams.get('value')
    const confirmations = parseInt(searchParams.get('confirmations') || '0', 10)

    if (secret !== getCallbackSecret()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!txHash) {
      return NextResponse.json({ error: 'Missing tx_hash' }, { status: 400 })
    }

    const admin = createAdminClient()

    let query = admin
      .from('pagos')
      .select('id, estado, reserva_id')
      .eq('metodo_pago', 'CRIPTO')

    if (reservaId) {
      query = query.eq('reserva_id', reservaId)
    } else if (propiedadId) {
      const { data: reserva } = await admin
        .from('reservas')
        .select('id')
        .eq('propiedad_id', propiedadId)
        .gte('fecha_entrada', fechaEntrada || '')
        .lte('fecha_salida', fechaSalida || '')
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .single()

      if (!reserva) {
        return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
      }
      query = query.eq('reserva_id', reserva.id)
    } else {
      return NextResponse.json({ error: 'Missing reservaId or propiedadId' }, { status: 400 })
    }

    const { data: existingPago } = await query
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single()

    if (!existingPago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    if (existingPago.estado === 'VERIFICADO' || existingPago.estado === 'ACREDITADO') {
      return NextResponse.json({ ok: true, message: 'Ya verificado' })
    }

    const isConfirmed = confirmations >= CRYPTAPI_MIN_CONFIRMATIONS

    const updateData: Record<string, unknown> = {
      crypto_tx_hash: txHash,
      crypto_confirmations: confirmations,
      crypto_value_coin: valueCoin || null,
      referencia: `TX: ${txHash.slice(0, 16)}...`,
    }

    if (isConfirmed) {
      updateData.estado = 'VERIFICADO'
      updateData.fecha_verificacion = new Date().toISOString()

      await admin
        .from('reservas')
        .update({ estado: 'CONFIRMADA', fecha_confirmacion: new Date().toISOString() })
        .eq('id', existingPago.reserva_id)
        .in('estado', ['PENDIENTE'])
    } else {
      updateData.estado = 'EN_VERIFICACION'
    }

    await admin
      .from('pagos')
      .update(updateData)
      .eq('id', existingPago.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[crypto/callback] Error:', err)
    return NextResponse.json({ error: 'Callback error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
