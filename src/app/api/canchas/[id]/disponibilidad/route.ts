import { NextRequest, NextResponse } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const qs = request.nextUrl.search
  return proxyToGo(request, `/api/v1/canchas/${id}/disponibilidad${qs}`)
}
