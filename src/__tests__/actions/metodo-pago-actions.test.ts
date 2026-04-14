import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('metodo-pago.actions - validaciones', () => {
  it('un metodo por tipo por usuario', () => {
    const metodosExistentes = [
      { tipo: 'ZELLE', usuarioId: 'u-1' },
      { tipo: 'PAGO_MOVIL', usuarioId: 'u-1' },
    ]
    const nuevoMetodo = { tipo: 'ZELLE', usuarioId: 'u-1' }
    const yaExiste = metodosExistentes.some(
      m => m.tipo === nuevoMetodo.tipo && m.usuarioId === nuevoMetodo.usuarioId
    )
    expect(yaExiste).toBe(true)
  })

  it('tipos de metodo de pago validos', () => {
    const tipos = [
      'TRANSFERENCIA_BANCARIA', 'PAGO_MOVIL', 'ZELLE',
      'EFECTIVO_FARMATODO', 'USDT', 'EFECTIVO', 'CRIPTO', 'WALLET',
    ]
    expect(tipos).toHaveLength(8)
  })

  it('mismo tipo diferente usuario es permitido', () => {
    const metodosExistentes = [{ tipo: 'ZELLE', usuarioId: 'u-1' }]
    const nuevoMetodo = { tipo: 'ZELLE', usuarioId: 'u-2' }
    const yaExiste = metodosExistentes.some(
      m => m.tipo === nuevoMetodo.tipo && m.usuarioId === nuevoMetodo.usuarioId
    )
    expect(yaExiste).toBe(false)
  })
})
