'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { goGet, goPost } from '@/lib/go-api-client'
import { Conversacion, Mensaje, MensajeRapido } from '@/types/chat'
import {
  QUICK_MESSAGES_DEFAULTS_ANFITRION,
  QUICK_MESSAGES_DEFAULTS_BOOGER,
  IMAGEN_CHAT_MAX_SIZE,
  IMAGEN_CHAT_BUCKET,
} from '@/lib/chat/constants'
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

  const admin = createAdminClient()

  const { data: conv } = await admin
    .from('conversaciones')
    .select(`
      participante_1, participante_2,
      p1:usuarios!participante_1(id, nombre, apellido, avatar_url),
      p2:usuarios!participante_2(id, nombre, apellido, avatar_url),
      propiedad:propiedades(id, titulo)
    `)
    .eq('id', conversacionId)
    .single()

  if (!conv) return { exito: false, error: 'Conversación no encontrada' }

  const c = conv as Record<string, unknown>
  if (c.participante_1 !== user.id && c.participante_2 !== user.id) {
    return { exito: false, error: 'Sin permisos' }
  }

  const esParticipante1 = c.participante_1 === user.id
  const otro = esParticipante1 ? c.p2 : c.p1

  const { data: userData } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (userData) {
    await seedMensajesRapidos((userData as Record<string, unknown>).rol as string)
  }

  return {
    exito: true,
    miId: user.id,
    otroUsuario: otro as Conversacion['otro_usuario'],
    propiedad: (c.propiedad as Conversacion['propiedad']) || null,
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
    const message = e instanceof Error ? e.message : 'Error al crear conversación'
    return { exito: false, error: message }
  }
}

export async function getConversaciones(): Promise<{ exito: boolean; datos?: Conversacion[]; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  try {
    const datos = await goGet<Conversacion[]>('/api/v1/chat/conversaciones')
    return { exito: true, datos: datos ?? [] }
  } catch (e: unknown) {
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
    const datos = await goPost<Mensaje>('/api/v1/chat/mensajes', {
      conversacionId,
      contenido: contenido?.trim() || '',
      tipo,
      imagenUrl,
    })
    return { exito: true, datos }
  } catch (e: unknown) {
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

  const admin = createAdminClient()
  const ext = archivo.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error } = await admin.storage.from(IMAGEN_CHAT_BUCKET).upload(path, archivo, {
    contentType: archivo.type,
    upsert: false,
  })

  if (error) return { exito: false, error: 'Error al subir imagen' }

  const { data: urlData } = admin.storage.from(IMAGEN_CHAT_BUCKET).getPublicUrl(path)
  return { exito: true, url: urlData.publicUrl }
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

  const admin = createAdminClient()

  const { data } = await admin
    .from('mensajes_rapidos')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (!data || data.length === 0) {
    return { exito: true, datos: [] }
  }

  return { exito: true, datos: data as unknown as MensajeRapido[] }
}

export async function seedMensajesRapidos(rol: string): Promise<void> {
  const user = await getUsuarioAutenticado()
  if (!user) return

  const admin = createAdminClient()

  const { data: existentes } = await admin
    .from('mensajes_rapidos')
    .select('id')
    .eq('usuario_id', user.id)

  if (existentes && existentes.length > 0) return

  const defaults = rol === 'ANFITRION' || rol === 'AMBOS'
    ? QUICK_MESSAGES_DEFAULTS_ANFITRION
    : QUICK_MESSAGES_DEFAULTS_BOOGER

  const inserts = defaults.map((d, i) => ({
    usuario_id: user.id,
    contenido: d.contenido,
    tipo: d.tipo,
    orden: i,
    activo: true,
  }))

  await admin.from('mensajes_rapidos').insert(inserts)
}

export async function actualizarMensajeRapido(
  id: string,
  contenido: string
): Promise<{ exito: boolean; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('mensajes_rapidos')
    .update({ contenido })
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) return { exito: false, error: 'Error al actualizar' }
  revalidatePath('/dashboard/mensajes')
  return { exito: true }
}

export async function crearMensajeRapido(
  contenido: string,
  tipo: 'anfitrion' | 'booger' | 'ambos' = 'ambos'
): Promise<{ exito: boolean; datos?: MensajeRapido; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  const admin = createAdminClient()

  const { data: maxOrden } = await admin
    .from('mensajes_rapidos')
    .select('orden')
    .eq('usuario_id', user.id)
    .order('orden', { ascending: false })
    .limit(1)

  const orden = (maxOrden?.[0] as Record<string, unknown>)?.orden as number ?? 0

  const { data, error } = await admin
    .from('mensajes_rapidos')
    .insert({ usuario_id: user.id, contenido, tipo, orden: orden + 1, activo: true })
    .select()
    .single()

  if (error) return { exito: false, error: 'Error al crear' }
  return { exito: true, datos: data as unknown as MensajeRapido }
}

export async function eliminarMensajeRapido(id: string): Promise<{ exito: boolean; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('mensajes_rapidos')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) return { exito: false, error: 'Error al eliminar' }
  revalidatePath('/dashboard/mensajes')
  return { exito: true }
}
