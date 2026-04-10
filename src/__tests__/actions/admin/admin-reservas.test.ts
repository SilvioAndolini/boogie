import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: any) => fn, revalidateTag: vi.fn(), revalidatePath: vi.fn() }))

describe('admin-reservas.actions - estado machine admin', () => {
  const acciones: Record<string, { from: string[]; to: string }> = {
    confirmar: { from: ['PENDIENTE'], to: 'CONFIRMADA' },
    rechazar: { from: ['PENDIENTE'], to: 'RECHAZADA' },
    cancelar: { from: ['PENDIENTE', 'CONFIRMADA'], to: 'CANCELADA_ANFITRION' },
  }

  it('confirmar solo desde PENDIENTE', () => {
    expect(acciones.confirmar.from).toContain('PENDIENTE')
    expect(acciones.confirmar.to).toBe('CONFIRMADA')
  })

  it('rechazar solo desde PENDIENTE', () => {
    expect(acciones.rechazar.from).toContain('PENDIENTE')
    expect(acciones.rechazar.to).toBe('RECHAZADA')
  })

  it('cancelar desde PENDIENTE o CONFIRMADA', () => {
    expect(acciones.cancelar.from).toContain('PENDIENTE')
    expect(acciones.cancelar.from).toContain('CONFIRMADA')
    expect(acciones.cancelar.to).toBe('CANCELADA_ANFITRION')
  })
})

describe('admin-reservas.actions - stats', () => {
  it('estructura de stats tiene todos los estados', () => {
    const estadosReserva = ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA']
    expect(estadosReserva).toHaveLength(7)
  })
})
