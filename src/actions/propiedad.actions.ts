'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { goGet, goPatch, goDelete, goFetch, getAuthToken } from '@/lib/go-api-client'
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

  const token = await getAuthToken()
  const baseUrl = process.env.GO_BACKEND_URL || 'http://localhost:8080'

  const res = await fetch(`${baseUrl}/api/v1/propiedades/${propiedadId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json()

  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error
    return { error: err?.message || 'Error al actualizar el boogie' }
  }

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

  try {
    return await goGet<{
      datos: PropiedadPublica[];
      total: number;
      pagina: number;
      porPagina: number;
      totalPaginas: number;
    }>(`/api/v1/propiedades/publicas?${params.toString()}`)
  } catch {
    return { datos: [], total: 0, pagina: 1, porPagina: 20, totalPaginas: 0 }
  }
}

export async function getPropiedadPorId(id: string): Promise<PropiedadDetalle | null> {
  try {
    return await goGet<PropiedadDetalle>(`/api/v1/propiedades/${id}`)
  } catch {
    return null
  }
}
