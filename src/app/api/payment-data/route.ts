import { NextRequest, NextResponse } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return proxyToGo(request, '/api/v1/payment-data', { requireAuth: true })
}
