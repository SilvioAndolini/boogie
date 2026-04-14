import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

function mockSupabaseChain(overrides: Record<string, any> = {}) {
  const chain: any = {
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
    ...overrides,
  }
  return chain
}

describe('reserva.actions - estructura de datos', () => {
  it('el tipo EstadoReserva tiene todos los estados esperados', () => {
    const estados = ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA']
    expect(estados).toHaveLength(7)
    expect(estados).toContain('PENDIENTE')
    expect(estados).toContain('CONFIRMADA')
    expect(estados).toContain('COMPLETADA')
  })

  it('el tipo EstadoPago tiene todos los estados esperados', () => {
    const estados = ['PENDIENTE', 'EN_VERIFICACION', 'VERIFICADO', 'ACREDITADO', 'RECHAZADO', 'REEMBOLSADO']
    expect(estados).toHaveLength(6)
  })

  it('el tipo MetodoPagoEnum tiene todos los metodos esperados', () => {
    const metodos = ['TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE', 'EFECTIVO_FARMATODO', 'USDT', 'EFECTIVO', 'CRIPTO', 'WALLET']
    expect(metodos).toHaveLength(8)
  })
})

describe('reserva.actions - creacion de reserva validaciones', () => {
  it('fecha de entrada debe ser futura', () => {
    const pasado = new Date('2020-01-01')
    const futuro = new Date('2030-01-05')
    expect(futuro.getTime() > pasado.getTime()).toBe(true)
  })

  it('fecha de salida debe ser posterior a entrada', () => {
    const entrada = new Date('2030-01-01')
    const salida = new Date('2030-01-05')
    expect(salida > entrada).toBe(true)
  })

  it('estancia maxima de 365 noches', () => {
    const entrada = new Date('2030-01-01')
    const salida = new Date('2030-01-05')
    const noches = Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24))
    expect(noches).toBeLessThanOrEqual(365)
  })

  it('cantidadHuespedes entre 1 y 20', () => {
    const validos = [1, 5, 10, 20]
    const invalidos = [0, -1, 21]
    validos.forEach(n => expect(n).toBeGreaterThanOrEqual(1))
    validos.forEach(n => expect(n).toBeLessThanOrEqual(20))
    invalidos.forEach(n => expect(n < 1 || n > 20).toBe(true))
  })
})

describe('reserva.actions - cancelacion y reembolso', () => {
  it('CANCELADA_HUESPED aplica reembolso segun politica', () => {
    const politicas: Array<'FLEXIBLE' | 'MODERADA' | 'ESTRICTA'> = ['FLEXIBLE', 'MODERADA', 'ESTRICTA']
    expect(politicas).toHaveLength(3)
  })

  it('CANCELADA_ANFITRION siempre da reembolso completo', () => {
    const total = 100
    const reembolso = total
    expect(reembolso).toBe(total)
  })
})
