import { NextRequest, NextResponse } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export async function GET(request: NextRequest) {
  const qs = request.url.split('?')[1] || ''
  return proxyToGo(request, `/api/v1/payments/card/callback?${qs}`)
}

export async function POST(request: NextRequest) {
  const qs = request.url.split('?')[1] || ''
  return proxyToGo(request, `/api/v1/payments/card/callback?${qs}`, { method: 'POST' })
}
