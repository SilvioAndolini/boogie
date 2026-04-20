'use server'

import * as Sentry from '@sentry/nextjs'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { goGet, goPost, goPut, goPatch, goDelete, goFetch, getAuthToken } from '@/lib/go-api-client'
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
  categoria?: string
  tipoCancha?: string | null
  precioPorHora?: number | null
  esExpress?: boolean
  precioExpress?: number | null
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
  tipoCancha?: string | null
  precioPorHora?: number | null
  horaApertura?: string | null
  horaCierre?: string | null
  duracionMinimaMin?: number | null
  esExpress?: boolean
  precioExpress?: number | null
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
  categoria?: string
  tipo_cancha?: string | null
  precio_por_hora?: number | null
  es_express?: boolean
  precio_express?: number | null
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
  tipo_cancha?: string | null
  precio_por_hora?: number | null
  hora_apertura?: string | null
  hora_cierre?: string | null
  duracion_minima_min?: number | null
  es_express?: boolean
  precio_express?: number | null
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
    categoria: item.categoria || 'ALOJAMIENTO',
    tipoCancha: item.tipo_cancha ?? null,
    precioPorHora: item.precio_por_hora ?? null,
    esExpress: item.es_express ?? false,
    precioExpress: item.precio_express ?? null,
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
    tipoCancha: d.tipo_cancha ?? null,
    precioPorHora: d.precio_por_hora ?? null,
    horaApertura: d.hora_apertura ?? null,
    horaCierre: d.hora_cierre ?? null,
    duracionMinimaMin: d.duracion_minima_min ?? null,
    esExpress: d.es_express ?? false,
    precioExpress: d.precio_express ?? null,
  }
}

export async function crearPropiedad(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/login')

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const tipoPropiedad = formData.get('tipoPropiedad') as string
  const precioPorNoche = parseFloat(formData.get('precioPorNoche') as string) || 0
  const moneda = (formData.get('moneda') as string) || 'USD'
  const capacidadMaxima = parseInt(formData.get('capacidadMaxima') as string) || 1
  const habitaciones = parseInt(formData.get('habitaciones') as string) || 1
  const banos = parseInt(formData.get('banos') as string) || 1
  const camas = parseInt(formData.get('camas') as string) || 1
  const direccion = formData.get('direccion') as string
  const ciudad = formData.get('ciudad') as string
  const estado = formData.get('estado') as string
  const zona = (formData.get('zona') as string) || null
  const latitud = formData.get('latitud') ? parseFloat(formData.get('latitud') as string) : null
  const longitud = formData.get('longitud') ? parseFloat(formData.get('longitud') as string) : null
  const reglas = (formData.get('reglas') as string) || null
  const politicaCancelacion = (formData.get('politicaCancelacion') as string) || 'MODERADA'
  const horarioCheckIn = (formData.get('horarioCheckIn') as string) || '14:00'
  const horarioCheckOut = (formData.get('horarioCheckOut') as string) || '11:00'
  const estanciaMinima = parseInt(formData.get('estanciaMinima') as string) || 1
  const estanciaMaxima = formData.get('estanciaMaxima') ? parseInt(formData.get('estanciaMaxima') as string) : null
  const categoria = (formData.get('categoria') as string) || 'ALOJAMIENTO'
  const tipoCancha = (formData.get('tipoCancha') as string) || null
  const precioPorHora = formData.get('precioPorHora') ? parseFloat(formData.get('precioPorHora') as string) : null
  const horaApertura = (formData.get('horaApertura') as string) || null
  const horaCierre = (formData.get('horaCierre') as string) || null
  const duracionMinimaMin = formData.get('duracionMinimaMin') ? parseInt(formData.get('duracionMinimaMin') as string) : null
  const esExpress = formData.get('esExpress') === 'true'
  const precioExpress = formData.get('precioExpress') ? parseFloat(formData.get('precioExpress') as string) : null

  const amenidades = formData.getAll('amenidades') as string[]
  const imagenCategorias = formData.getAll('imagen_categorias') as string[]
  const imagenFiles = formData.getAll('imagenes') as File[]

  let result: { id: string; slug: string }
  try {
    result = await goPost('/api/v1/propiedades', {
      titulo,
      descripcion,
      tipoPropiedad,
      precioPorNoche,
      moneda,
      capacidadMaxima,
      habitaciones,
      banos,
      camas,
      direccion,
      ciudad,
      estado,
      zona,
      latitud,
      longitud,
      reglas,
      politicaCancelacion,
      horarioCheckIn,
      horarioCheckOut,
      estanciaMinima,
      estanciaMaxima,
      categoria,
      tipoCancha,
      precioPorHora,
      horaApertura,
      horaCierre,
      duracionMinimaMin,
      esExpress,
      precioExpress,
      amenidades,
    })
  } catch (e: unknown) {
      Sentry.captureException(e)
    const msg = e instanceof Error ? e.message : 'Error al crear el boogie'
    return { error: msg }
  }

  const propiedadId = result.id

  if (imagenFiles.length > 0) {
    const supabase = createAdminClient()
    const bucket = 'imagenes'
    const imagenes: { url: string; categoria: string; orden: number }[] = []

    const uploadResults = await Promise.all(
      imagenFiles.map(async (file, i) => {
        const ext = file.name.replace(/.*\./, '.') || '.webp'
        const path = `propiedades/${propiedadId}/${Date.now()}-${i}${ext}`
        const arrayBuffer = await file.arrayBuffer()
        const uint8 = new Uint8Array(arrayBuffer)

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, uint8, { contentType: file.type || 'image/webp', upsert: false })

        if (uploadError) {
          console.error('[crearPropiedad] upload error:', uploadError)
          return null
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
        return { url: urlData?.publicUrl || '', categoria: imagenCategorias[i] || 'otro', orden: i }
      })
    )

    for (const result of uploadResults) {
      if (result) imagenes.push(result)
    }

    if (imagenes.length > 0) {
      try {
        await goPost(`/api/v1/propiedades/${propiedadId}/imagenes`, { imagenes })
      } catch (e: unknown) {
          Sentry.captureException(e)
        console.error('[crearPropiedad] error saving image records:', e)
      }
    }
  }

  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true, id: propiedadId }
}

export async function eliminarPropiedad(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    await goDelete(`/api/v1/propiedades/${propiedadId}`)
  } catch (e: unknown) {
      Sentry.captureException(e)
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
      Sentry.captureException(e)
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

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const tipoPropiedad = formData.get('tipoPropiedad') as string
  const precioPorNoche = parseFloat(formData.get('precioPorNoche') as string) || 0
  const moneda = (formData.get('moneda') as string) || 'USD'
  const capacidadMaxima = parseInt(formData.get('capacidadMaxima') as string) || 1
  const habitaciones = parseInt(formData.get('habitaciones') as string) || 1
  const banos = parseInt(formData.get('banos') as string) || 1
  const camas = parseInt(formData.get('camas') as string) || 1
  const direccion = formData.get('direccion') as string
  const ciudad = formData.get('ciudad') as string
  const estado = formData.get('estado') as string
  const zona = (formData.get('zona') as string) || null
  const latitud = formData.get('latitud') ? parseFloat(formData.get('latitud') as string) : null
  const longitud = formData.get('longitud') ? parseFloat(formData.get('longitud') as string) : null
  const reglas = (formData.get('reglas') as string) || null
  const politicaCancelacion = (formData.get('politicaCancelacion') as string) || 'MODERADA'
  const horarioCheckIn = (formData.get('horarioCheckIn') as string) || '14:00'
  const horarioCheckOut = (formData.get('horarioCheckOut') as string) || '11:00'
  const estanciaMinima = parseInt(formData.get('estanciaMinima') as string) || 1
  const estanciaMaxima = formData.get('estanciaMaxima') ? parseInt(formData.get('estanciaMaxima') as string) : null
  const categoria = (formData.get('categoria') as string) || 'ALOJAMIENTO'
  const tipoCancha = (formData.get('tipoCancha') as string) || null
  const precioPorHora = formData.get('precioPorHora') ? parseFloat(formData.get('precioPorHora') as string) : null
  const horaApertura = (formData.get('horaApertura') as string) || null
  const horaCierre = (formData.get('horaCierre') as string) || null
  const duracionMinimaMin = formData.get('duracionMinimaMin') ? parseInt(formData.get('duracionMinimaMin') as string) : null
  const esExpress = formData.get('esExpress') === 'true'
  const precioExpress = formData.get('precioExpress') ? parseFloat(formData.get('precioExpress') as string) : null

  const amenidades = formData.getAll('amenidades') as string[]
  const imagenCategorias = formData.getAll('imagen_categorias') as string[]
  const imagenFiles = formData.getAll('imagenes') as File[]
  const existentesCategorias = formData.getAll('existentes_categorias') as string[]
  const imagenIds = formData.getAll('imagen_ids') as string[]

  try {
    await goPut(`/api/v1/propiedades/${propiedadId}`, {
      titulo,
      descripcion,
      tipoPropiedad,
      precioPorNoche,
      moneda,
      capacidadMaxima,
      habitaciones,
      banos,
      camas,
      direccion,
      ciudad,
      estado,
      zona,
      latitud,
      longitud,
      reglas,
      politicaCancelacion,
      horarioCheckIn,
      horarioCheckOut,
      estanciaMinima,
      estanciaMaxima,
      categoria,
      tipoCancha,
      precioPorHora,
      horaApertura,
      horaCierre,
      duracionMinimaMin,
      esExpress,
      precioExpress,
      amenidades,
    })
  } catch (e: unknown) {
      Sentry.captureException(e)
    const msg = e instanceof Error ? e.message : 'Error al actualizar el boogie'
    return { error: msg }
  }

  const imageUpdates: { id: string; categoria?: string; eliminar?: boolean }[] = []
  if (existentesCategorias.length > 0 && imagenIds.length > 0) {
    for (let i = 0; i < imagenIds.length; i++) {
      imageUpdates.push({ id: imagenIds[i], categoria: existentesCategorias[i] || 'otro' })
    }
  }
  if (imageUpdates.length > 0) {
    try {
      await goPut(`/api/v1/propiedades/${propiedadId}/imagenes`, { updates: imageUpdates })
    } catch (e: unknown) {
        Sentry.captureException(e)
      console.error('[actualizarPropiedad] error updating image categories:', e)
    }
  }

  if (imagenFiles.length > 0) {
    const supabase = createAdminClient()
    const bucket = 'imagenes'
    const imagenes: { url: string; categoria: string; orden: number }[] = []

    const uploadResults = await Promise.all(
      imagenFiles.map(async (file, i) => {
        const ext = file.name.replace(/.*\./, '.') || '.webp'
        const path = `propiedades/${propiedadId}/${Date.now()}-${i}${ext}`
        const arrayBuffer = await file.arrayBuffer()
        const uint8 = new Uint8Array(arrayBuffer)

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, uint8, { contentType: file.type || 'image/webp', upsert: false })

        if (uploadError) {
          console.error('[actualizarPropiedad] upload error:', uploadError)
          return null
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
        return { url: urlData?.publicUrl || '', categoria: imagenCategorias[i] || 'otro', orden: imagenIds.length + i }
      })
    )

    for (const result of uploadResults) {
      if (result) imagenes.push(result)
    }

    if (imagenes.length > 0) {
      try {
        await goPost(`/api/v1/propiedades/${propiedadId}/imagenes`, { imagenes })
      } catch (e: unknown) {
          Sentry.captureException(e)
        console.error('[actualizarPropiedad] error saving new image records:', e)
      }
    }
  }

  revalidatePath('/dashboard/mis-propiedades')
  revalidatePath(`/propiedades/${propiedadId}`)
  revalidatePath(`/canchas/${propiedadId}`)
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
  categoria?: string
  tipoCancha?: string
  esExpress?: boolean
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
  if (filtros?.categoria) params.set('categoria', filtros.categoria)
  if (filtros?.tipoCancha) params.set('tipoCancha', filtros.tipoCancha)
  if (filtros?.esExpress) params.set('esExpress', 'true')

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
