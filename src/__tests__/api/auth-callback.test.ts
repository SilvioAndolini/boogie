import { describe, it, expect, vi } from 'vitest'

describe('api/auth/callback - sanitizacion de redirect', () => {
  function sanitizeRedirectPath(path: string): string {
    if (!path.startsWith('/')) return '/dashboard'
    if (path.startsWith('//')) return '/dashboard'
    if (path.includes('\n') || path.includes('\r')) return '/dashboard'
    try {
      const testUrl = new URL(path, 'https://localhost')
      if (testUrl.origin !== 'https://localhost') return '/dashboard'
    } catch {
      return '/dashboard'
    }
    return path
  }

  it('sanitiza paths internos validos', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/propiedades')).toBe('/propiedades')
  })

  it('bloquea open redirects', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
  })

  it('permite paths con query params', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=reservas')).toBe('/dashboard?tab=reservas')
  })
})
