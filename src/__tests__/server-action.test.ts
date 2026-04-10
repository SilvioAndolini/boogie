import { describe, it, expect } from 'vitest'
import { exito, error, isExito, isError, listaError } from '@/lib/server-action'

describe('server-action helpers', () => {
  describe('exito', () => {
    it('returns success result with data', () => {
      const result = exito({ id: '123', name: 'test' })
      expect(result.exito).toBe(true)
      if (result.exito) {
        expect(result.datos).toEqual({ id: '123', name: 'test' })
      }
    })

    it('returns success result with void data', () => {
      const result = exito(undefined)
      expect(result.exito).toBe(true)
    })
  })

  describe('error', () => {
    it('returns error result with message', () => {
      const result = error('Something went wrong')
      expect(result.exito).toBe(false)
      if (!result.exito) {
        expect(result.error).toBe('Something went wrong')
      }
    })
  })

  describe('listaError', () => {
    it('returns list error result with message', () => {
      const result = listaError<string>('Not found')
      expect(result.exito).toBe(false)
      if (!result.exito) {
        expect(result.error).toBe('Not found')
      }
    })
  })

  describe('isExito / isError', () => {
    it('correctly narrows success type', () => {
      const result = exito(42)
      expect(isExito(result)).toBe(true)
      expect(isError(result)).toBe(false)
    })

    it('correctly narrows error type', () => {
      const result = error('fail')
      expect(isExito(result)).toBe(false)
      expect(isError(result)).toBe(true)
    })
  })
})
