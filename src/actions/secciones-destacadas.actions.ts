'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { goGet, goPost, goPut, goDelete, useGoBackend } from '@/lib/go-api-client'
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
  if (useGoBackend('secciones')) {
    try {
      const data = await goGet<(SeccionDestacada & { propiedades: unknown[] })[]>('/api/v1/secciones-destacadas')
      return data || []
    } catch (err) {
      console.error('[getSeccionesDestacadasPublicas] Go error:', err)
      return []
    }
  }

  try {
    const admin = createAdminClient()

    const { data: secciones, error } = await admin
      .from('secciones_destacadas')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true })

    if (error) {
      console.error('[getSeccionesDestacadasPublicas] secciones error:', error.message)
      return []
    }

    if (!secciones || secciones.length === 0) return []

    const resultado: (SeccionDestacada & { propiedades: unknown[] })[] = []

    for (const seccion of secciones) {
      let propiedades: unknown[] = []

      const propiedadIds = Array.isArray(seccion.propiedad_ids) ? seccion.propiedad_ids : []

      if (seccion.tipo_filtro === 'MANUAL' && propiedadIds.length > 0) {
        const { data: props, error: propsError } = await admin
          .from('propiedades')
          .select('id, titulo, tipo_propiedad, precio_por_noche, moneda, ciudad, estado, slug, habitaciones, camas, banos, rating_promedio, total_resenas, propietario_id')
          .in('id', propiedadIds)
          .eq('estado_publicacion', 'PUBLICADA')

        if (propsError) {
          console.error('[getSeccionesDestacadasPublicas] MANUAL error:', propsError.message, 'ids:', propiedadIds)
        }

        const propIds = (props || []).map((p: Record<string, unknown>) => p.id as string)

        const imagenesMap: Record<string, string[]> = {}
        if (propIds.length > 0) {
          const { data: imgs } = await admin
            .from('imagenes_propiedad')
            .select('propiedad_id, url')
            .in('propiedad_id', propIds)
            .order('orden', { ascending: true })

          for (const img of imgs || []) {
            const pid = (img as Record<string, unknown>).propiedad_id as string
            if (!imagenesMap[pid]) imagenesMap[pid] = []
            imagenesMap[pid].push((img as Record<string, unknown>).url as string)
          }
        }

        const propietarioIdsManual = [...new Set((props || []).map((p: Record<string, unknown>) => p.propietario_id as string).filter(Boolean))]
        const planMapManual: Record<string, string> = {}
        if (propietarioIdsManual.length > 0) {
          const { data: users } = await admin
            .from('usuarios')
            .select('id, plan_suscripcion')
            .in('id', propietarioIdsManual)
          for (const u of (users || [])) {
            planMapManual[(u as Record<string, unknown>).id as string] = (u as Record<string, unknown>).plan_suscripcion as string || 'FREE'
          }
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
          imagenes: imagenesMap[p.id as string] || [],
          ratingPromedio: (p.rating_promedio as number) ?? 0,
          totalResenas: (p.total_resenas as number) ?? 0,
          planPropietario: planMapManual[p.propietario_id as string] || 'FREE',
        }))
      } else {
        let query = admin
          .from('propiedades')
          .select('id, titulo, tipo_propiedad, precio_por_noche, moneda, ciudad, estado, slug, habitaciones, camas, banos, rating_promedio, total_resenas, propietario_id')
          .eq('estado_publicacion', 'PUBLICADA')

        if (seccion.filtro_ciudad) {
          query = query.eq('ciudad', seccion.filtro_ciudad)
        } else if (seccion.filtro_estado) {
          query = query.eq('estado', seccion.filtro_estado)
        }

        if (seccion.tipo_filtro === 'RATING') {
          query = query.order('rating_promedio', { ascending: false, nullsFirst: false })
        } else {
          query = query.order('total_resenas', { ascending: false })
        }

        const { data: props, error: propsError } = await query.limit(10)

        if (propsError) {
          console.error('[getSeccionesDestacadasPublicas] filter error:', propsError.message)
        }

        const propIds = (props || []).map((p: Record<string, unknown>) => p.id as string)

        const imagenesMap: Record<string, string[]> = {}
        if (propIds.length > 0) {
          const { data: imgs } = await admin
            .from('imagenes_propiedad')
            .select('propiedad_id, url')
            .in('propiedad_id', propIds)
            .order('orden', { ascending: true })

          for (const img of imgs || []) {
            const pid = (img as Record<string, unknown>).propiedad_id as string
            if (!imagenesMap[pid]) imagenesMap[pid] = []
            imagenesMap[pid].push((img as Record<string, unknown>).url as string)
          }
        }

        const propietarioIds = [...new Set((props || []).map((p: Record<string, unknown>) => p.propietario_id as string).filter(Boolean))]
        const planMap: Record<string, string> = {}
        if (propietarioIds.length > 0) {
          const { data: users } = await admin
            .from('usuarios')
            .select('id, plan_suscripcion')
            .in('id', propietarioIds)
          for (const u of (users || [])) {
            planMap[(u as Record<string, unknown>).id as string] = (u as Record<string, unknown>).plan_suscripcion as string || 'FREE'
          }
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
          imagenes: imagenesMap[p.id as string] || [],
          ratingPromedio: (p.rating_promedio as number) ?? 0,
          totalResenas: (p.total_resenas as number) ?? 0,
          planPropietario: planMap[p.propietario_id as string] || 'FREE',
        }))
      }

      resultado.push({ ...seccion, propiedades })
    }

    return resultado
  } catch (err) {
    console.error('[getSeccionesDestacadasPublicas] Exception:', err)
    return []
  }
}

export async function getSeccionesDestacadasAdmin() {
  const authResult = await requireAdmin()
  if (authResult.error) return { error: authResult.error }

  if (useGoBackend('secciones')) {
    try {
      const secciones = await goGet<SeccionDestacada[]>('/api/v1/admin/secciones-destacadas')
      return { secciones: secciones || [] }
    } catch (err: any) {
      return { error: err.message || 'Error al cargar secciones' }
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('secciones_destacadas')
    .select('*')
    .order('orden', { ascending: true })

  if (error) return { error: 'Error al cargar secciones' }
  return { secciones: data as SeccionDestacada[] }
}

export async function actualizarSeccionDestacada(formData: FormData) {
  const authResult = await requireAdmin()
  if (authResult.error) return { error: authResult.error }

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

  if (useGoBackend('secciones')) {
    try {
      const body = {
        id: id || undefined,
        titulo,
        subtitulo,
        tipo_filtro,
        filtro_estado: tipo_filtro !== 'MANUAL' ? filtro_estado : null,
        filtro_ciudad: tipo_filtro !== 'MANUAL' ? filtro_ciudad : null,
        propiedad_ids: tipo_filtro === 'MANUAL' ? propiedad_ids : [],
        orden,
        activa,
      }
      if (id) {
        await goPut('/api/v1/admin/secciones-destacadas', body)
      } else {
        await goPost('/api/v1/admin/secciones-destacadas', body)
      }
      revalidatePath('/')
      revalidatePath('/admin/secciones')
      return { exito: true }
    } catch (err: any) {
      return { error: err.message || 'Error al guardar seccion' }
    }
  }

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
  const authResult = await requireAdmin()
  if (authResult.error) return { error: authResult.error }

  const id = formData.get('id') as string
  if (!id) return { error: 'ID requerido' }

  if (useGoBackend('secciones')) {
    try {
      await goDelete(`/api/v1/admin/secciones-destacadas?id=${id}`)
      revalidatePath('/')
      revalidatePath('/admin/secciones')
      return { exito: true }
    } catch (err: any) {
      return { error: err.message || 'Error al eliminar sección' }
    }
  }

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
  const authResult = await requireAdmin()
  if (authResult.error) return []

  if (useGoBackend('secciones')) {
    try {
      const data = await goGet<{ id: string; titulo: string; ciudad: string | null; estado: string | null; imagen: string | null }[]>(
        `/api/v1/admin/secciones-destacadas/propiedades?q=${encodeURIComponent(query || '')}`
      )
      return data || []
    } catch {
      return []
    }
  }

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
  const authResult = await requireAdmin()
  if (authResult.error) return []

  if (useGoBackend('secciones')) {
    try {
      const data = await goGet<{ id: string; titulo: string; ciudad: string | null; estado: string | null; imagen: string | null }[]>(
        `/api/v1/admin/secciones-destacadas/propiedades?q=`
      )
      return data || []
    } catch {
      return []
    }
  }

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
  const authResult = await requireAdmin()
  if (authResult.error) return []

  if (!ids.length) return []

  if (useGoBackend('secciones')) {
    try {
      const data = await goGet(`/api/v1/admin/secciones-destacadas/propiedades/por-ids?ids=${ids.join(',')}`)
      return data || []
    } catch {
      return []
    }
  }

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
  const authResult = await requireAdmin()
  if (authResult.error) return []

  if (useGoBackend('secciones')) {
    try {
      const params = new URLSearchParams({ tipoFiltro })
      if (filtroEstado) params.set('filtroEstado', filtroEstado)
      if (filtroCiudad) params.set('filtroCiudad', filtroCiudad)
      const data = await goGet(`/api/v1/admin/secciones-destacadas/propiedades/preview?${params}`)
      return data || []
    } catch {
      return []
    }
  }

  const admin = createAdminClient()
  let query = admin
    .from('propiedades')
    .select('id, titulo, ciudad, estado, precio_por_noche, moneda, rating_promedio, total_resenas, imagenes:imagenes_propiedad(url)')
    .eq('estado_publicacion', 'PUBLICADA')

  if (filtroCiudad) query = query.eq('ciudad', filtroCiudad)
  else if (filtroEstado) query = query.eq('estado', filtroEstado)

  if (tipoFiltro === 'RATING') {
    query = query.order('rating_promedio', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('total_resenas', { ascending: false })
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
    ratingPromedio: (p.rating_promedio as number) ?? 0,
    totalResenas: (p.total_resenas as number) ?? 0,
  }))
}
