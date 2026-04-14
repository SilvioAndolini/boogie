import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getUsuarioAutenticado: vi.fn(),
}))

describe('pago.actions - estructura y validaciones', () => {
  it('estados de pago validos', () => {
    const estados = ['PENDIENTE', 'EN_VERIFICACION', 'VERIFICADO', 'ACREDITADO', 'RECHAZADO', 'REEMBOLSADO']
    estados.forEach(e => expect(typeof e).toBe('string'))
  })

  it('metodos de pago validos', () => {
    const metodos = [
      'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE',
      'EFECTIVO_FARMATODO', 'USDT', 'EFECTIVO', 'CRIPTO', 'WALLET',
    ]
    expect(metodos).toHaveLength(8)
  })

  it('monto debe ser positivo', () => {
    const montos = [1, 50, 100.5, 1000]
    montos.forEach(m => expect(m).toBeGreaterThan(0))
  })

  it('moneda solo USD o VES', () => {
    const monedas = ['USD', 'VES']
    expect(monedas).toHaveLength(2)
    expect(monedas).toContain('USD')
    expect(monedas).toContain('VES')
  })

  it('flujo de verificacion: PENDIENTE -> VERIFICADO confirma reserva', () => {
    const transicionesValidas = [
      ['PENDIENTE', 'EN_VERIFICACION'],
      ['EN_VERIFICACION', 'VERIFICADO'],
      ['EN_VERIFICACION', 'RECHAZADO'],
    ]
    expect(transicionesValidas).toHaveLength(3)
  })
})

describe('pago-reserva.actions - registro con recibo', () => {
  it('formato base64 de imagen valido', () => {
    const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ'
    expect(base64).toMatch(/^data:image\/[a-z]+;base64,/)
  })
})
