import { NextRequest } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.search
  return proxyToGo(request, `/api/v1/crypto/verificar${qs}`, { requireAuth: true })
}
