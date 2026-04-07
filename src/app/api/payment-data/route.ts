import { NextResponse } from 'next/server'
import { getDatosPago } from '@/lib/payment-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const datos = await getDatosPago()
    return NextResponse.json(datos, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching payment data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos de pago' },
      { status: 500 }
    )
  }
}
