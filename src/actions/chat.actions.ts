'use server'

import * as Sentry from '@sentry/nextjs'

import { getUsuarioAutenticado } from '@/lib/auth'
import { goGet, goPost, goPut, goDelete } from '@/lib/go-api-client'
import { Conversacion, Mensaje, MensajeRapido } from '@/types/chat'
import { IMAGEN_CHAT_MAX_SIZE } from '@/lib/chat/constants'
import { revalidatePath } from 'next/cache'

export async function getConversacionInfo(
  conversacionId: string
): Promise<{
  exito: boolean
  miId?: string
  otroUsuario?: Conversacion['otro_usuario']
  propiedad?: Conversacion['propiedad']
  error?: string
}> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    const info = await goGet<{
      otro_id: string
      otro_nombre: string
      otro_apellido: string
      otro_avatar_url: string | null
      propiedad_id: string | null
      propiedad_titulo: string | null
    }>(`/api/v1/chat/conversaciones/${conversacionId}`)

    await seedMensajesRapidos('')

    return {
      exito: true,
      miId: user.id,
      otroUsuario: {
        id: info.otro_id,
        nombre: info.otro_nombre,
        apellido: info.otro_apellido,
        avatar_url: info.otro_avatar_url,
      },
      propiedad: info.propiedad_id
        ? { id: info.propiedad_id, titulo: info.propiedad_titulo ?? '' }
        : null,
    }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { exito: false, error: err instanceof Error ? err.message : 'Conversacion no encontrada' }
  }
}

export async function obtenerOCrearConversacion(
  otroUsuarioId: string,
  propiedadId?: string,
  reservaId?: string
): Promise<{ exito: boolean; datos?: Conversacion; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }
  if (otroUsuarioId === user.id) return { exito: false, error: 'No puedes chatear contigo mismo' }

  try {
    const datos = await goPost<Conversacion>('/api/v1/chat/conversaciones', {
      otroUsuarioId,
      propiedadId,
      reservaId,
    })
    return { exito: true, datos }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al crear conversación'
    return { exito: false, error: message }
  }
}

export async function getConversaciones(): Promise<{ exito: boolean; datos?: Conversacion[]; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    const raw = await goGet<Record<string, unknown>[]>('/api/v1/chat/conversaciones')
    const datos = (raw ?? []).map((c) => ({
      id: c.id,
      participante_1: c.participante_1,
      participante_2: c.participante_2,
      propiedad_id: c.propiedad_id,
      reserva_id: c.reserva_id,
      ultimo_mensaje_at: c.ultimo_mensaje_at,
      ultimo_mensaje_preview: c.ultimo_mensaje_preview,
      created_at: c.created_at,
      updated_at: c.updated_at,
      otro_usuario: {
        id: c.otro_id,
        nombre: c.otro_nombre,
        apellido: c.otro_apellido,
        avatar_url: c.otro_avatar_url,
      },
      propiedad: c.propiedad_id
        ? { id: c.propiedad_id, titulo: c.propiedad_titulo }
        : null,
      no_leidos: c.no_leidos,
    })) as Conversacion[]
    return { exito: true, datos }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al obtener conversaciones'
    return { exito: false, error: message }
  }
}

export async function getMensajes(
  conversacionId: string,
  offset = 0
): Promise<{ exito: boolean; datos?: Mensaje[]; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    const datos = await goGet<Mensaje[]>(`/api/v1/chat/mensajes?conversacionId=${conversacionId}&offset=${offset}`)
    return { exito: true, datos: datos ?? [] }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al obtener mensajes'
    return { exito: false, error: message }
  }
}

export async function enviarMensaje(
  conversacionId: string,
  contenido: string,
  tipo: 'texto' | 'imagen' | 'rapido' = 'texto',
  imagenUrl?: string
): Promise<{ exito: boolean; datos?: Mensaje; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }
  if (!contenido?.trim() && !imagenUrl) return { exito: false, error: 'Mensaje vacío' }

  try {
    const raw = await goPost<Record<string, unknown>>('/api/v1/chat/mensajes', {
      conversacionId,
      contenido: contenido?.trim() || '',
      tipo,
      imagenUrl,
    })
    const datos: Mensaje = {
      id: raw.id as string,
      conversacion_id: raw.conversacion_id as string,
      remitente_id: raw.remitente_id as string,
      contenido: raw.contenido as string | null,
      tipo: (raw.tipo as Mensaje['tipo']) || 'texto',
      imagen_url: raw.imagen_url as string | null,
      leido: (raw.leido as boolean) ?? false,
      created_at: raw.created_at as string,
      remitente: {
        id: raw.remitente_id as string,
        nombre: (raw.remitente_nombre as string) || '',
        apellido: '',
        avatar_url: raw.remitente_avatar as string | null,
      },
    }
    return { exito: true, datos }
  } catch (e: unknown) {
      Sentry.captureException(e)
    const message = e instanceof Error ? e.message : 'Error al enviar mensaje'
    return { exito: false, error: message }
  }
}

export async function subirImagenChat(formData: FormData): Promise<{ exito: boolean; url?: string; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  const archivo = formData.get('imagen') as File | null
  if (!archivo) return { exito: false, error: 'No se encontró imagen' }
  if (archivo.size > IMAGEN_CHAT_MAX_SIZE) return { exito: false, error: 'Imagen muy grande (máx 5MB)' }

  try {
    const result = await goPost<{ ok: boolean; url: string }>('/api/v1/chat/imagen', formData)
    return { exito: true, url: result.url }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { exito: false, error: err instanceof Error ? err.message : 'Error al subir imagen' }
  }
}

export async function getConteoNoLeidos(): Promise<number> {
  const user = await getUsuarioAutenticado()
  if (!user) return 0

  try {
    const data = await goGet<{ count: number }>('/api/v1/chat/no-leidos')
    return data?.count ?? 0
  } catch {
    return 0
  }
}

export async function getMensajesRapidos(): Promise<{ exito: boolean; datos?: MensajeRapido[]; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    const datos = await goGet<MensajeRapido[]>('/api/v1/chat/mensajes-rapidos')
    return { exito: true, datos: datos ?? [] }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { exito: false, error: err instanceof Error ? err.message : 'Error al obtener mensajes rapidos' }
  }
}

export async function seedMensajesRapidos(rol: string): Promise<void> {
  const user = await getUsuarioAutenticado()
  if (!user) return

  try {
    await goPost('/api/v1/chat/mensajes-rapidos/seed', { rol: rol || 'BOOGER' })
  } catch {}
}

export async function actualizarMensajeRapido(
  id: string,
  contenido: string
): Promise<{ exito: boolean; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    await goPut(`/api/v1/chat/mensajes-rapidos/${id}`, { contenido })
    revalidatePath('/dashboard/mensajes')
    return { exito: true }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { exito: false, error: err instanceof Error ? err.message : 'Error al actualizar' }
  }
}

export async function crearMensajeRapido(
  contenido: string,
  tipo: 'anfitrion' | 'booger' | 'ambos' = 'ambos'
): Promise<{ exito: boolean; datos?: MensajeRapido; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    const datos = await goPost<MensajeRapido>('/api/v1/chat/mensajes-rapidos', { contenido, tipo })
    return { exito: true, datos }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { exito: false, error: err instanceof Error ? err.message : 'Error al crear' }
  }
}

export async function eliminarMensajeRapido(id: string): Promise<{ exito: boolean; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    await goDelete(`/api/v1/chat/mensajes-rapidos/${id}`)
    revalidatePath('/dashboard/mensajes')
    return { exito: true }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { exito: false, error: err instanceof Error ? err.message : 'Error al eliminar' }
  }
}
