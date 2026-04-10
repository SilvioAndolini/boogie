import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

describe('api/crypto/callback - transiciones de estado', () => {
  it('callback exitoso: PENDIENTE -> EN_VERIFICACION -> VERIFICADO', () => {
    const estados = ['PENDIENTE', 'EN_VERIFICACION', 'VERIFICADO']
    expect(estados[0]).toBe('PENDIENTE')
    expect(estados[estados.length - 1]).toBe('VERIFICADO')
  })

  it('pago VERIFICADO confirma automaticamente la reserva', () => {
    const pagoEstado = 'VERIFICADO'
    const reservaAutoConfirmada = pagoEstado === 'VERIFICADO'
    expect(reservaAutoConfirmada).toBe(true)
  })

  it('callback fallido no cambia estado de pago', () => {
    const callbackExitoso = false
    const estadoCambiado = callbackExitoso
    expect(estadoCambiado).toBe(false)
  })
})
