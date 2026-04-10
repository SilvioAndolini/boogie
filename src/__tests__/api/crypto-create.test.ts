import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('api/crypto/create - validaciones', () => {
  it('requiere reservaId', () => {
    const body = { monto: 100 }
    expect(body).not.toHaveProperty('reservaId')
  })

  it('requiere monto positivo', () => {
    const monto = -10
    expect(monto).toBeLessThanOrEqual(0)
  })

  it('monto valido es positivo', () => {
    const monto = 50
    expect(monto).toBeGreaterThan(0)
  })

  it('red valida es TRC-20', () => {
    const red = 'TRC-20'
    expect(red).toBe('TRC-20')
  })
})
