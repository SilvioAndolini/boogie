const GO_BASE_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

interface GoFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string
  raw?: boolean
}

class GoAPIError extends Error {
  code?: string
  status: number
  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function goFetch<T = unknown>(
  path: string,
  options: GoFetchOptions = {}
): Promise<T> {
  const { token, body, raw, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${GO_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } }).error
    throw new GoAPIError(
      err?.message || `Go backend error: ${res.status}`,
      res.status,
      err?.code
    )
  }

  if (raw) return data as T

  return ((data as { data?: unknown }).data ?? data) as T
}

async function getAuthToken(): Promise<string | undefined> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export async function goApi<T = unknown>(
  path: string,
  options: GoFetchOptions = {}
): Promise<T> {
  const token = await getAuthToken()
  return goFetch<T>(path, { ...options, token })
}

export async function goGet<T = unknown>(path: string): Promise<T> {
  return goApi<T>(path)
}

export async function goPost<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return goApi<T>(path, { method: 'POST', body })
}

export async function goPut<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return goApi<T>(path, { method: 'PUT', body })
}

export async function goPatch<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return goApi<T>(path, { method: 'PATCH', body })
}

export async function goDelete<T = unknown>(path: string): Promise<T> {
  return goApi<T>(path, { method: 'DELETE' })
}

export type GoModule =
  | 'exchange'
  | 'webhooks'
  | 'propiedades'
  | 'reservas'
  | 'pagos'
  | 'reviews'
  | 'verificacion'
  | 'admin'
  | 'auth'
  | 'chat'
  | 'ofertas'
  | 'wallet'
  | 'tienda'

export function useGoBackend(module: GoModule): boolean {
  const flags: Record<GoModule, boolean> = {
    exchange: process.env.GO_BACKEND_EXCHANGE === 'true',
    webhooks: process.env.GO_BACKEND_WEBHOOKS === 'true',
    propiedades: process.env.GO_BACKEND_PROPIEDADES === 'true',
    reservas: process.env.GO_BACKEND_RESERVAS === 'true',
    pagos: process.env.GO_BACKEND_PAGOS === 'true',
    reviews: process.env.GO_BACKEND_REVIEWS === 'true',
    verificacion: process.env.GO_BACKEND_VERIFICACION === 'true',
    admin: process.env.GO_BACKEND_ADMIN === 'true',
    auth: process.env.GO_BACKEND_AUTH === 'true',
    chat: process.env.GO_BACKEND_CHAT === 'true',
    ofertas: process.env.GO_BACKEND_OFERTAS === 'true',
    wallet: process.env.GO_BACKEND_WALLET === 'true',
    tienda: process.env.GO_BACKEND_TIENDA === 'true',
  }
  return flags[module] ?? false
}

export { GoAPIError, goFetch, getAuthToken }
