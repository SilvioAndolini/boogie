import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calcularPrecioReserva, calcularReembolsoCompleto } from '@/lib/reservas/calculos'

describe('calcularPrecioReserva', () => {
  it('calcula correctamente para 1 noche', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-02')
    const resultado = calcularPrecioReserva(100, entrada, salida)

    expect(resultado.noches).toBe(1)
    expect(resultado.precioPorNoche).toBe(100)
    expect(resultado.subtotal).toBe(100)
    expect(resultado.comisionHuesped).toBe(6)
    expect(resultado.comisionAnfitrion).toBe(3)
    expect(resultado.total).toBe(106)
  })

  it('calcula correctamente para 5 noches', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-06')
    const resultado = calcularPrecioReserva(50, entrada, salida)

    expect(resultado.noches).toBe(5)
    expect(resultado.subtotal).toBe(250)
    expect(resultado.comisionHuesped).toBe(15)
    expect(resultado.comisionAnfitrion).toBe(7.5)
    expect(resultado.total).toBe(265)
  })

  it('calcula correctamente para 30 noches', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-31')
    const resultado = calcularPrecioReserva(200, entrada, salida)

    expect(resultado.noches).toBe(30)
    expect(resultado.subtotal).toBe(6000)
    expect(resultado.comisionHuesped).toBe(360)
    expect(resultado.comisionAnfitrion).toBe(180)
    expect(resultado.total).toBe(6360)
  })

  it('respeta la moneda especificada', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-02')
    const resultado = calcularPrecioReserva(100, entrada, salida, 'VES')
    expect(resultado.moneda).toBe('VES')
  })

  it('por defecto usa USD', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-02')
    const resultado = calcularPrecioReserva(100, entrada, salida)
    expect(resultado.moneda).toBe('USD')
  })

  it('total = subtotal + comisionHuesped', () => {
    const entrada = new Date('2025-06-01')
    const salida = new Date('2025-06-04')
    const resultado = calcularPrecioReserva(75.5, entrada, salida)

    expect(resultado.total).toBe(resultado.subtotal + resultado.comisionHuesped)
  })

  it('comisionHuesped = 6% del subtotal', () => {
    const entrada = new Date('2025-01-10')
    const salida = new Date('2025-01-12')
    const resultado = calcularPrecioReserva(100, entrada, salida)
    expect(resultado.comisionHuesped).toBeCloseTo(resultado.subtotal * 0.06, 2)
  })

  it('comisionAnfitrion = 3% del subtotal', () => {
    const entrada = new Date('2025-01-10')
    const salida = new Date('2025-01-12')
    const resultado = calcularPrecioReserva(100, entrada, salida)
    expect(resultado.comisionAnfitrion).toBeCloseTo(resultado.subtotal * 0.03, 2)
  })

  it('maneja precios decimales correctamente', () => {
    const entrada = new Date('2025-01-01')
    const salida = new Date('2025-01-03')
    const resultado = calcularPrecioReserva(33.33, entrada, salida)

    expect(resultado.noches).toBe(2)
    expect(resultado.subtotal).toBe(66.66)
  })
})

describe('calcularReembolsoCompleto', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-06-01T12:00:00'))
  })

  describe('politica FLEXIBLE', () => {
    it('reembolso completo si faltan mas de 24 horas', () => {
      const entrada = new Date('2025-06-03')
      const resultado = calcularReembolsoCompleto(100, 6, 'FLEXIBLE', entrada)

      expect(resultado.porcentajeReembolso).toBe(100)
      expect(resultado.montoReembolsable).toBe(94)
      expect(resultado.montoNoReembolsable).toBe(6)
      expect(resultado.mensaje).toContain('Reembolso completo')
    })

    it('sin reembolso si es el mismo dia del check-in', () => {
      const entrada = new Date('2025-06-01')
      const resultado = calcularReembolsoCompleto(100, 6, 'FLEXIBLE', entrada)

      expect(resultado.porcentajeReembolso).toBe(0)
      expect(resultado.montoReembolsable).toBe(0)
    })
  })

  describe('politica MODERADA', () => {
    it('reembolso completo si faltan 5+ dias', () => {
      const entrada = new Date('2025-06-07')
      const resultado = calcularReembolsoCompleto(200, 12, 'MODERADA', entrada)

      expect(resultado.porcentajeReembolso).toBe(100)
      expect(resultado.montoReembolsable).toBe(188)
    })

    it('reembolso del 50% si faltan entre 1 y 4 dias', () => {
      const entrada = new Date('2025-06-04')
      const resultado = calcularReembolsoCompleto(200, 12, 'MODERADA', entrada)

      expect(resultado.porcentajeReembolso).toBe(50)
      expect(resultado.montoReembolsable).toBe(88)
      expect(resultado.mensaje).toContain('50%')
    })

    it('sin reembolso si es el mismo dia del check-in', () => {
      const entrada = new Date('2025-06-01')
      const resultado = calcularReembolsoCompleto(200, 12, 'MODERADA', entrada)

      expect(resultado.porcentajeReembolso).toBe(0)
      expect(resultado.montoReembolsable).toBe(0)
    })
  })

  describe('politica ESTRICTA', () => {
    it('reembolso completo si faltan 14+ dias', () => {
      const entrada = new Date('2025-06-16')
      const resultado = calcularReembolsoCompleto(300, 18, 'ESTRICTA', entrada)

      expect(resultado.porcentajeReembolso).toBe(100)
      expect(resultado.montoReembolsable).toBe(282)
    })

    it('reembolso del 50% si faltan entre 7 y 13 dias', () => {
      const entrada = new Date('2025-06-09')
      const resultado = calcularReembolsoCompleto(300, 18, 'ESTRICTA', entrada)

      expect(resultado.porcentajeReembolso).toBe(50)
      expect(resultado.montoReembolsable).toBe(132)
    })

    it('sin reembolso si faltan menos de 7 dias', () => {
      const entrada = new Date('2025-06-05')
      const resultado = calcularReembolsoCompleto(300, 18, 'ESTRICTA', entrada)

      expect(resultado.porcentajeReembolso).toBe(0)
      expect(resultado.montoReembolsable).toBe(0)
    })
  })

  it('monto reembolsable nunca es negativo', () => {
    const entrada = new Date('2025-06-02')
    const resultado = calcularReembolsoCompleto(10, 20, 'MODERADA', entrada)
    expect(resultado.montoReembolsable).toBeGreaterThanOrEqual(0)
  })

  it('montoReembolsable + montoNoReembolsable = totalReserva', () => {
    const entrada = new Date('2025-06-07')
    const resultado = calcularReembolsoCompleto(200, 12, 'MODERADA', entrada)
    expect(resultado.montoReembolsable + resultado.montoNoReembolsable).toBeCloseTo(200, 2)
  })

  it('incluye diasAntesCheckIn en el resultado', () => {
    const entrada = new Date('2025-06-05')
    const resultado = calcularReembolsoCompleto(100, 6, 'FLEXIBLE', entrada)
    expect(resultado.diasAntesCheckIn).toBeGreaterThan(0)
  })
})
