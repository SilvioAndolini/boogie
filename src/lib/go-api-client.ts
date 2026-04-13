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

const GO_FLAGS: Record<GoModule, boolean> = {
  exchange: process.env.GO_BACKEND_EXCHANGE === 'true',
  webhooks: process.env.GO_BACKEND_WEBHOOKS === 'true',
  propiedades: process.env.GO_BACKEND_PROPIEDADES === 'true',
  reservas: process.env.GO_BACKEND_RESERVAS === 'true',
  pagos: process.env.GO_BACKEND_PAGOS === 'true',
  reviews: process.env.GO_BACKEND_REVIEWS === 'true',
  verificacion: process.env.GO_BACKEND_VERIFICACION === 'true',
  admin: process.env.GO_BACKEND_ADMIN === 'true',
  auth: process.env.GO_BACKEND_AUTH === 'true',
}

export function useGoBackend(module: GoModule): boolean {
  return GO_FLAGS[module] ?? false
}

const GO_BASE_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080/api/v1'

interface GoFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  token?: string
}

export async function goFetch<T = unknown>(
  path: string,
  options: GoFetchOptions = {}
): Promise<T> {
  const { token, body, ...rest } = options

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
    const error = (data as { error?: { code?: string; message?: string } }).error
    throw new Error(error?.message || `Go backend error: ${res.status}`)
  }

  return (data as { data: T }).data ?? (data as T)
}

export async function goFetchWithAuth<T = unknown>(
  path: string,
  options: GoFetchOptions = {}
): Promise<T> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return goFetch<T>(path, {
    ...options,
    token: session?.access_token,
  })
}
