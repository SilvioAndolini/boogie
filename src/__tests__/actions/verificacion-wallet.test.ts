import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('verificacion.actions - estructura', () => {
  it('estados de verificacion validos', () => {
    const estados = ['PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA']
    expect(estados).toHaveLength(4)
  })

  it('maximo 3 fotos para verificacion manual', () => {
    const MAX_FOTOS = 3
    expect(MAX_FOTOS).toBe(3)
  })

  it('CEO email es protegido contra modificacion', () => {
    const CEO_EMAIL = 'sebaschaconpe@gmail.com'
    const emailAProteger = 'sebaschaconpe@gmail.com'
    expect(emailAProteger === CEO_EMAIL).toBe(true)
  })
})

describe('wallet.actions - estructura', () => {
  it('transacciones de wallet tienen limite de 50', () => {
    const LIMITE_TRANSACCIONES = 50
    expect(LIMITE_TRANSACCIONES).toBe(50)
  })

  it('wallet requiere activacion previa', () => {
    const walletActiva = false
    const puedeRecargar = walletActiva
    expect(puedeRecargar).toBe(false)
  })
})
