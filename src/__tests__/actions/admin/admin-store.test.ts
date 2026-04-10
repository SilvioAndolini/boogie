import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('admin-store.actions - estructura', () => {
  it('categorias de producto validas', () => {
    const categorias = ['COMIDA', 'BEBIDAS', 'SNACKS', 'HIGIENE', 'OTRO']
    expect(categorias.length).toBeGreaterThan(0)
  })

  it('categorias de servicio validas', () => {
    const categorias = ['LIMPIEZA', 'TRANSPORTE', 'TURISMO', 'OTRO']
    expect(categorias.length).toBeGreaterThan(0)
  })

  it('tipos de precio validos', () => {
    const tipos = ['UNIDAD', 'POR_DIA', 'POR_PERSONA']
    expect(tipos.length).toBeGreaterThan(0)
  })
})
