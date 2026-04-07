import { NextResponse } from 'next/server'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'

export const dynamic = 'force-dynamic'

export async function GET() {
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
