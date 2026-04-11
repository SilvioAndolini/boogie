export function getMoonPayApiKey(): string {
  return process.env.NEXT_PUBLIC_MOONPAY_API_KEY || ''
}

export function getMoonPaySecretKey(): string {
  return process.env.MOONPAY_SECRET_KEY || ''
}

export function getMoonPayWalletAddress(): string {
  return process.env.CRYPTAPI_WALLET_ADDRESS || ''
}

export function getMoonPayEnvironment(): 'sandbox' | 'production' {
  return process.env.MOONPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
}

export function buildMoonPayUrl(params: {
  baseCurrencyCode: string
  baseCurrencyAmount: number
  defaultCurrencyCode: string
  walletAddress: string
  email?: string
  externalTransactionId?: string
}): string {
  const env = getMoonPayEnvironment()
  const base = env === 'sandbox'
    ? 'https://buy-sandbox.moonpay.com'
    : 'https://buy.moonpay.com'

  const queryParams = new URLSearchParams({
    apiKey: getMoonPayApiKey(),
    baseCurrencyCode: params.baseCurrencyCode,
    baseCurrencyAmount: String(params.baseCurrencyAmount),
    defaultCurrencyCode: params.defaultCurrencyCode,
    walletAddress: params.walletAddress,
    theme: 'light',
  })

  if (params.email) queryParams.set('email', params.email)
  if (params.externalTransactionId) queryParams.set('externalTransactionId', params.externalTransactionId)

  return `${base}?${queryParams.toString()}`
}

export function verifyMoonPayCallback(queryString: string): boolean {
  const secret = getMoonPaySecretKey()
  if (!secret) return true

  try {
    const crypto = require('crypto')
    const params = new URLSearchParams(queryString)
    const receivedSignature = params.get('signature')
    if (!receivedSignature) return false

    params.delete('signature')
    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(sortedParams)
      .digest('base64')

    return receivedSignature === expectedSignature
  } catch {
    return true
  }
}
