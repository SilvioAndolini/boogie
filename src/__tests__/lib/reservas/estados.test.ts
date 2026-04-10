import { describe, it, expect } from 'vitest'
import { puedeTransicionar, obtenerErrorTransicion, esEstadoFinal, sePuedeCancelar } from '@/lib/reservas/estados'
import type { EstadoReserva } from '@/types'

const ESTADOS: EstadoReserva[] = [
  'PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA',
  'CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA',
]

describe('puedeTransicionar', () => {
  describe('PENDIENTE', () => {
    it('permite transicionar a CONFIRMADA', () => {
      expect(puedeTransicionar('PENDIENTE', 'CONFIRMADA')).toBe(true)
    })
    it('permite transicionar a RECHAZADA', () => {
      expect(puedeTransicionar('PENDIENTE', 'RECHAZADA')).toBe(true)
    })
    it('permite transicionar a CANCELADA_HUESPED', () => {
      expect(puedeTransicionar('PENDIENTE', 'CANCELADA_HUESPED')).toBe(true)
    })
    it('no permite transicionar a EN_CURSO', () => {
      expect(puedeTransicionar('PENDIENTE', 'EN_CURSO')).toBe(false)
    })
    it('no permite transicionar a COMPLETADA', () => {
      expect(puedeTransicionar('PENDIENTE', 'COMPLETADA')).toBe(false)
    })
    it('no permite transicionar a CANCELADA_ANFITRION', () => {
      expect(puedeTransicionar('PENDIENTE', 'CANCELADA_ANFITRION')).toBe(false)
    })
    it('no permite transicionar a si mismo', () => {
      expect(puedeTransicionar('PENDIENTE', 'PENDIENTE')).toBe(false)
    })
  })

  describe('CONFIRMADA', () => {
    it('permite transicionar a EN_CURSO', () => {
      expect(puedeTransicionar('CONFIRMADA', 'EN_CURSO')).toBe(true)
    })
    it('permite transicionar a CANCELADA_HUESPED', () => {
      expect(puedeTransicionar('CONFIRMADA', 'CANCELADA_HUESPED')).toBe(true)
    })
    it('permite transicionar a CANCELADA_ANFITRION', () => {
      expect(puedeTransicionar('CONFIRMADA', 'CANCELADA_ANFITRION')).toBe(true)
    })
    it('no permite transicionar a COMPLETADA directamente', () => {
      expect(puedeTransicionar('CONFIRMADA', 'COMPLETADA')).toBe(false)
    })
    it('no permite transicionar a PENDIENTE', () => {
      expect(puedeTransicionar('CONFIRMADA', 'PENDIENTE')).toBe(false)
    })
    it('no permite transicionar a RECHAZADA', () => {
      expect(puedeTransicionar('CONFIRMADA', 'RECHAZADA')).toBe(false)
    })
  })

  describe('EN_CURSO', () => {
    it('permite transicionar a COMPLETADA', () => {
      expect(puedeTransicionar('EN_CURSO', 'COMPLETADA')).toBe(true)
    })
    it('no permite transicionar a CANCELADA_HUESPED', () => {
      expect(puedeTransicionar('EN_CURSO', 'CANCELADA_HUESPED')).toBe(false)
    })
    it('no permite transicionar a CONFIRMADA', () => {
      expect(puedeTransicionar('EN_CURSO', 'CONFIRMADA')).toBe(false)
    })
  })

  describe('estados finales', () => {
    it('COMPLETADA no permite ninguna transicion', () => {
      ESTADOS.forEach(e => {
        expect(puedeTransicionar('COMPLETADA', e)).toBe(false)
      })
    })
    it('CANCELADA_HUESPED no permite ninguna transicion', () => {
      ESTADOS.forEach(e => {
        expect(puedeTransicionar('CANCELADA_HUESPED', e)).toBe(false)
      })
    })
    it('CANCELADA_ANFITRION no permite ninguna transicion', () => {
      ESTADOS.forEach(e => {
        expect(puedeTransicionar('CANCELADA_ANFITRION', e)).toBe(false)
      })
    })
    it('RECHAZADA no permite ninguna transicion', () => {
      ESTADOS.forEach(e => {
        expect(puedeTransicionar('RECHAZADA', e)).toBe(false)
      })
    })
  })
})

describe('obtenerErrorTransicion', () => {
  it('retorna string vacio para transicion valida', () => {
    expect(obtenerErrorTransicion('PENDIENTE', 'CONFIRMADA')).toBe('')
  })
  it('retorna mensaje de error para transicion invalida', () => {
    const error = obtenerErrorTransicion('COMPLETADA', 'PENDIENTE')
    expect(error).toContain('COMPLETADA')
    expect(error).toContain('PENDIENTE')
    expect(error.length).toBeGreaterThan(0)
  })
  it('retorna string vacio para EN_CURSO -> COMPLETADA', () => {
    expect(obtenerErrorTransicion('EN_CURSO', 'COMPLETADA')).toBe('')
  })
})

describe('esEstadoFinal', () => {
  it('COMPLETADA es estado final', () => {
    expect(esEstadoFinal('COMPLETADA')).toBe(true)
  })
  it('CANCELADA_HUESPED es estado final', () => {
    expect(esEstadoFinal('CANCELADA_HUESPED')).toBe(true)
  })
  it('CANCELADA_ANFITRION es estado final', () => {
    expect(esEstadoFinal('CANCELADA_ANFITRION')).toBe(true)
  })
  it('RECHAZADA es estado final', () => {
    expect(esEstadoFinal('RECHAZADA')).toBe(true)
  })
  it('PENDIENTE no es estado final', () => {
    expect(esEstadoFinal('PENDIENTE')).toBe(false)
  })
  it('CONFIRMADA no es estado final', () => {
    expect(esEstadoFinal('CONFIRMADA')).toBe(false)
  })
  it('EN_CURSO no es estado final', () => {
    expect(esEstadoFinal('EN_CURSO')).toBe(false)
  })
})

describe('sePuedeCancelar', () => {
  it('se puede cancelar desde PENDIENTE', () => {
    expect(sePuedeCancelar('PENDIENTE')).toBe(true)
  })
  it('se puede cancelar desde CONFIRMADA', () => {
    expect(sePuedeCancelar('CONFIRMADA')).toBe(true)
  })
  it('no se puede cancelar desde EN_CURSO', () => {
    expect(sePuedeCancelar('EN_CURSO')).toBe(false)
  })
  it('no se puede cancelar desde COMPLETADA', () => {
    expect(sePuedeCancelar('COMPLETADA')).toBe(false)
  })
  it('no se puede cancelar desde CANCELADA_HUESPED', () => {
    expect(sePuedeCancelar('CANCELADA_HUESPED')).toBe(false)
  })
  it('no se puede cancelar desde RECHAZADA', () => {
    expect(sePuedeCancelar('RECHAZADA')).toBe(false)
  })
})
