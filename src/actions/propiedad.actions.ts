'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { goGet, goPatch, goDelete, goFetch, getAuthToken } from '@/lib/go-api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'

interface PropiedadPublica {
  id: string
  titulo: string
  descripcion: string
  tipoPropiedad: string
  precioPorNoche: string | number
  moneda: string
  capacidadMaxima: number
  habitaciones: number
  banos: number
  camas: number
  direccion: string
  ciudad: string
  estado: string
  zona: string | null
  latitud: number | null
  longitud: number | null
  ratingPromedio: number | null
  totalResenas: number
  imagenes: { url: string; es_principal: boolean }[]
  propietario: { reputacion: number | null; plan_suscripcion: string } | null
}

interface PropiedadDetalle {
  id: string
  titulo: string
  descripcion: string
  tipoPropiedad: string
  precioPorNoche: string | number
  moneda: string
  capacidadMaxima: number
  habitaciones: number
  banos: number
  camas: number
  direccion: string
  ciudad: string
  estado: string
  zona: string | null
  latitud: number | null
  longitud: number | null
  reglas: string | null
  politicaCancelacion: string
  horarioCheckIn: string | null
  horarioCheckOut: string | null
  estanciaMinima: number
  estanciaMaxima: number | null
  ratingPromedio: number | null
  totalResenas: number
  propietario: { id: string; nombre: string; apellido: string; avatar_url: string | null; verificado: boolean; plan_suscripcion: string; bio: string | null; reputacion: number | null; reputacionManual: boolean } | null
  imagenes: { id: string; url: string; alt: string | null; orden: number; es_principal: boolean; categoria: string }[]
  amenidades: { amenidadId: string; amenidad: { id: string; nombre: string; icono: string | null; categoria: string } }[]
  resenas: { id: string; calificacion: number; comentario: string; fechaCreacion: string; autor: { nombre: string; apellido: string; avatar_url: string | null } }[]
}

interface GoPropiedadItem {
  id: string
  titulo: string
  tipo_propiedad: string
  precio_por_noche: number
  moneda: string
  capacidad: number
  dormitorios: number
  banos: number
  ciudad: string
  estado: string
  latitud: number | null
  longitud: number | null
  calificacion: number
  total_resenas: number
  imagen_principal: string | null
  plan_suscripcion: string | null
}

interface GoPropiedadDetail {
  id: string
  propietario_id: string
  titulo: string
  slug: string
  descripcion: string
  tipo_propiedad: string
  precio_por_noche: number
  moneda: string
  politica_cancelacion: string
  capacidad: number
  dormitorios: number
  banos: number
  camas: number
  direccion: string
  ciudad: string
  estado: string
  zona: string | null
  latitud: number
  longitud: number
  reglas: string | null
  check_in: string | null
  check_out: string | null
  estancia_minima: number
  estancia_maxima: number | null
  estado_publicacion: string
  calificacion: number
  cantidad_resenas: number
  propietario: {
    id: string
    nombre: string
    apellido: string
    avatar_url: string | null
    verificado: boolean
    plan_suscripcion: string
    bio: string | null
    reputacion: number
  } | null
  amenidades: {
    id: string
    nombre: string
    icono: string | null
    categoria: string
  }[] | null
  imagenes: {
    id: string
    propiedad_id: string
    url: string
    thumbnail_url: string | null
    alt: string | null
    categoria: string
    orden: number
  }[] | null
}

function mapPropiedadItem(item: GoPropiedadItem): PropiedadPublica {
  return {
    id: item.id,
    titulo: item.titulo,
    descripcion: '',
    tipoPropiedad: item.tipo_propiedad,
    precioPorNoche: item.precio_por_noche,
    moneda: item.moneda,
    capacidadMaxima: item.capacidad,
    habitaciones: item.dormitorios,
    banos: item.banos,
    camas: 0,
    direccion: '',
    ciudad: item.ciudad,
    estado: item.estado,
    zona: null,
    latitud: item.latitud,
    longitud: item.longitud,
    ratingPromedio: item.calificacion || null,
    totalResenas: item.total_resenas,
    imagenes: item.imagen_principal ? [{ url: item.imagen_principal, es_principal: true }] : [],
    propietario: item.plan_suscripcion ? { reputacion: null, plan_suscripcion: item.plan_suscripcion } : null,
  }
}

function mapPropiedadDetail(d: GoPropiedadDetail): PropiedadDetalle {
  const imagenes = (d.imagenes || []).map((img) => ({
    id: img.id,
    url: img.url,
    alt: img.alt,
    orden: img.orden,
    es_principal: img.orden === 0,
    categoria: img.categoria,
  }))

  const amenidades = (d.amenidades || []).map((a) => ({
    amenidadId: a.id,
    amenidad: { id: a.id, nombre: a.nombre, icono: a.icono, categoria: a.categoria },
  }))

  const propietario = d.propietario
    ? {
        id: d.propietario.id,
        nombre: d.propietario.nombre,
        apellido: d.propietario.apellido,
        avatar_url: d.propietario.avatar_url,
        verificado: d.propietario.verificado,
        plan_suscripcion: d.propietario.plan_suscripcion,
        bio: d.propietario.bio,
        reputacion: d.propietario.reputacion || null,
        reputacionManual: false,
      }
    : null

  return {
    id: d.id,
    titulo: d.titulo,
    descripcion: d.descripcion,
    tipoPropiedad: d.tipo_propiedad,
    precioPorNoche: d.precio_por_noche,
    moneda: d.moneda,
    capacidadMaxima: d.capacidad,
    habitaciones: d.dormitorios,
    banos: d.banos,
    camas: d.camas,
    direccion: d.direccion,
    ciudad: d.ciudad,
    estado: d.estado,
    zona: d.zona,
    latitud: d.latitud,
    longitud: d.longitud,
    reglas: d.reglas,
    politicaCancelacion: d.politica_cancelacion,
    horarioCheckIn: d.check_in,
    horarioCheckOut: d.check_out,
    estanciaMinima: d.estancia_minima,
    estanciaMaxima: d.estancia_maxima,
    ratingPromedio: d.calificacion || null,
    totalResenas: d.cantidad_resenas,
    propietario,
    imagenes,
    amenidades,
    resenas: [],
  }
}

export async function crearPropiedad(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/login')

  const token = await getAuthToken()
  const baseUrl = process.env.GO_BACKEND_URL || 'http://localhost:8080'

  const res = await fetch(`${baseUrl}/api/v1/propiedades`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json()

  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error
    return { error: err?.message || 'Error al crear el boogie' }
  }

  const propiedadId = ((data as { data?: { id?: string } }).data ?? data)?.id

  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true, id: propiedadId }
}

export async function eliminarPropiedad(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    await goDelete(`/api/v1/propiedades/${propiedadId}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al eliminar el boogie'
    return { error: msg }
  }

  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true }
}

export async function actualizarEstadoPropiedad(propiedadId: string, estado: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    await goPatch(`/api/v1/propiedades/${propiedadId}/estado`, { estado })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al actualizar'
    return { error: msg }
  }

  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true }
}

export async function getBoogieParaEditar(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return null

  try {
    return await goGet<Record<string, unknown> | null>(`/api/v1/propiedades/${propiedadId}/editar`)
  } catch {
    return null
  }
}

export async function actualizarPropiedad(propiedadId: string, formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const existentesCategorias = formData.getAll('existentes_categorias') as string[]
  const imagenIds = formData.getAll('imagen_ids') as string[]

  if (existentesCategorias.length > 0 && imagenIds.length > 0) {
    const supabase = createAdminClient()
    const updates = imagenIds.map((id, i) =>
      supabase.from('imagenes_propiedad').update({ categoria: existentesCategorias[i] || 'otro' }).eq('id', id)
    )
    await Promise.all(updates)
  }

  const token = await getAuthToken()
  const baseUrl = process.env.GO_BACKEND_URL || 'http://localhost:8080'

  const res = await fetch(`${baseUrl}/api/v1/propiedades/${propiedadId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true }
}

export async function getMisPropiedades() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  try {
    return await goGet<PropiedadPublica[]>('/api/v1/propiedades/mias')
  } catch {
    return []
  }
}

export async function getPropiedadesPublicas(filtros?: {
  ubicacion?: string
  lat?: number
  lng?: number
  radio?: number
  precioMin?: number
  precioMax?: number
  huespedes?: number
  tipoPropiedad?: string
  habitaciones?: number
  banos?: number
  amenidades?: string[]
  ordenarPor?: string
  pagina?: number
  porPagina?: number
}) {
  const params = new URLSearchParams()

  if (filtros?.ubicacion) params.set('ubicacion', filtros.ubicacion)
  if (filtros?.lat != null) params.set('lat', String(filtros.lat))
  if (filtros?.lng != null) params.set('lng', String(filtros.lng))
  if (filtros?.radio != null) params.set('radio', String(filtros.radio))
  if (filtros?.precioMin != null) params.set('precioMin', String(filtros.precioMin))
  if (filtros?.precioMax != null) params.set('precioMax', String(filtros.precioMax))
  if (filtros?.huespedes != null) params.set('huespedes', String(filtros.huespedes))
  if (filtros?.tipoPropiedad) params.set('tipoPropiedad', filtros.tipoPropiedad)
  if (filtros?.habitaciones != null) params.set('habitaciones', String(filtros.habitaciones))
  if (filtros?.banos != null) params.set('banos', String(filtros.banos))
  if (filtros?.amenidades && filtros.amenidades.length > 0) params.set('amenidades', filtros.amenidades.join(','))
  if (filtros?.ordenarPor) params.set('ordenarPor', filtros.ordenarPor)
  if (filtros?.pagina != null) params.set('pagina', String(filtros.pagina))
  if (filtros?.porPagina != null) params.set('porPagina', String(filtros.porPagina))

  try {
    const raw = await goFetch<{
      data?: GoPropiedadItem[]
      meta?: { page: number; perPage: number; total: number }
    }>(`/api/v1/propiedades/publicas?${params.toString()}`, { raw: true })

    const items = raw.data ?? (raw as unknown as GoPropiedadItem[])
    const meta = raw.meta ?? { page: 1, perPage: 20, total: 0 }
    const datos = (items || []).map(mapPropiedadItem)

    return {
      datos,
      total: meta.total,
      pagina: meta.page,
      porPagina: meta.perPage,
      totalPaginas: meta.total > 0 ? Math.ceil(meta.total / meta.perPage) : 0,
    }
  } catch {
    return { datos: [], total: 0, pagina: 1, porPagina: 20, totalPaginas: 0 }
  }
}

export async function getPropiedadPorId(id: string): Promise<PropiedadDetalle | null> {
  try {
    const raw = await goFetch<GoPropiedadDetail>(`/api/v1/propiedades/${id}`)
    if (!raw) return null
    return mapPropiedadDetail(raw)
  } catch {
    return null
  }
}
