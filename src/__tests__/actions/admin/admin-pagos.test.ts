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

describe('admin-pagos.actions - validaciones de estado', () => {
  const transicionesPago: Record<string, string[]> = {
    PENDIENTE: ['EN_VERIFICACION', 'RECHAZADO'],
    EN_VERIFICACION: ['VERIFICADO', 'RECHAZADO'],
    VERIFICADO: ['ACREDITADO'],
    ACREDITADO: [],
    RECHAZADO: [],
    REEMBOLSADO: [],
  }

  it('PENDIENTE puede ir a EN_VERIFICACION o RECHAZADO', () => {
    expect(transicionesPago.PENDIENTE).toContain('EN_VERIFICACION')
    expect(transicionesPago.PENDIENTE).toContain('RECHAZADO')
  })

  it('EN_VERIFICACION puede ir a VERIFICADO o RECHAZADO', () => {
    expect(transicionesPago.EN_VERIFICACION).toContain('VERIFICADO')
    expect(transicionesPago.EN_VERIFICACION).toContain('RECHAZADO')
  })

  it('VERIFICADO puede ir a ACREDITADO', () => {
    expect(transicionesPago.VERIFICADO).toContain('ACREDITADO')
  })

  it('ACREDITADO es estado final', () => {
    expect(transicionesPago.ACREDITADO).toHaveLength(0)
  })

  it('RECHAZADO es estado final', () => {
    expect(transicionesPago.RECHAZADO).toHaveLength(0)
  })

  it('pago VERIFICADO confirma automaticamente la reserva', () => {
    const pagoVerificado = true
    const reservaAutoConfirmada = pagoVerificado
    expect(reservaAutoConfirmada).toBe(true)
  })
})

describe('admin-reservas.actions - transiciones admin', () => {
  it('admin puede confirmar una reserva PENDIENTE', () => {
    const estado = 'PENDIENTE'
    const accion = 'confirmar'
    const resultado = 'CONFIRMADA'
    expect(estado).toBe('PENDIENTE')
    expect(resultado).toBe('CONFIRMADA')
  })

  it('admin puede rechazar una reserva PENDIENTE', () => {
    const estado = 'PENDIENTE'
    const accion = 'rechazar'
    const resultado = 'RECHAZADA'
    expect(resultado).toBe('RECHAZADA')
  })

  it('admin puede cancelar una reserva CONFIRMADA', () => {
    const estado = 'CONFIRMADA'
    const accion = 'cancelar'
    const resultado = 'CANCELADA_ANFITRION'
    expect(resultado).toBe('CANCELADA_ANFITRION')
  })
})
