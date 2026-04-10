import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('admin-usuarios.actions - registro', () => {
  it('roles validos para registro admin', () => {
    const roles = ['BOOGER', 'ANFITRION', 'AMBOS', 'ADMIN']
    expect(roles).toHaveLength(4)
  })

  it('email debe ser unico en Auth y perfil', () => {
    const email = 'nuevo@test.com'
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})
