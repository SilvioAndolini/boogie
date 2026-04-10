'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Conversacion, Mensaje, MensajeRapido } from '@/types/chat'
import {
  QUICK_MESSAGES_DEFAULTS_ANFITRION,
  QUICK_MESSAGES_DEFAULTS_BOOGER,
  MENSAJES_POR_PAGINA,
  IMAGEN_CHAT_MAX_SIZE,
  IMAGEN_CHAT_BUCKET,
} from '@/lib/chat/constants'
import { generarPreview } from '@/lib/chat/utils'
import { revalidatePath } from 'next/cache'

export async function obtenerOCrearConversacion(
  otroUsuarioId: string,
  propiedadId?: string,
  reservaId?: string
): Promise<{ exito: boolean; datos?: Conversacion; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }
  if (otroUsuarioId === user.id) return { exito: false, error: 'No puedes chatear contigo mismo' }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('conversaciones')
    .select('*')
    .or(`and(participante_1.eq.${user.id},participante_2.eq.${otroUsuarioId}),and(participante_1.eq.${otroUsuarioId},participante_2.eq.${user.id})`)
    .limit(1)
    .maybeSingle()

  if (existente) {
    const conversacion = existente as unknown as Conversacion
    if (propiedadId && !conversacion.propiedad_id) {
      await admin.from('conversaciones').update({ propiedad_id: propiedadId }).eq('id', conversacion.id)
      conversacion.propiedad_id = propiedadId
    }
    return { exito: true, datos: conversacion }
  }

  const { data, error } = await admin
    .from('conversaciones')
    .insert({
      participante_1: user.id,
      participante_2: otroUsuarioId,
      propiedad_id: propiedadId || null,
      reserva_id: reservaId || null,
    })
    .select()
    .single()

  if (error) return { exito: false, error: 'Error al crear conversación' }
  return { exito: true, datos: data as unknown as Conversacion }
}

export async function getConversaciones(): Promise<{ exito: boolean; datos?: Conversacion[]; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('conversaciones')
    .select(`
      *,
      otro:usuarios!participante_2(id, nombre, apellido, avatar_url),
      otro2:usuarios!participante_1(id, nombre, apellido, avatar_url)
    `)
    .or(`participante_1.eq.${user.id},participante_2.eq.${user.id}`)
    .order('ultimo_mensaje_at', { ascending: false })

  if (error) return { exito: false, error: 'Error al obtener conversaciones' }

  const conversaciones = (data as unknown as Record<string, unknown>[])?.map((c) => {
    const conv = c as Record<string, unknown>
    const esP1 = conv.participante_1 === user.id
    const otro = esP1 ? conv.otro : conv.otro2
    return {
      ...conv,
      otro_usuario: otro,
      otro: undefined,
      otro2: undefined,
    } as unknown as Conversacion
  }) || []

  const ids = conversaciones.map((c) => c.id)
  if (ids.length > 0) {
    const { data: noLeidos } = await admin
      .from('mensajes')
      .select('conversacion_id')
      .in('conversacion_id', ids)
      .neq('remitente_id', user.id)
      .eq('leido', false)

    const countMap: Record<string, number> = {}
    for (const nl of (noLeidos || [])) {
      const cid = (nl as Record<string, unknown>).conversacion_id as string
      countMap[cid] = (countMap[cid] || 0) + 1
    }
    for (const c of conversaciones) {
      c.no_leidos = countMap[c.id] || 0
    }
  }

  return { exito: true, datos: conversaciones }
}

export async function getMensajes(
  conversacionId: string,
  offset = 0
): Promise<{ exito: boolean; datos?: Mensaje[]; error?: string }> {
  const user = await getUsuarioAutenticado()
  if (!user) return { exito: false, error: 'No autenticado' }

  const admin = createAdminClient()

  const { data: conv } = await admin
    .from('conversaciones')
    .select('participante_1, participante_2')
    .eq('id', conversacionId)
    .single()

  if (!conv) return { exito: false, error: 'Conversación no encontrada' }
  const c = conv as Record<string, unknown>
  if (c.participante_1 !== user.id && c.participante_2 !== user.id) {
    return { exito: false, error: 'Sin permisos' }
  }

  const { data, error } = await admin
    .from('mensajes')
    .select('*, remitente:usuarios!remitente_id(id, nombre, apellido, avatar_url)')
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: true })
    .range(offset, offset + MENSAJES_POR_PAGINA - 1)

  if (error) return { exito: false, error: 'Error al obtener mensajes' }

  await admin
    .from('mensajes')
    .update({ leido: true })
    .eq('conversacion_id', conversacionId)
    .neq('remitente_id', user.id)
    .eq('leido', false)

  return { exito: true, datos: (data as unknown as Mensaje[]) || [] }
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

  const admin = createAdminClient()

  const { data: conv } = await admin
    .from('conversaciones')
    .select('participante_1, participante_2')
    .eq('id', conversacionId)
    .single()

  if (!conv) return { exito: false, error: 'Conversación no encontrada' }
  const c = conv as Record<string, unknown>
  if (c.participante_1 !== user.id && c.participante_2 !== user.id) {
    return { exito: false, error: 'Sin permisos' }
  }

  const mensajeData = {
    conversacion_id: conversacionId,
    remitente_id: user.id,
    contenido: contenido?.trim() || null,
    tipo,
    imagen_url: imagenUrl || null,
  }

  const { data, error } = await admin
    .from('mensajes')
    .insert(mensajeData)
    .select('*, remitente:usuarios!remitente_id(id, nombre, apellido, avatar_url)')
    .single()

  if (error) return { exito: false, error: 'Error al enviar mensaje' }

  const mensaje = data as unknown as Mensaje
  const preview = generarPreview(mensaje)

  await admin
    .from('conversaciones')
    .update({
      ultimo_mensaje_at: new Date().toISOString(),
      ultimo_mensaje_preview: preview,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversacionId)

  return { exito: true, datos: mensaje }
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

  const admin = createAdminClient()

  const { count } = await admin
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .neq('remitente_id', user.id)
    .eq('leido', false)

  const { data: conversaciones } = await admin
    .from('conversaciones')
    .select('id')
    .or(`participante_1.eq.${user.id},participante_2.eq.${user.id}`)

  if (!conversaciones || conversaciones.length === 0) return 0

  const convIds = conversaciones.map((c) => (c as Record<string, unknown>).id as string)

  const { count: noLeidos } = await admin
    .from('mensajes')
    .select('*', { count: 'exact', head: true })
    .in('conversacion_id', convIds)
    .neq('remitente_id', user.id)
    .eq('leido', false)

  return noLeidos || 0
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
