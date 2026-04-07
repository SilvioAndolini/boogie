import { NextResponse } from 'next/server'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cotizacion = await getCotizacionEuro()
    return NextResponse.json({
      tasa: cotizacion.tasa,
      fuente: cotizacion.fuente,
      ultimaActualizacion: cotizacion.ultimaActualizacion.toISOString(),
    })
  } catch {
    return NextResponse.json(
      { tasa: 78.39, fuente: 'Ref.', ultimaActualizacion: new Date().toISOString() },
      { status: 200 },
    )
  }
}
