'use server'

import { revalidatePath } from 'next/cache'
import { goPost, GoAPIError } from '@/lib/go-api-client'

export async function crearResena(formData: FormData) {
  const datos = {
    calificacion: parseInt(formData.get('calificacion') as string),
    limpieza: formData.get('limpieza') ? parseInt(formData.get('limpieza') as string) : undefined,
    comunicacion: formData.get('comunicacion') ? parseInt(formData.get('comunicacion') as string) : undefined,
    ubicacion: formData.get('ubicacion') ? parseInt(formData.get('ubicacion') as string) : undefined,
    valor: formData.get('valor') ? parseInt(formData.get('valor') as string) : undefined,
    comentario: formData.get('comentario') as string,
    reservaId: formData.get('reservaId') as string,
  }

  try {
    const result = await goPost<{ propiedad_id: string }>('/api/v1/resenas', datos)

    revalidatePath(`/propiedades/${result.propiedad_id}`)
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) {
      return { error: err.message }
    }
    return { error: 'Error al crear la reseña' }
  }
}

export async function responderResena(resenaId: string, respuesta: string) {
  try {
    const result = await goPost<{ propiedad_id: string }>(`/api/v1/resenas/${resenaId}/responder`, { respuesta })

    revalidatePath(`/propiedades/${result.propiedad_id}`)
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) {
      return { error: err.message }
    }
    return { error: 'Error al responder' }
  }
}
