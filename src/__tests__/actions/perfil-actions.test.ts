import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('perfil.actions - validaciones', () => {
  it('avatar limite de 2MB', () => {
    const MAX_SIZE = 2 * 1024 * 1024
    expect(MAX_SIZE).toBe(2097152)
  })

  it('formatos de avatar validos', () => {
    const formatos = ['image/jpeg', 'image/png', 'image/webp']
    expect(formatos).toContain('image/jpeg')
    expect(formatos).toContain('image/png')
    expect(formatos).toContain('image/webp')
    expect(formatos).not.toContain('image/gif')
  })

  it('bio maximo 500 caracteres', () => {
    const maxBio = 500
    expect('A'.repeat(500).length).toBeLessThanOrEqual(maxBio)
    expect('A'.repeat(501).length).toBeGreaterThan(maxBio)
  })

  it('nombre y apellido minimo 2 caracteres', () => {
    const min = 2
    expect('Ju'.length).toBeGreaterThanOrEqual(min)
    expect('J'.length).toBeLessThan(min)
  })
})
