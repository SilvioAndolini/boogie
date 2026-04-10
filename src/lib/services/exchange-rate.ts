export interface CotizacionEuro {
  tasa: number
  fuente: string
  ultimaActualizacion: Date
}

const FALLBACK_TASA = 78.39

let cachedRate: { data: CotizacionEuro; timestamp: number } | null = null
const CACHE_TTL = 15 * 60 * 1000

async function fetchFromERApi(): Promise<CotizacionEuro | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      next: { revalidate: 900 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.result !== 'success' || !data.rates?.VES) return null
    return {
      tasa: data.rates.VES,
      fuente: 'BCV',
      ultimaActualizacion: new Date(data.time_last_update_unix * 1000),
    }
  } catch {
    return null
  }
}

async function fetchFromExchangerate(): Promise<CotizacionEuro | null> {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR', {
      next: { revalidate: 900 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.rates?.VES) return null
    return {
      tasa: data.rates.VES,
      fuente: 'BCV',
      ultimaActualizacion: new Date(data.date ? new Date(data.date).getTime() : Date.now()),
    }
  } catch {
    return null
  }
}

export async function getCotizacionEuro(): Promise<CotizacionEuro> {
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_TTL) {
    return cachedRate.data
  }

  const cotizacion =
    (await fetchFromERApi()) ??
    (await fetchFromExchangerate()) ?? {
      tasa: FALLBACK_TASA,
      fuente: 'Ref.',
      ultimaActualizacion: new Date(),
    }

  cachedRate = { data: cotizacion, timestamp: Date.now() }
  return cotizacion
}
