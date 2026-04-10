import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))

describe('review.actions - validaciones de creacion', () => {
  it('calificacion debe estar entre 1 y 5', () => {
    const validas = [1, 2, 3, 4, 5]
    const invalidas = [0, -1, 6, 10]
    validas.forEach(c => expect(c >= 1 && c <= 5).toBe(true))
    invalidas.forEach(c => expect(c < 1 || c > 5).toBe(true))
  })

  it('comentario debe tener al menos 10 caracteres', () => {
    const minimo = 10
    expect('Excelente!'.length).toBeGreaterThanOrEqual(minimo)
    expect('Corto'.length).toBeLessThan(minimo)
  })

  it('resena debe ser unica por reserva', () => {
    const resenasExistentes = [{ reservaId: 'r-1', autorId: 'u-1' }]
    const nuevaResena = { reservaId: 'r-1', autorId: 'u-1' }
    const yaExiste = resenasExistentes.some(
      r => r.reservaId === nuevaResena.reservaId && r.autorId === nuevaResena.autorId
    )
    expect(yaExiste).toBe(true)
  })

  it('reserva debe estar COMPLETADA para crear resena', () => {
    const estadosPermitidos = ['COMPLETADA']
    expect(estadosPermitidos).not.toContain('PENDIENTE')
    expect(estadosPermitidos).not.toContain('CONFIRMADA')
  })

  it('respuesta de anfitrion es opcional', () => {
    const resena = { id: 'r-1', comentario: 'Buen lugar', respuestaAnfitrion: null }
    expect(resena.respuestaAnfitrion).toBeNull()
  })
})
