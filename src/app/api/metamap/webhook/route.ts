import { NextRequest, NextResponse } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export async function POST(request: NextRequest) {
  return proxyToGo(request, '/api/v1/metamap/webhook', { method: 'POST' })
}
