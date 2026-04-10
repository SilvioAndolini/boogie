import { describe, it, expect, vi } from 'vitest'

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
  revalidateTag: vi.fn(),
}))

import { CACHE_TAGS, CACHE_TIMES, createCacheKey } from '@/lib/cache'

describe('CACHE_TAGS', () => {
  it('tiene tags para entidades principales', () => {
    expect(CACHE_TAGS).toHaveProperty('PROPIEDADES')
    expect(CACHE_TAGS).toHaveProperty('ZONAS')
    expect(CACHE_TAGS).toHaveProperty('UBICACIONES')
    expect(CACHE_TAGS).toHaveProperty('COTIZACION')
  })

  it('PROPIEDAD es una funcion que genera tag por id', () => {
    expect(CACHE_TAGS.PROPIEDAD('123')).toBe('propiedad-123')
  })

  it('ZONA es una funcion que genera tag por slug', () => {
    expect(CACHE_TAGS.ZONA('caracas')).toBe('zona-caracas')
  })
})

describe('CACHE_TIMES', () => {
  it('tiene tiempos de cache definidos', () => {
    expect(CACHE_TIMES.PROPIEDADES_LIST).toBeDefined()
    expect(CACHE_TIMES.PROPIEDAD_DETALLE).toBeDefined()
    expect(CACHE_TIMES.ZONAS).toBeDefined()
    expect(CACHE_TIMES.UBICACIONES).toBeDefined()
    expect(CACHE_TIMES.COTIZACION).toBeDefined()
  })

  it('tiempos son positivos', () => {
    expect(CACHE_TIMES.PROPIEDADES_LIST).toBeGreaterThan(0)
    expect(CACHE_TIMES.PROPIEDAD_DETALLE).toBeGreaterThan(0)
  })
})

describe('createCacheKey', () => {
  it('retorna solo el prefijo sin params', () => {
    expect(createCacheKey('propiedades')).toBe('propiedades')
  })

  it('incluye params ordenados', () => {
    const key = createCacheKey('propiedades', { ciudad: 'Caracas', ordenar: 'precio' })
    expect(key).toContain('ciudad=')
    expect(key).toContain('ordenar=')
  })

  it('filtra params undefined/null/vacios', () => {
    const key = createCacheKey('test', { a: 'valor', b: undefined, c: null, d: '' })
    expect(key).toContain('a=')
    expect(key).not.toContain('b=')
    expect(key).not.toContain('c=')
    expect(key).not.toContain('d=')
  })

  it('ordena params alfabeticamente', () => {
    const key = createCacheKey('test', { z: '1', a: '2' })
    expect(key.indexOf('a=')).toBeLessThan(key.indexOf('z='))
  })
})
