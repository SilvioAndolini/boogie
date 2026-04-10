import { describe, it, expect } from 'vitest'
import { isCeoEmail } from '@/lib/admin-constants'

describe('isCeoEmail', () => {
  it('retorna true para el email del CEO', () => {
    expect(isCeoEmail('sebaschaconpe@gmail.com')).toBe(true)
  })

  it('retorna false para otro email', () => {
    expect(isCeoEmail('admin@boogie.com')).toBe(false)
  })

  it('retorna false para undefined', () => {
    expect(isCeoEmail(undefined)).toBe(false)
  })

  it('es case sensitive', () => {
    expect(isCeoEmail('Sebaschaconpe@gmail.com')).toBe(false)
  })
})
