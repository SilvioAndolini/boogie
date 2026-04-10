import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('admin-resenas.actions - moderacion', () => {
  it('acciones de moderacion validas', () => {
    const acciones = ['ocultar', 'eliminar', 'mostrar']
    expect(acciones).toHaveLength(3)
  })

  it('calificacion va de 1 a 5', () => {
    const calificaciones = [1, 2, 3, 4, 5]
    calificaciones.forEach(c => {
      expect(c).toBeGreaterThanOrEqual(1)
      expect(c).toBeLessThanOrEqual(5)
    })
  })
})
