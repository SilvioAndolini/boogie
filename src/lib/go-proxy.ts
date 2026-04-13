import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from './go-api-client'

const GO_BASE = process.env.GO_BACKEND_URL || 'http://localhost:8080'

export async function proxyToGo(
  request: NextRequest,
  path: string,
  options?: { requireAuth?: boolean; method?: string }
): Promise<NextResponse> {
  const method = options?.method || request.method
  const url = `${GO_BASE}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options?.requireAuth) {
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  const forwarded = request.headers.get('X-Forwarded-For')
  if (forwarded) headers['X-Forwarded-For'] = forwarded

  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text()
  }

  const res = await fetch(url, { method, headers, body })

  const contentType = res.headers.get('content-type') || 'application/json'
  const data = await res.text()

  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': contentType },
  })
}

export function goUrl(path: string, params?: Record<string, string>): string {
  const base = `${GO_BASE}${path}`
  if (!params) return base
  const qs = new URLSearchParams(params).toString()
  return `${base}?${qs}`
}
