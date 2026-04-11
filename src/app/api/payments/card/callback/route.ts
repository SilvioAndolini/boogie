import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyMoonPayCallback } from '@/lib/payments/moonpay'

export async function GET(req: NextRequest) {
  const step = '[payments/card/callback]'
  try {
    const queryString = req.url.split('?')[1] || ''

    if (!verifyMoonPayCallback(queryString)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const externalTransactionId = searchParams.get('externalTransactionId')
    const baseCurrencyAmount = searchParams.get('baseCurrencyAmount')
    const quoteCurrencyAmount = searchParams.get('quoteCurrencyAmount')
    const quoteCurrency = searchParams.get('quoteCurrency')
    const transactionStatus = searchParams.get('transactionStatus')
    const moonpayTransactionId = searchParams.get('transactionId')

    console.log(step, 'Callback:', { externalTransactionId, transactionStatus, moonpayTransactionId })

    if (!externalTransactionId) {
      return NextResponse.json({ error: 'Missing externalTransactionId' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: pago } = await admin
      .from('pagos')
      .select('id, estado, reserva_id')
      .eq('metodo_pago', 'TARJETA_INTERNACIONAL')
      .eq('referencia', `MoonPay TX: ${externalTransactionId}`)
      .limit(1)
      .single()

    if (!pago) {
      console.error(step, 'Pago no encontrado:', externalTransactionId)
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    if (pago.estado === 'VERIFICADO' || pago.estado === 'ACREDITADO') {
      return NextResponse.json({ ok: true, message: 'Ya verificado' })
    }

    const estadoPago = mapMoonPayStatus(transactionStatus)

    const updateData: Record<string, unknown> = {
      estado: estadoPago,
      referencia: `MoonPay: ${moonpayTransactionId || externalTransactionId} (${transactionStatus})`,
    }

    if (estadoPago === 'VERIFICADO') {
      updateData.fecha_verificacion = new Date().toISOString()
    }

    await admin.from('pagos').update(updateData).eq('id', pago.id)

    if (estadoPago === 'VERIFICADO' && pago.reserva_id) {
      await admin
        .from('reservas')
        .update({ estado: 'CONFIRMADA', fecha_confirmacion: new Date().toISOString() })
        .eq('id', pago.reserva_id)
        .in('estado', ['PENDIENTE'])

      console.log(step, 'Reserva confirmada:', pago.reserva_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[payments/card/callback] FATAL:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function mapMoonPayStatus(status: string | null): 'PENDIENTE' | 'EN_VERIFICACION' | 'VERIFICADO' | 'RECHAZADO' {
  switch (status) {
    case 'completed':
      return 'VERIFICADO'
    case 'pending':
    case 'waitingAuthorization':
    case 'waitingPayment':
    case 'paymentInProgress':
    case 'cryptoTransferInProgress':
      return 'EN_VERIFICACION'
    case 'failed':
    case 'refunded':
      return 'RECHAZADO'
    default:
      return 'PENDIENTE'
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
