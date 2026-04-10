import { describe, it, expect } from 'vitest'

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

describe('sanitizeRedirectPath', () => {
  it('allows valid internal paths', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/admin/reservas')).toBe('/admin/reservas')
    expect(sanitizeRedirectPath('/propiedades/123')).toBe('/propiedades/123')
  })

  it('blocks open redirect via @ subdomain', () => {
    expect(sanitizeRedirectPath('/@evil.com')).toBe('/@evil.com')
    expect(sanitizeRedirectPath('//evil.com@attacker.com')).toBe('/dashboard')
  })

  it('blocks open redirect via // protocol', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('///evil.com')).toBe('/dashboard')
  })

  it('blocks paths without leading slash', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('evil.com')).toBe('/dashboard')
  })

  it('blocks paths with newline injection', () => {
    expect(sanitizeRedirectPath('/dashboard\n@evil.com')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/dashboard\r@evil.com')).toBe('/dashboard')
  })

  it('allows paths with query params', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=reservas')).toBe('/dashboard?tab=reservas')
  })

  it('defaults to /dashboard for empty or invalid input', () => {
    expect(sanitizeRedirectPath('')).toBe('/dashboard')
  })
})
