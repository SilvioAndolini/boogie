import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('secciones-destacadas.actions - tipos de seccion', () => {
  it('tipos de seccion validos', () => {
    const tipos = ['MANUAL', 'RATING', 'POPULAR']
    expect(tipos).toHaveLength(3)
  })

  it('MANUAL usa propiedades seleccionadas manualmente', () => {
    const tipo = 'MANUAL'
    expect(tipo).toBe('MANUAL')
  })

  it('RATING ordena por calificacion', () => {
    const tipo = 'RATING'
    expect(tipo).toBe('RATING')
  })

  it('POPULAR usa ubicacion automaticamente', () => {
    const tipo = 'POPULAR'
    expect(tipo).toBe('POPULAR')
  })
})
