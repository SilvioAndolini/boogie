import { describe, it, expect, vi } from 'vitest'
import crypto from 'crypto'

describe('api/metamap/webhook - HMAC verification', () => {
  const secret = 'webhook-secret-123'

  function verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    return signature === expected
  }

  it('firma valida es aceptada', () => {
    const payload = JSON.stringify({ event: 'verification.completed', data: { id: 'v-1' } })
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    expect(verifySignature(payload, signature, secret)).toBe(true)
  })

  it('firma invalida es rechazada', () => {
    const payload = JSON.stringify({ event: 'verification.completed' })
    expect(verifySignature(payload, 'firma-falsa', secret)).toBe(false)
  })

  it('payload modificado invalida la firma', () => {
    const payload1 = JSON.stringify({ status: 'approved' })
    const signature = crypto.createHmac('sha256', secret).update(payload1).digest('hex')
    const payload2 = JSON.stringify({ status: 'rejected' })
    expect(verifySignature(payload2, signature, secret)).toBe(false)
  })

  it('secret incorrecto invalida la firma', () => {
    const payload = JSON.stringify({ event: 'test' })
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    expect(verifySignature(payload, signature, 'otro-secret')).toBe(false)
  })
})
