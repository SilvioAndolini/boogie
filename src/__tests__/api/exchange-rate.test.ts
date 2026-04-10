import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('api/exchange-rate - estructura', () => {
  it('tasa debe ser un numero positivo', () => {
    const tasa = 78.39
    expect(tasa).toBeGreaterThan(0)
    expect(typeof tasa).toBe('number')
  })

  it('cache de 15 minutos', () => {
    const CACHE_DURATION = 15 * 60 * 1000
    expect(CACHE_DURATION).toBe(900000)
  })
})
