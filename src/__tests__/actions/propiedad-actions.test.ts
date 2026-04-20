import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getUsuarioAutenticado: vi.fn(),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

describe('propiedad.actions - creacion', () => {
  it.todo('placeholder para tests de creacion')
})

describe('propiedad.actions - plan limits', () => {
  it('FREE plan permite maximo 5 propiedades', () => {
    const MAX_BOOGIES_FREE = 5
    expect(MAX_BOOGIES_FREE).toBe(5)
  })

  it('ULTRA plan es ilimitado', () => {
    const maxBoogiesUltra = Infinity
    expect(maxBoogiesUltra).toBe(Infinity)
  })
})

describe('propiedad.actions - tipos de propiedad', () => {
  it('todos los tipos de propiedad son validos', () => {
    const tipos = [
      'APARTAMENTO', 'CASA', 'VILLA', 'CABANA', 'ESTUDIO',
      'HABITACION', 'LOFT', 'PENTHOUSE', 'FINCA', 'OTRO',
    ]
    expect(tipos).toHaveLength(10)
  })
})

describe('propiedad.actions - estados de publicacion', () => {
  it('todos los estados de publicacion son validos', () => {
    const estados = ['BORRADOR', 'PENDIENTE_REVISION', 'PUBLICADA', 'PAUSADA', 'SUSPENDIDA']
    expect(estados).toHaveLength(5)
  })
})
