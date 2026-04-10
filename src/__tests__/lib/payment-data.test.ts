import { describe, it, expect } from 'vitest'
import { getDatosPago } from '@/lib/payment-data'

describe('getDatosPago', () => {
  it('retorna estructura con todos los metodos', async () => {
    const data = await getDatosPago()
    expect(data).toHaveProperty('TRANSFERENCIA_BANCARIA')
    expect(data).toHaveProperty('PAGO_MOVIL')
    expect(data).toHaveProperty('ZELLE')
    expect(data).toHaveProperty('EFECTIVO_FARMATODO')
    expect(data).toHaveProperty('USDT')
    expect(data).toHaveProperty('TARJETA_INTERNACIONAL')
  })

  it('TRANSFERENCIA_BANCARIA tiene banco, cuenta, titular, cedula', async () => {
    const data = await getDatosPago()
    const tb = data.TRANSFERENCIA_BANCARIA
    expect(tb).toHaveProperty('banco')
    expect(tb).toHaveProperty('cuenta')
    expect(tb).toHaveProperty('titular')
    expect(tb).toHaveProperty('cedula')
  })

  it('PAGO_MOVIL tiene banco, telefono, cedula', async () => {
    const data = await getDatosPago()
    const pm = data.PAGO_MOVIL
    expect(pm).toHaveProperty('banco')
    expect(pm).toHaveProperty('telefono')
    expect(pm).toHaveProperty('cedula')
  })

  it('ZELLE tiene email y nombre', async () => {
    const data = await getDatosPago()
    expect(data.ZELLE).toHaveProperty('email')
    expect(data.ZELLE).toHaveProperty('nombre')
  })

  it('USDT tiene red y direccion', async () => {
    const data = await getDatosPago()
    expect(data.USDT).toHaveProperty('red')
    expect(data.USDT).toHaveProperty('direccion')
  })
})
