import { describe, it, expect } from 'vitest'
import { formatPrecio, truncate, formatTelefono, maskCedula, maskCuenta, getIniciales, calcularNoches } from '@/lib/format'

describe('formatPrecio', () => {
  it('formats USD correctly', () => {
    expect(formatPrecio(100)).toBe('$100.00')
    expect(formatPrecio(99.5)).toBe('$99.50')
  })

  it('formats VES correctly', () => {
    expect(formatPrecio(100, 'VES')).toBe('Bs. 100.00')
  })

  it('handles string input', () => {
    expect(formatPrecio('50.99')).toBe('$50.99')
  })
})

describe('truncate', () => {
  it('returns original text if shorter than limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world this is a long text', 15)).toBe('hello world thi...')
  })

  it('uses default limit of 100', () => {
    const short = 'a'.repeat(50)
    expect(truncate(short)).toBe(short)
  })
})

describe('formatTelefono', () => {
  it('formats 11-digit Venezuelan number', () => {
    expect(formatTelefono('04121234567')).toBe('+58 041-212-34567')
  })

  it('returns original if not 11 digits', () => {
    expect(formatTelefono('123')).toBe('123')
  })

  it('strips non-digits before formatting', () => {
    expect(formatTelefono('+58 412-123-4567')).toBe('+58 412-123-4567')
  })
})

describe('maskCedula', () => {
  it('masks all but last 3 digits', () => {
    expect(maskCedula('12345678')).toBe('*****678')
  })

  it('returns *** for short values', () => {
    expect(maskCedula('12')).toBe('***')
  })
})

describe('maskCuenta', () => {
  it('masks all but last 4 digits', () => {
    expect(maskCuenta('1234567890')).toBe('******7890')
  })

  it('returns **** for short values', () => {
    expect(maskCuenta('123')).toBe('****')
  })
})

describe('getIniciales', () => {
  it('returns uppercase initials', () => {
    expect(getIniciales('juan', 'perez')).toBe('JP')
  })
})

describe('calcularNoches', () => {
  it('calculates nights between two dates', () => {
    const entrada = new Date('2024-01-01')
    const salida = new Date('2024-01-05')
    expect(calcularNoches(entrada, salida)).toBe(4)
  })

  it('returns at least 1 for same day', () => {
    const fecha = new Date('2024-01-01')
    expect(calcularNoches(fecha, new Date(fecha.getTime() + 12 * 60 * 60 * 1000))).toBe(1)
  })
})
