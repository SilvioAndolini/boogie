const CRYPTAPI_BASE = 'https://api.cryptapi.io'

export const CRYPTAPI_TICKER = 'trx_usdt'
export const CRYPTAPI_NETWORK = 'TRC20'
export const CRYPTAPI_CURRENCY = 'USDT'
export const CRYPTAPI_MIN_CONFIRMATIONS = 1

export function getWalletAddress(): string {
  return process.env.CRYPTAPI_WALLET_ADDRESS || ''
}

export function getCallbackSecret(): string {
  return process.env.CRYPTAPI_CALLBACK_SECRET || ''
}

export async function createCryptapiAddress(params: {
  callbackUrl: string
  address: string
  pending?: number
}): Promise<{ address_in: string; status: string }> {
  const url = new URL(`${CRYPTAPI_BASE}/${CRYPTAPI_TICKER}/create/`)
  url.searchParams.set('callback', params.callbackUrl)
  url.searchParams.set('address', params.address)
  url.searchParams.set('pending', String(params.pending ?? 1))

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`CryptAPI create error: ${res.status} - ${text}`)
  }

  const data = await res.json()
  if (data.status !== 'success') {
    throw new Error(`CryptAPI error: ${JSON.stringify(data)}`)
  }

  return {
    address_in: data.address_in as string,
    status: data.status as string,
  }
}

export async function getCryptapiLogs(callbackUrl: string): Promise<unknown[]> {
  const url = new URL(`${CRYPTAPI_BASE}/${CRYPTAPI_TICKER}/logs/`)
  url.searchParams.set('callback', callbackUrl)

  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) return []

  const data = await res.json()
  return (data as Record<string, unknown>).logs as unknown[] ?? []
}

export function buildExplorerUrl(txHash: string): string {
  return `https://tronscan.org/#/transaction/${txHash}`
}
