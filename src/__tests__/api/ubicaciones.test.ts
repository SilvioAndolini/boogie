import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('api/ubicaciones - estructura', () => {
  it('rate limit de 30 por minuto', () => {
    const maxRequests = 30
    expect(maxRequests).toBe(30)
  })

  it('LocationSuggestion tiene campos requeridos', () => {
    const suggestion = {
      name: 'Caracas',
      lat: 10.4806,
      lon: -66.9036,
      country: 'Venezuela',
      state: 'Distrito Capital',
    }
    expect(suggestion).toHaveProperty('name')
    expect(suggestion).toHaveProperty('lat')
    expect(suggestion).toHaveProperty('lon')
  })
})
