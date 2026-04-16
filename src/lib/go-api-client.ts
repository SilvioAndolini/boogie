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

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string>),
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${GO_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
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

export { GoAPIError, goFetch, getAuthToken }
