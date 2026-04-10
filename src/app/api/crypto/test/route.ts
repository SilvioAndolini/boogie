import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const admin = createAdminClient()
    const body = await req.json()
    const { secret } = body as { secret?: string }

    if (secret !== process.env.CRYPTAPI_CALLBACK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: Record<string, unknown> = {}

    const { data: pago, error: pagoError } = await admin
      .from('pagos')
      .select('id, estado, reserva_id, crypto_address, monto')
      .eq('metodo_pago', 'CRIPTO')
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single()

    if (pagoError || !pago) {
      return NextResponse.json({ error: 'No hay pagos cripto', detail: pagoError }, { status: 404 })
    }

    results.pago_antes = { id: pago.id, estado: pago.estado, monto: pago.monto }

    const { data: reservaBefore } = await admin
      .from('reservas')
      .select('id, estado, codigo')
      .eq('id', pago.reserva_id)
      .single()

    results.reserva_antes = reservaBefore

    const fakeTxHash = 'MOCK_TX_' + Date.now().toString(36)

    const { error: pagoUpdateError } = await admin
      .from('pagos')
      .update({
        estado: 'EN_VERIFICACION',
        crypto_tx_hash: fakeTxHash,
        crypto_confirmations: 0,
        crypto_value_coin: String(pago.monto),
        referencia: `TX: ${fakeTxHash}`,
      })
      .eq('id', pago.id)

    if (pagoUpdateError) {
      return NextResponse.json({ error: 'Error actualizando pago a EN_VERIFICACION', detail: pagoUpdateError }, { status: 500 })
    }

    results.paso1_en_verificacion = 'OK'

    const { error: pagoConfirmError } = await admin
      .from('pagos')
      .update({
        estado: 'VERIFICADO',
        crypto_confirmations: 1,
        fecha_verificacion: new Date().toISOString(),
      })
      .eq('id', pago.id)

    if (pagoConfirmError) {
      return NextResponse.json({ error: 'Error actualizando pago a VERIFICADO', detail: pagoConfirmError }, { status: 500 })
    }

    results.paso2_pago_verificado = 'OK'

    const { error: reservaUpdateError } = await admin
      .from('reservas')
      .update({
        estado: 'CONFIRMADA',
        fecha_confirmacion: new Date().toISOString(),
      })
      .eq('id', pago.reserva_id)
      .in('estado', ['PENDIENTE'])

    if (reservaUpdateError) {
      results.paso3_reserva_confirmada = { error: reservaUpdateError }
    } else {
      results.paso3_reserva_confirmada = 'OK'
    }

    const { data: pagoFinal } = await admin
      .from('pagos')
      .select('id, estado, crypto_tx_hash, crypto_confirmations, referencia')
      .eq('id', pago.id)
      .single()

    const { data: reservaFinal } = await admin
      .from('reservas')
      .select('id, estado, fecha_confirmacion')
      .eq('id', pago.reserva_id)
      .single()

    results.pago_despues = pagoFinal
    results.reserva_despues = reservaFinal

    return NextResponse.json(results)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[crypto/test] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
