import { NextResponse, NextRequest } from 'next/server'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { useGoBackend } from '@/lib/go-api-client'

export const dynamic = 'force-dynamic'

const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

export async function GET(request: Request) {
  if (useGoBackend('exchange')) {
    try {
      const res = await fetch(`${GO_BACKEND_URL}/api/v1/exchange-rate`, {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
      })
      if (res.ok) {
        const json = await res.json()
        const data = (json as { data?: unknown }).data ?? json
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        })
      }
    } catch {}
  }

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
