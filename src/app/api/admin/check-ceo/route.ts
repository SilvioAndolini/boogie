import { NextRequest, NextResponse } from 'next/server'
import { proxyToGo } from '@/lib/go-proxy'

export async function GET(request: NextRequest) {
  return proxyToGo(request, '/api/v1/auth/me', { requireAuth: true })
}
