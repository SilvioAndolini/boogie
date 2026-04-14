export interface CotizacionEuro {
  tasa: number
  fuente: string
  ultimaActualizacion: string
}

const GO_URL = process.env.GO_BACKEND_URL || process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080'

let cached: { data: CotizacionEuro; ts: number } | null = null
const TTL = 15 * 60 * 1000

export async function getCotizacionEuro(): Promise<CotizacionEuro> {
  if (cached && Date.now() - cached.ts < TTL) return cached.data

  try {
    const res = await fetch(`${GO_URL}/api/v1/exchange-rate`, {
      next: { revalidate: 900 },
    })
    if (res.ok) {
      const body = await res.json()
      const data = body?.data ?? body
      const cot: CotizacionEuro = {
        tasa: data.tasa,
        fuente: data.fuente,
        ultimaActualizacion: data.ultimaActualizacion,
      }
      cached = { data: cot, ts: Date.now() }
      return cot
    }
  } catch {}

  return { tasa: 78.39, fuente: 'Ref.', ultimaActualizacion: new Date().toISOString() }
}
