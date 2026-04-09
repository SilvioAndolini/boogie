'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export interface SeccionDestacada {
  id: string
  titulo: string
  subtitulo: string | null
  tipo_filtro: 'MANUAL' | 'RATING' | 'POPULAR'
  filtro_estado: string | null
  filtro_ciudad: string | null
  propiedad_ids: string[]
  orden: number
  activa: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export async function getSeccionesDestacadasPublicas() {
  const admin = createAdminClient()

  const { data: secciones, error } = await admin
    .from('secciones_destacadas')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true })

  if (error) {
    console.error('[getSeccionesDestacadasPublicas] Error:', error.message)
    return []
  }

  const resultado: (SeccionDestacada & { propiedades: unknown[] })[] = []

  for (const seccion of secciones || []) {
    let propiedades: unknown[] = []

    const selectFields = 'id, titulo, tipo_propiedad, precio_por_noche, moneda, ciudad, estado, slug, habitaciones, camas, banos, imagenes:imagenes_propiedad(url), resenas_agregado(rating_promedio, total_resenas)'

    if (seccion.tipo_filtro === 'MANUAL' && seccion.propiedad_ids?.length > 0) {
      const { data: props, error: propsError } = await admin
        .from('propiedades')
        .select(selectFields)
        .in('id', seccion.propiedad_ids)
        .eq('estado_publicacion', 'PUBLICADA')
        .order('titulo')

      if (propsError) {
        console.error('[getSeccionesDestacadasPublicas] MANUAL query error:', propsError.message, 'ids:', seccion.propiedad_ids)
      }

      propiedades = (props || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        titulo: p.titulo,
        tipoPropiedad: p.tipo_propiedad,
        precioPorNoche: Number(p.precio_por_noche),
        moneda: p.moneda,
        ciudad: p.ciudad,
        estado: p.estado,
        slug: p.slug,
        habitaciones: p.habitaciones ?? 1,
        camas: p.camas ?? 1,
        banos: p.banos ?? 1,
        imagenes: Array.isArray(p.imagenes) ? p.imagenes.map((i: Record<string, unknown>) => i.url) : [],
        ratingPromedio: (p.resenas_agregado as Record<string, unknown>)?.rating_promedio ?? 0,
        totalResenas: (p.resenas_agregado as Record<string, unknown>)?.total_resenas ?? 0,
      }))
    } else {
      let query = admin
        .from('propiedades')
        .select(selectFields)
        .eq('estado_publicacion', 'PUBLICADA')

      if (seccion.filtro_ciudad) {
        query = query.eq('ciudad', seccion.filtro_ciudad)
      } else if (seccion.filtro_estado) {
        query = query.eq('estado', seccion.filtro_estado)
      }

      if (seccion.tipo_filtro === 'RATING') {
        query = query.order('rating_promedio', { referencedTable: 'resenas_agregado', ascending: false })
      } else {
        query = query.order('total_resenas', { referencedTable: 'resenas_agregado', ascending: false })
      }

      const { data: props, error: propsError } = await query.limit(10)

      if (propsError) {
        console.error('[getSeccionesDestacadasPublicas] filter query error:', propsError.message)
      }

      propiedades = (props || []).map((p: Record<string, unknown>) => ({
        id: p.id,
        titulo: p.titulo,
        tipoPropiedad: p.tipo_propiedad,
        precioPorNoche: Number(p.precio_por_noche),
        moneda: p.moneda,
        ciudad: p.ciudad,
        estado: p.estado,
        slug: p.slug,
        habitaciones: p.habitaciones ?? 1,
        camas: p.camas ?? 1,
        banos: p.banos ?? 1,
        imagenes: Array.isArray(p.imagenes) ? p.imagenes.map((i: Record<string, unknown>) => i.url) : [],
        ratingPromedio: (p.resenas_agregado as Record<string, unknown>)?.rating_promedio ?? 0,
        totalResenas: (p.resenas_agregado as Record<string, unknown>)?.total_resenas ?? 0,
      }))
    }

    resultado.push({ ...seccion, propiedades })
  }

  return resultado
}

export async function getSeccionesDestacadasAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('secciones_destacadas')
    .select('*')
    .order('orden', { ascending: true })

  if (error) return { error: 'Error al cargar secciones' }
  return { secciones: data as SeccionDestacada[] }
}

export async function actualizarSeccionDestacada(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const id = formData.get('id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const subtitulo = (formData.get('subtitulo') as string)?.trim() || null
  const tipo_filtro = formData.get('tipo_filtro') as 'MANUAL' | 'RATING' | 'POPULAR'
  const filtro_estado = (formData.get('filtro_estado') as string)?.trim() || null
  const filtro_ciudad = (formData.get('filtro_ciudad') as string)?.trim() || null
  const propiedad_ids_raw = formData.get('propiedad_ids') as string
  const orden = parseInt(formData.get('orden') as string) || 0
  const activa = formData.get('activa') === 'true'

  if (!titulo) return { error: 'El título es obligatorio' }

  const propiedad_ids = propiedad_ids_raw
    ? propiedad_ids_raw.split(',').filter(Boolean)
    : []

  const admin = createAdminClient()

  if (id) {
    const { error } = await admin
      .from('secciones_destacadas')
      .update({
        titulo,
        subtitulo,
        tipo_filtro,
        filtro_estado: tipo_filtro !== 'MANUAL' ? filtro_estado : null,
        filtro_ciudad: tipo_filtro !== 'MANUAL' ? filtro_ciudad : null,
        propiedad_ids: tipo_filtro === 'MANUAL' ? propiedad_ids : [],
        orden,
        activa,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) return { error: 'Error al actualizar sección' }
  } else {
    const { error } = await admin
      .from('secciones_destacadas')
      .insert({
        id: crypto.randomUUID(),
        titulo,
        subtitulo,
        tipo_filtro,
        filtro_estado: tipo_filtro !== 'MANUAL' ? filtro_estado : null,
        filtro_ciudad: tipo_filtro !== 'MANUAL' ? filtro_ciudad : null,
        propiedad_ids: tipo_filtro === 'MANUAL' ? propiedad_ids : [],
        orden,
        activa,
      })

    if (error) return { error: 'Error al crear sección' }
  }

  await logAdminAction({
    accion: id ? 'ACTUALIZAR_SECCION' : 'CREAR_SECCION',
    entidad: 'seccion_destacada',
    entidadId: id || 'nueva',
    detalles: { titulo, tipo_filtro },
  })

  revalidatePath('/')
  revalidatePath('/admin/secciones')
  return { exito: true }
}

export async function eliminarSeccionDestacada(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const id = formData.get('id') as string
  if (!id) return { error: 'ID requerido' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('secciones_destacadas')
    .delete()
    .eq('id', id)

  if (error) return { error: 'Error al eliminar sección' }

  await logAdminAction({
    accion: 'ELIMINAR_SECCION',
    entidad: 'seccion_destacada',
    entidadId: id,
  })

  revalidatePath('/')
  revalidatePath('/admin/secciones')
  return { exito: true }
}

export async function buscarPropiedadesAdmin(query: string) {
  const auth = await requireAdmin()
  if (auth.error) return []

  const admin = createAdminClient()
  let q = admin
    .from('propiedades')
    .select('id, titulo, ciudad, estado, estado_publicacion, imagenes:imagenes_propiedad(url)')
    .eq('estado_publicacion', 'PUBLICADA')

  if (query && query.length >= 1) {
    q = q.or(`titulo.ilike.%${query}%,ciudad.ilike.%${query}%,estado.ilike.%${query}%`)
  }

  const { data } = await q.limit(50)

  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    titulo: p.titulo as string,
    ciudad: p.ciudad as string,
    estado: p.estado as string,
    imagen: Array.isArray(p.imagenes) && p.imagenes[0] ? (p.imagenes[0] as Record<string, unknown>).url as string : null,
  }))
}

export async function listarPropiedadesPublicadas() {
  const auth = await requireAdmin()
  if (auth.error) return []

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('propiedades')
    .select('id, titulo, ciudad, estado, imagenes:imagenes_propiedad(url)')
    .eq('estado_publicacion', 'PUBLICADA')
    .order('titulo')

  if (error) {
    console.error('[listarPropiedadesPublicadas] Error:', error.message)
    return []
  }

  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    titulo: p.titulo as string,
    ciudad: p.ciudad as string,
    estado: p.estado as string,
    imagen: Array.isArray(p.imagenes) && p.imagenes[0] ? (p.imagenes[0] as Record<string, unknown>).url as string : null,
  }))
}

export async function getPropiedadesPorIds(ids: string[]) {
  const auth = await requireAdmin()
  if (auth.error) return []

  if (!ids.length) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('propiedades')
    .select('id, titulo, ciudad, estado, imagenes:imagenes_propiedad(url)')
    .in('id', ids)

  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    titulo: p.titulo as string,
    ciudad: p.ciudad as string,
    estado: p.estado as string,
    imagen: Array.isArray(p.imagenes) && p.imagenes[0] ? (p.imagenes[0] as Record<string, unknown>).url as string : null,
  }))
}

export async function previsualizarPropiedadesPorUbicacion(tipoFiltro: string, filtroEstado?: string | null, filtroCiudad?: string | null) {
  const auth = await requireAdmin()
  if (auth.error) return []

  const admin = createAdminClient()
  let query = admin
    .from('propiedades')
    .select('id, titulo, ciudad, estado, precio_por_noche, moneda, imagenes:imagenes_propiedad(url), resenas_agregado(rating_promedio, total_resenas)')
    .eq('estado_publicacion', 'PUBLICADA')

  if (filtroCiudad) query = query.eq('ciudad', filtroCiudad)
  else if (filtroEstado) query = query.eq('estado', filtroEstado)

  if (tipoFiltro === 'RATING') {
    query = query.order('rating_promedio', { referencedTable: 'resenas_agregado', ascending: false })
  } else {
    query = query.order('total_resenas', { referencedTable: 'resenas_agregado', ascending: false })
  }

  const { data } = await query.limit(10)

  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    titulo: p.titulo as string,
    ciudad: p.ciudad as string,
    estado: p.estado as string,
    precioPorNoche: Number(p.precio_por_noche),
    moneda: p.moneda as string,
    imagen: Array.isArray(p.imagenes) && p.imagenes[0] ? (p.imagenes[0] as Record<string, unknown>).url as string : null,
    ratingPromedio: (p.resenas_agregado as Record<string, unknown>)?.rating_promedio ?? 0,
    totalResenas: (p.resenas_agregado as Record<string, unknown>)?.total_resenas ?? 0,
  }))
}
