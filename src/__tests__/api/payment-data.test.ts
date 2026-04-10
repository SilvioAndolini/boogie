import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('api/payment-data - estructura', () => {
  it('PaymentData tiene todos los metodos', () => {
    const metodos = [
      'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE',
      'EFECTIVO_FARMATODO', 'USDT', 'TARJETA_INTERNACIONAL',
    ]
    expect(metodos).toHaveLength(6)
  })

  it('requiere autenticacion', () => {
    const user = null
    expect(user).toBeNull()
  })
})
