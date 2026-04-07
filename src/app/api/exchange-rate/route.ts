import { NextResponse } from 'next/server'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const ip = getClientIP(request)
  const { success, remaining, resetIn } = rateLimit(`exchange:${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 60,
  })

  if (!success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta más tarde.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    )
  }

  try {
    const cotizacion = await getCotizacionEuro()
    return NextResponse.json(
      {
        tasa: cotizacion.tasa,
        fuente: cotizacion.fuente,
        ultimaActualizacion: cotizacion.ultimaActualizacion.toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch {
    return NextResponse.json(
      { 
        tasa: 78.39, 
        fuente: 'Ref.', 
        ultimaActualizacion: new Date().toISOString(),
        isFallback: true 
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  }
}
