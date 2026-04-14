import { NextRequest } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return proxyToGo(request, '/api/v1/crypto/verificacion-manual', { requireAuth: true })
}
