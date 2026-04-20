'use server'

import * as Sentry from '@sentry/nextjs'

import { requireAdmin } from '@/lib/admin-auth'
import { goGet, goPost, goPut, goDelete } from '@/lib/go-api-client'
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
  try {
    const data = await goGet<(SeccionDestacada & { propiedades: unknown[] })[]>('/api/v1/secciones-destacadas')
    return data || []
  } catch (err) {
      Sentry.captureException(err)
    console.error('[getSeccionesDestacadasPublicas] Go error:', err)
    return []
  }
}

export async function getSeccionesDestacadasAdmin() {
  const authResult = await requireAdmin()
  if (authResult.error) return { error: authResult.error }

  try {
    const secciones = await goGet<SeccionDestacada[]>('/api/v1/admin/secciones-destacadas')
    return { secciones: secciones || [] }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { error: err instanceof Error ? err.message : 'Error al cargar secciones' }
  }
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
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { error: err instanceof Error ? err.message : 'Error al guardar seccion' }
  }
}

export async function eliminarSeccionDestacada(formData: FormData) {
  const authResult = await requireAdmin()
  if (authResult.error) return { error: authResult.error }

  const id = formData.get('id') as string
  if (!id) return { error: 'ID requerido' }

  try {
    await goDelete(`/api/v1/admin/secciones-destacadas?id=${id}`)
    revalidatePath('/')
    revalidatePath('/admin/secciones')
    return { exito: true }
  } catch (err: unknown) {
      Sentry.captureException(err)
    return { error: err instanceof Error ? err.message : 'Error al eliminar sección' }
  }
}

export async function buscarPropiedadesAdmin(query: string) {
  const authResult = await requireAdmin()
  if (authResult.error) return []

  try {
    const data = await goGet<{ id: string; titulo: string; ciudad: string | null; estado: string | null; imagen: string | null }[]>(
      `/api/v1/admin/secciones-destacadas/propiedades?q=${encodeURIComponent(query || '')}`
    )
    return data || []
  } catch {
    return []
  }
}

export async function listarPropiedadesPublicadas() {
  const authResult = await requireAdmin()
  if (authResult.error) return []

  try {
    const data = await goGet<{ id: string; titulo: string; ciudad: string | null; estado: string | null; imagen: string | null }[]>(
      `/api/v1/admin/secciones-destacadas/propiedades?q=`
    )
    return data || []
  } catch {
    return []
  }
}

export async function getPropiedadesPorIds(ids: string[]) {
  const authResult = await requireAdmin()
  if (authResult.error) return []
  if (!ids.length) return []

  try {
    const data = await goGet(`/api/v1/admin/secciones-destacadas/propiedades/por-ids?ids=${ids.join(',')}`)
    return data || []
  } catch {
    return []
  }
}

export async function previsualizarPropiedadesPorUbicacion(tipoFiltro: string, filtroEstado?: string | null, filtroCiudad?: string | null) {
  const authResult = await requireAdmin()
  if (authResult.error) return []

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
