const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1'

export const NOWPAYMENTS_OUT_CURRENCY = 'usdttrc20'

export function getNowPaymentsApiKey(): string {
  return process.env.NOWPAYMENTS_API_KEY || ''
}

export async function createNowPaymentsInvoice(params: {
  priceAmount: number
  priceCurrency: string
  orderId: string
  orderDescription: string
  ipnCallbackUrl: string
  successUrl: string
  cancelUrl: string
}): Promise<{
  id: string
  invoice_url: string
  price_amount: number
  price_currency: string
  payment_status: string
}> {
  const apiKey = getNowPaymentsApiKey()
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY no configurada')

  const res = await fetch(`${NOWPAYMENTS_API}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: params.priceCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: params.ipnCallbackUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`NOWPayments invoice error: ${res.status} - ${text}`)
  }

  const data = await res.json()
  return {
    id: data.id,
    invoice_url: data.invoice_url,
    price_amount: data.price_amount,
    price_currency: data.price_currency,
    payment_status: data.payment_status,
  }
}

export async function getNowPaymentsPaymentStatus(paymentId: string): Promise<{
  payment_status: string
  payment_id: string
  price_amount: number
  actually_paid: number
  pay_address: string
  outcome_amount: number
  outcome_currency: string
}> {
  const apiKey = getNowPaymentsApiKey()
  if (!apiKey) throw new Error('NOWPAYMENTS_API_KEY no configurada')

  const res = await fetch(`${NOWPAYMENTS_API}/payment/${paymentId}`, {
    headers: { 'x-api-key': apiKey },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`NOWPayments status error: ${res.status} - ${text}`)
  }

  return res.json()
}

export function mapNowPaymentsStatus(status: string): 'PENDIENTE' | 'EN_VERIFICACION' | 'VERIFICADO' | 'RECHAZADO' | 'REEMBOLSADO' {
  switch (status) {
    case 'finished':
    case 'confirmed':
      return 'VERIFICADO'
    case 'sending':
    case 'partially_paid':
    case 'waiting':
      return 'EN_VERIFICACION'
    case 'failed':
    case 'expired':
    case 'refunded':
      return 'RECHAZADO'
    default:
      return 'PENDIENTE'
  }
}
