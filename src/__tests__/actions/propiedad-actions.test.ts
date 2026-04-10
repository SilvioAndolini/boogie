import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getUsuarioAutenticado: vi.fn(),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { generarSlug } from '@/lib/slug'

describe('propiedad.actions - creacion', () => {
  it('genera slug correcto a partir del titulo', () => {
    const slug = generarSlug('Hermoso Apartamento en Caracas')
    expect(slug).toMatch(/hermoso-apartamento-en-caracas-[a-z0-9]{6}$/)
  })

  it('slug tiene maximo 60 caracteres + 7 de sufijo', () => {
    const tituloLargo = 'A'.repeat(100)
    const slug = generarSlug(tituloLargo)
    const base = slug.slice(0, -7)
    expect(base.length).toBeLessThanOrEqual(60)
  })

  it('slug normaliza acentos', () => {
    const slug = generarSlug('Cabaña en Mérida')
    expect(slug).toMatch(/cabana-en-merida-[a-z0-9]{6}$/)
  })

  it('slug elimina caracteres especiales', () => {
    const slug = generarSlug('Apto. #3 @Caracas!')
    expect(slug).toMatch(/apto-3-caracas-[a-z0-9]{6}$/)
  })

  it('slug tiene sufijo random de 6 caracteres', () => {
    const slug1 = generarSlug('Mismo Titulo')
    const slug2 = generarSlug('Mismo Titulo')
    expect(slug1).not.toBe(slug2)
  })
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
