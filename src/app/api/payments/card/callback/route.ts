import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mapNowPaymentsStatus } from '@/lib/payments/nowpayments'

export async function POST(req: NextRequest) {
  const step = '[payments/card/callback]'
  try {
    const body = await req.json()
    const {
      payment_id,
      payment_status,
      price_amount,
      order_id,
      outcome_amount,
      outcome_currency,
    } = body as Record<string, unknown>

    console.log(step, 'IPN received:', { payment_id, payment_status, order_id })

    if (!payment_id || !payment_status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET || ''
    const receivedSecret = req.headers.get('x-nowpayments-ipn-secret') || ''
    if (ipnSecret && receivedSecret !== ipnSecret) {
      console.warn(step, 'Invalid IPN secret')
    }

    const admin = createAdminClient()

    const { data: pago } = await admin
      .from('pagos')
      .select('id, estado, reserva_id')
      .eq('metodo_pago', 'TARJETA_INTERNACIONAL')
      .like('referencia', `%${payment_id}%`)
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single()

    if (!pago) {
      const { data: pagoByRef } = await admin
        .from('pagos')
        .select('id, estado, reserva_id')
        .eq('metodo_pago', 'TARJETA_INTERNACIONAL')
        .like('referencia', `NOWPayments Invoice: ${payment_id}%`)
        .limit(1)
        .single()

      if (!pagoByRef) {
        console.error(step, 'Pago no encontrado para payment_id:', payment_id)
        return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
      }

      return updatePaymentAndReserva(admin, pagoByRef, String(payment_status), String(payment_id), String(outcome_amount || ''), String(outcome_currency || ''))
    }

    return updatePaymentAndReserva(admin, pago, String(payment_status), String(payment_id), String(outcome_amount || ''), String(outcome_currency || ''))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[payments/card/callback] FATAL:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function updatePaymentAndReserva(
  admin: ReturnType<typeof createAdminClient>,
  pago: { id: string; estado: string; reserva_id: string },
  rawStatus: string,
  paymentId: string,
  outcomeAmount: string,
  outcomeCurrency: string,
) {
  const estadoPago = mapNowPaymentsStatus(rawStatus)

  if (pago.estado === 'VERIFICADO' || pago.estado === 'ACREDITADO') {
    return NextResponse.json({ ok: true, message: 'Ya verificado' })
  }

  const updateData: Record<string, unknown> = {
    estado: estadoPago,
    referencia: `NOWPayments: ${paymentId} (${rawStatus})`,
  }

  if (estadoPago === 'VERIFICADO') {
    updateData.fecha_verificacion = new Date().toISOString()
  }

  const { error: pagoError } = await admin
    .from('pagos')
    .update(updateData)
    .eq('id', pago.id)

  if (pagoError) {
    console.error('[payments/card/callback] Pago update error:', pagoError)
  }

  if (estadoPago === 'VERIFICADO' && pago.reserva_id) {
    const { error: reservaError } = await admin
      .from('reservas')
      .update({
        estado: 'CONFIRMADA',
        fecha_confirmacion: new Date().toISOString(),
      })
      .eq('id', pago.reserva_id)
      .in('estado', ['PENDIENTE'])

    if (reservaError) {
      console.error('[payments/card/callback] Reserva update error:', reservaError)
    }

    console.log('[payments/card/callback] Reserva confirmada:', pago.reserva_id)
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
