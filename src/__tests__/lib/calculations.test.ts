import { describe, it, expect } from 'vitest'
import { calcularPrecioReserva, calcularReembolso } from '@/lib/calculations'

describe('calcularPrecioReserva (legacy)', () => {
  it('calcula correctamente para 3 noches', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-04')
    const resultado = calcularPrecioReserva(100, entrada, salida)

    expect(resultado.noches).toBe(3)
    expect(resultado.subtotal).toBe(300)
    expect(resultado.comisionHuesped).toBe(18)
    expect(resultado.comisionAnfitrion).toBe(9)
    expect(resultado.total).toBe(318)
  })

  it('calcula correctamente para 1 noche', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-02')
    const resultado = calcularPrecioReserva(50, entrada, salida)

    expect(resultado.noches).toBe(1)
    expect(resultado.subtotal).toBe(50)
    expect(resultado.total).toBe(53)
  })
})

describe('calcularReembolso (legacy)', () => {
  it('FLEXIBLE: 100% si faltan mas de 24 horas', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 5)
    const resultado = calcularReembolso(100, futuro, 'FLEXIBLE')
    expect(resultado.porcentaje).toBe(100)
    expect(resultado.reembolso).toBe(100)
  })

  it('FLEXIBLE: 0% si faltan menos de 24 horas', () => {
    const pasado = new Date()
    pasado.setDate(pasado.getDate() - 1)
    const resultado = calcularReembolso(100, pasado, 'FLEXIBLE')
    expect(resultado.porcentaje).toBe(0)
    expect(resultado.reembolso).toBe(0)
  })

  it('MODERADA: 100% si faltan 5+ dias', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 7)
    const resultado = calcularReembolso(200, futuro, 'MODERADA')
    expect(resultado.porcentaje).toBe(100)
  })

  it('MODERADA: 50% si faltan 1-4 dias', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 3)
    const resultado = calcularReembolso(200, futuro, 'MODERADA')
    expect(resultado.porcentaje).toBe(50)
    expect(resultado.reembolso).toBe(100)
  })

  it('ESTRICTA: 100% si faltan 14+ dias', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 20)
    const resultado = calcularReembolso(300, futuro, 'ESTRICTA')
    expect(resultado.porcentaje).toBe(100)
  })

  it('ESTRICTA: 50% si faltan 7-13 dias', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 10)
    const resultado = calcularReembolso(300, futuro, 'ESTRICTA')
    expect(resultado.porcentaje).toBe(50)
  })

  it('ESTRICTA: 0% si faltan menos de 7 dias', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 3)
    const resultado = calcularReembolso(300, futuro, 'ESTRICTA')
    expect(resultado.porcentaje).toBe(0)
  })
})
