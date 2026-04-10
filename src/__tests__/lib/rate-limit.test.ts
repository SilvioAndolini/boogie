import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('permite primera solicitud', () => {
    const result = rateLimit('test-ip-1', { windowMs: 60000, maxRequests: 5 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('cuenta solicitudes restantes correctamente', () => {
    const id = 'test-ip-counting'
    rateLimit(id, { windowMs: 60000, maxRequests: 3 })
    rateLimit(id, { windowMs: 60000, maxRequests: 3 })
    const result = rateLimit(id, { windowMs: 60000, maxRequests: 3 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('bloquea cuando se excede el limite', () => {
    const id = 'test-ip-blocked'
    const config = { windowMs: 60000, maxRequests: 2 }
    rateLimit(id, config)
    rateLimit(id, config)
    const result = rateLimit(id, config)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('identificadores diferentes tienen contadores separados', () => {
    const config = { windowMs: 60000, maxRequests: 1 }
    const r1 = rateLimit('ip-a', config)
    const r2 = rateLimit('ip-b', config)
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
  })

  it('retorna resetIn positivo', () => {
    const result = rateLimit('test-ip-reset', { windowMs: 60000, maxRequests: 5 })
    expect(result.resetIn).toBeGreaterThan(0)
  })
})

describe('getClientIP', () => {
  it('extrae IP de x-forwarded-for', () => {
    const request = new Request('https://test.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIP(request)).toBe('1.2.3.4')
  })

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    const request = new Request('https://test.com', {
      headers: { 'x-real-ip': '9.8.7.6' },
    })
    expect(getClientIP(request)).toBe('9.8.7.6')
  })

  it('retorna unknown si no hay headers de IP', () => {
    const request = new Request('https://test.com')
    expect(getClientIP(request)).toBe('unknown')
  })

  it('x-forwarded-for toma precedencia sobre x-real-ip', () => {
    const request = new Request('https://test.com', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    })
    expect(getClientIP(request)).toBe('1.1.1.1')
  })
})
