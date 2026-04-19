import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getUsuarioAutenticado: vi.fn() }))
vi.mock('@/lib/go-api-client', () => ({
  goPost: vi.fn(),
  GoAPIError: class extends Error { status = 500; code?: string },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { getUsuarioAutenticado } from '@/lib/auth'
import { goPost } from '@/lib/go-api-client'
import { crearResena, responderResena } from '@/actions/review.actions'

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

describe('crearResena', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza si no hay usuario autenticado', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue(null)
    const result = await crearResena(makeFormData({
      calificacion: '5',
      comentario: 'Excelente lugar, muy recomendado',
      reservaId: 'res-1',
    }))
    expect(result).toEqual({ error: 'Debes iniciar sesión para dejar una reseña' })
  })

  it('rechaza calificacion fuera de rango', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    const result = await crearResena(makeFormData({
      calificacion: '0',
      comentario: 'Excelente lugar, muy recomendado',
      reservaId: 'res-1',
    }))
    expect(result).toEqual({ error: 'La calificación debe estar entre 1 y 5' })
  })

  it('rechaza comentario con menos de 10 caracteres', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    const result = await crearResena(makeFormData({
      calificacion: '4',
      comentario: 'Corto',
      reservaId: 'res-1',
    }))
    expect(result).toEqual({ error: 'El comentario debe tener al menos 10 caracteres' })
  })

  it('rechaza sin reservaId', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    const result = await crearResena(makeFormData({
      calificacion: '4',
      comentario: 'Buen lugar, recomendado',
    }))
    expect(result).toEqual({ error: 'Reserva no especificada' })
  })

  it('acepta sub-calificaciones validas (1-5)', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    vi.mocked(goPost).mockResolvedValue({ propiedad_id: 'prop-1' })
    const result = await crearResena(makeFormData({
      calificacion: '4',
      comentario: 'Buen lugar, recomendado',
      reservaId: 'res-1',
      limpieza: '5',
      comunicacion: '4',
      ubicacion: '3',
      valor: '5',
    }))
    expect(result).toEqual({ exito: true })
    expect(goPost).toHaveBeenCalledWith('/api/v1/resenas', expect.objectContaining({
      calificacion: 4,
      limpieza: 5,
      comunicacion: 4,
      ubicacion: 3,
      valor: 5,
    }))
  })
})

describe('responderResena', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza si no hay usuario autenticado', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue(null)
    const result = await responderResena('resena-1', 'Gracias por tu comentario')
    expect(result).toEqual({ error: 'Debes iniciar sesión para responder' })
  })

  it('rechaza respuesta vacia', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    const result = await responderResena('resena-1', '   ')
    expect(result).toEqual({ error: 'La respuesta no puede estar vacía' })
  })

  it('rechaza sin resenaId', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    const result = await responderResena('', 'Gracias')
    expect(result).toEqual({ error: 'Reseña no especificada' })
  })

  it('retorna exito cuando el backend acepta', async () => {
    vi.mocked(getUsuarioAutenticado).mockResolvedValue({ id: 'u-1' } as any)
    vi.mocked(goPost).mockResolvedValue({ propiedad_id: 'prop-1' })
    const result = await responderResena('resena-1', 'Gracias por tu comentario')
    expect(result).toEqual({ exito: true })
    expect(goPost).toHaveBeenCalledWith('/api/v1/resenas/resena-1/responder', { respuesta: 'Gracias por tu comentario' })
  })
})
