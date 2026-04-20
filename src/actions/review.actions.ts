'use server'

import * as Sentry from '@sentry/nextjs'

import { revalidatePath } from 'next/cache'
import { getUsuarioAutenticado } from '@/lib/auth'
import { goPost, GoAPIError } from '@/lib/go-api-client'

export async function crearResena(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) {
    return { error: 'Debes iniciar sesión para dejar una reseña' }
  }

  const calificacion = parseInt(formData.get('calificacion') as string)
  const comentario = (formData.get('comentario') as string)?.trim()
  const reservaId = formData.get('reservaId') as string

  if (!reservaId) {
    return { error: 'Reserva no especificada' }
  }
  if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
    return { error: 'La calificación debe estar entre 1 y 5' }
  }
  if (!comentario || comentario.length < 10) {
    return { error: 'El comentario debe tener al menos 10 caracteres' }
  }

  const subCalificaciones = ['limpieza', 'comunicacion', 'ubicacion', 'valor'] as const
  const extras: Record<string, number> = {}
  for (const campo of subCalificaciones) {
    const raw = formData.get(campo)
    if (raw) {
      const val = parseInt(raw as string)
      if (!isNaN(val) && val >= 1 && val <= 5) {
        extras[campo] = val
      }
    }
  }

  const datos = {
    calificacion,
    comentario,
    reservaId,
    ...extras,
  }

  try {
    const result = await goPost<{ propiedad_id: string }>('/api/v1/resenas', datos)

    revalidatePath(`/propiedades/${result.propiedad_id}`)
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) {
      return { error: err.message }
    }
    return { error: 'Error al crear la reseña' }
  }
}

export async function responderResena(resenaId: string, respuesta: string) {
  const user = await getUsuarioAutenticado()
  if (!user) {
    return { error: 'Debes iniciar sesión para responder' }
  }

  if (!resenaId) {
    return { error: 'Reseña no especificada' }
  }
  if (!respuesta?.trim()) {
    return { error: 'La respuesta no puede estar vacía' }
  }

  try {
    const result = await goPost<{ propiedad_id: string }>(`/api/v1/resenas/${resenaId}/responder`, { respuesta: respuesta.trim() })

    revalidatePath(`/propiedades/${result.propiedad_id}`)
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) {
      return { error: err.message }
    }
    return { error: 'Error al responder' }
  }
}
