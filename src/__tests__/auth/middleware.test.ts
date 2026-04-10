import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
  headers: vi.fn(() => Promise.resolve({
    get: vi.fn(),
  })),
}))

import { createServerClient } from '@supabase/ssr'

describe('middleware - esRutaPublica logic', () => {
  const RUTAS_PUBLICAS = ['/', '/propiedades', '/zonas', '/como-funciona', '/login', '/registro', '/recuperar-contrasena', '/admin-login', '/guia-anfitrion']

  function esRutaPublica(pathname: string): boolean {
    if (pathname.startsWith('/auth/')) return true
    if (pathname === '/completar-perfil') return true
    return RUTAS_PUBLICAS.some(ruta => {
      if (ruta === pathname) return true
      if (ruta === '/propiedades' && pathname.startsWith('/propiedades')) return true
      if (ruta === '/zonas' && pathname.startsWith('/zonas')) return true
      return false
    })
  }

  it('/ es publica', () => {
    expect(esRutaPublica('/')).toBe(true)
  })

  it('/propiedades es publica', () => {
    expect(esRutaPublica('/propiedades')).toBe(true)
  })

  it('/propiedades/uuid es publica', () => {
    expect(esRutaPublica('/propiedades/38d7a514-7416-4fb3-83e9')).toBe(true)
  })

  it('/login es publica', () => {
    expect(esRutaPublica('/login')).toBe(true)
  })

  it('/registro es publica', () => {
    expect(esRutaPublica('/registro')).toBe(true)
  })

  it('/admin-login es publica', () => {
    expect(esRutaPublica('/admin-login')).toBe(true)
  })

  it('/guia-anfitrion es publica', () => {
    expect(esRutaPublica('/guia-anfitrion')).toBe(true)
  })

  it('/zonas es publica', () => {
    expect(esRutaPublica('/zonas')).toBe(true)
  })

  it('/zonas/caracas es publica', () => {
    expect(esRutaPublica('/zonas/caracas')).toBe(true)
  })

  it('/auth/callback es publica', () => {
    expect(esRutaPublica('/auth/callback')).toBe(true)
  })

  it('/completar-perfil es publica', () => {
    expect(esRutaPublica('/completar-perfil')).toBe(true)
  })

  it('/dashboard NO es publica', () => {
    expect(esRutaPublica('/dashboard')).toBe(false)
  })

  it('/dashboard/mis-propiedades NO es publica', () => {
    expect(esRutaPublica('/dashboard/mis-propiedades')).toBe(false)
  })

  it('/admin NO es publica', () => {
    expect(esRutaPublica('/admin')).toBe(false)
  })

  it('/admin/usuarios NO es publica', () => {
    expect(esRutaPublica('/admin/usuarios')).toBe(false)
  })

  it('/como-funciona es publica', () => {
    expect(esRutaPublica('/como-funciona')).toBe(true)
  })

  it('/recuperar-contrasena es publica', () => {
    expect(esRutaPublica('/recuperar-contrasena')).toBe(true)
  })
})

describe('middleware - sanitizeRedirectPath', () => {
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

  it('permite paths internos validos', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/admin/reservas')).toBe('/admin/reservas')
  })

  it('bloquea open redirect con //', () => {
    expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
  })

  it('bloquea URLs absolutas', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
  })

  it('bloquea newline injection', () => {
    expect(sanitizeRedirectPath('/dashboard\n@evil')).toBe('/dashboard')
  })

  it('permite query params', () => {
    expect(sanitizeRedirectPath('/dashboard?tab=reservas')).toBe('/dashboard?tab=reservas')
  })
})
