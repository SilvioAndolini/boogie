import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({
    get: vi.fn(() => null),
  })),
}))

import { getUsuarioAutenticado } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

describe('getUsuarioAutenticado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna user cuando esta autenticado', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' }
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
    } as any)

    const user = await getUsuarioAutenticado()
    expect(user).toEqual(mockUser)
  })

  it('retorna null cuando no esta autenticado', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)

    const user = await getUsuarioAutenticado()
    expect(user).toBeNull()
  })
})
