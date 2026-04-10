import { describe, it, expect, vi } from 'vitest'

const chain = {
  eq: vi.fn(() => chain),
  neq: vi.fn(() => chain),
  in: vi.fn(() => chain),
  lt: vi.fn(() => chain),
  gt: vi.fn(() => chain),
  gte: vi.fn(() => chain),
  lte: vi.fn(() => chain),
  limit: vi.fn(() => chain),
  order: vi.fn(() => chain),
  range: vi.fn(() => chain),
  single: vi.fn(() => chain),
  maybeSingle: vi.fn(() => chain),
  select: vi.fn(() => chain),
  insert: vi.fn(() => chain),
  update: vi.fn(() => chain),
  delete: vi.fn(() => chain),
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => chain),
  })),
}))

import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'

describe('verificarDisponibilidad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chain.limit.mockResolvedValue({ data: [], error: null })
  })

  it('retorna disponible true cuando no hay conflictos', async () => {
    const resultado = await verificarDisponibilidad(
      'prop-1',
      new Date('2025-01-01'),
      new Date('2025-01-05')
    )
    expect(resultado.disponible).toBe(true)
  })

  it('retorna estructura valida', async () => {
    const resultado = await verificarDisponibilidad(
      'uuid-propiedad-123',
      new Date('2025-06-01'),
      new Date('2025-06-05')
    )
    expect(resultado).toHaveProperty('disponible')
    expect(typeof resultado.disponible).toBe('boolean')
  })
})
