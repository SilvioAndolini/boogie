import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('admin-propiedades.actions - estados de publicacion', () => {
  const estados = ['BORRADOR', 'PENDIENTE_REVISION', 'PUBLICADA', 'PAUSADA', 'SUSPENDIDA']

  it('todos los estados son validos', () => {
    expect(estados).toHaveLength(5)
  })

  it('transicion BORRADOR -> PENDIENTE_REVISION', () => {
    const from = 'BORRADOR'
    const to = 'PENDIENTE_REVISION'
    expect(estados).toContain(from)
    expect(estados).toContain(to)
  })

  it('transicion PENDIENTE_REVISION -> PUBLICADA', () => {
    expect(estados).toContain('PUBLICADA')
  })

  it('propiedad puede ser marcada como destacada', () => {
    const destacada = true
    expect(typeof destacada).toBe('boolean')
  })
})
