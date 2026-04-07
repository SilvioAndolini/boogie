// Acciones del servidor para propiedades
'use server'

import { revalidatePath, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { propiedadSchema } from '@/lib/validations'
import { CACHE_TAGS, CACHE_TIMES, invalidatePropiedadCache } from '@/lib/cache'
import { getUsuarioAutenticado } from '@/lib/auth'

// --- Tipos de retorno para las queries públicas ---

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
  propietario: { id: string; nombre: string; apellido: string; avatar_url: string | null; verificado: boolean } | null
  imagenes: { id: string; url: string; alt: string | null; orden: number; es_principal: boolean }[]
  amenidades: { amenidadId: string; amenidad: { id: string; nombre: string; icono: string | null; categoria: string } }[]
  resenas: { id: string; calificacion: number; comentario: string; fechaCreacion: string; autor: { nombre: string; apellido: string; avatar_url: string | null } }[]
}

/**
 * Crea una nueva propiedad
 */
export async function crearPropiedad(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) redirect('/login')

  const datos = {
    titulo: formData.get('titulo') as string,
    descripcion: formData.get('descripcion') as string,
    tipoPropiedad: formData.get('tipoPropiedad') as string,
    precioPorNoche: formData.get('precioPorNoche') as string,
    moneda: (formData.get('moneda') as string) || 'USD',
    capacidadMaxima: formData.get('capacidadMaxima') as string,
    habitaciones: formData.get('habitaciones') as string,
    banos: formData.get('banos') as string,
    camas: formData.get('camas') as string,
    direccion: formData.get('direccion') as string,
    ciudad: formData.get('ciudad') as string,
    estado: formData.get('estado') as string,
    zona: formData.get('zona') as string || undefined,
    latitud: formData.get('latitud') as string || undefined,
    longitud: formData.get('longitud') as string || undefined,
    reglas: formData.get('reglas') as string || undefined,
    politicaCancelacion: (formData.get('politicaCancelacion') as string) || 'MODERADA',
    horarioCheckIn: (formData.get('horarioCheckIn') as string) || '14:00',
    horarioCheckOut: (formData.get('horarioCheckOut') as string) || '11:00',
    estanciaMinima: formData.get('estanciaMinima') as string,
    estanciaMaxima: formData.get('estanciaMaxima') as string || undefined,
    amenidades: formData.getAll('amenidades') as string[],
  }

  const validacion = propiedadSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const data = validacion.data

  // Crear la propiedad
  const propiedad = await prisma.propiedad.create({
    data: {
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipoPropiedad: data.tipoPropiedad,
      precioPorNoche: data.precioPorNoche,
      moneda: data.moneda,
      capacidadMaxima: data.capacidadMaxima,
      habitaciones: data.habitaciones,
      banos: data.banos,
      camas: data.camas,
      direccion: data.direccion,
      ciudad: data.ciudad,
      estado: data.estado,
      zona: data.zona,
      latitud: data.latitud,
      longitud: data.longitud,
      reglas: data.reglas,
      politicaCancelacion: data.politicaCancelacion,
      horarioCheckIn: data.horarioCheckIn,
      horarioCheckOut: data.horarioCheckOut,
      estanciaMinima: data.estanciaMinima,
      estanciaMaxima: data.estanciaMaxima,
      propietarioId: user.id,
      estadoPublicacion: 'BORRADOR',
    },
  })

  if (data.amenidades.length > 0) {
    for (const nombre of data.amenidades) {
      const amenidad = await prisma.amenidad.upsert({
        where: { nombre },
        update: {},
        create: { nombre, categoria: 'ESENCIALES' },
      })
      await prisma.propiedadAmenidad.create({
        data: { propiedadId: propiedad.id, amenidadId: amenidad.id },
      })
    }
  }

  await invalidatePropiedadCache(propiedad.id)
  revalidatePath('/dashboard/mis-propiedades')
  redirect(`/dashboard/mis-propiedades`)
}

/**
 * Actualiza el estado de publicación de una propiedad
 */
export async function actualizarEstadoPropiedad(propiedadId: string, estado: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const propiedad = await prisma.propiedad.findFirst({
    where: { id: propiedadId, propietarioId: user.id },
  })

  if (!propiedad) return { error: 'Propiedad no encontrada' }

  await prisma.propiedad.update({
    where: { id: propiedadId },
    data: {
      estadoPublicacion: estado as 'PUBLICADA' | 'PAUSADA' | 'BORRADOR',
      fechaPublicacion: estado === 'PUBLICADA' ? new Date() : undefined,
    },
  })

  await invalidatePropiedadCache(propiedadId)
  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true }
}

/**
 * Obtiene las propiedades del usuario autenticado
 */
export async function getMisPropiedades() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  return prisma.propiedad.findMany({
    where: { propietarioId: user.id },
    include: {
      imagenes: {
        where: { esPrincipal: true },
        take: 1,
      },
    },
    orderBy: { fechaActualizacion: 'desc' },
  })
}

async function _getPropiedadesPublicasInternal(filtros?: {
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
  ordenarPor?: string
  pagina?: number
}) {
  const supabase = createAdminClient()
  const pagina = filtros?.pagina || 1
  const porPagina = 20

  let query = supabase
    .from('propiedades')
    .select('*, imagenes:imagenes_propiedad!propiedad_id(url, es_principal)', { count: 'exact' })
    .eq('estado_publicacion', 'PUBLICADA')

  if (filtros?.ubicacion && !filtros?.lat) {
    const ubicacion = filtros.ubicacion.trim()
    const ubicacionSanitized = ubicacion
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
    query = query.or(`ciudad.ilike.%${ubicacionSanitized}%,estado.ilike.%${ubicacionSanitized}%,zona.ilike.%${ubicacionSanitized}%`)
  }
  if (filtros?.precioMin) {
    query = query.gte('precio_por_noche', filtros.precioMin)
  }
  if (filtros?.precioMax) {
    query = query.lte('precio_por_noche', filtros.precioMax)
  }
  if (filtros?.huespedes) {
    query = query.gte('capacidad_maxima', filtros.huespedes)
  }
  if (filtros?.tipoPropiedad) {
    query = query.eq('tipo_propiedad', filtros.tipoPropiedad)
  }
  if (filtros?.habitaciones) {
    query = query.gte('habitaciones', filtros.habitaciones)
  }

  const ordenarPor = filtros?.ordenarPor || 'recientes'
  switch (ordenarPor) {
    case 'precio_asc':
      query = query.order('precio_por_noche', { ascending: true, nullsFirst: false })
      break
    case 'precio_desc':
      query = query.order('precio_por_noche', { ascending: false, nullsFirst: false })
      break
    case 'rating':
      query = query.order('rating_promedio', { ascending: false, nullsFirst: true })
      break
    default:
      query = query.order('fecha_publicacion', { ascending: false, nullsFirst: false })
  }

  const useProximity = filtros?.lat != null && filtros?.lng != null
  const radioKm = filtros?.radio ?? 25

  if (!useProximity) {
    query = query.range((pagina - 1) * porPagina, pagina * porPagina - 1)
  }

  const { data, count } = await query

  let rawResults = (data ?? []) as Record<string, unknown>[]

  if (useProximity) {
    const centerLat = filtros!.lat!
    const centerLng = filtros!.lng!
    rawResults = rawResults.filter((p) => {
      const lat = p.latitud as number | null
      const lng = p.longitud as number | null
      if (lat == null || lng == null) return false
      const R = 6371
      const dLat = ((lat - centerLat) * Math.PI) / 180
      const dLon = ((lng - centerLng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((centerLat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const dist = R * c
      ;(p as Record<string, unknown> & { _dist?: number })._dist = dist
      return dist <= radioKm
    })
    rawResults.sort((a, b) => ((a as Record<string, unknown> & { _dist?: number })._dist ?? 0) - ((b as Record<string, unknown> & { _dist?: number })._dist ?? 0))
  }

  const totalCount = useProximity ? rawResults.length : (count ?? 0)
  if (useProximity) {
    rawResults = rawResults.slice((pagina - 1) * porPagina, pagina * porPagina)
  }

  const propiedades: PropiedadPublica[] = rawResults.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    titulo: p.titulo as string,
    descripcion: p.descripcion as string,
    tipoPropiedad: p.tipo_propiedad as string,
    precioPorNoche: p.precio_por_noche as string,
    moneda: p.moneda as string,
    capacidadMaxima: p.capacidad_maxima as number,
    habitaciones: p.habitaciones as number,
    banos: p.banos as number,
    camas: p.camas as number,
    direccion: p.direccion as string,
    ciudad: p.ciudad as string,
    estado: p.estado as string,
    zona: p.zona as string | null,
    latitud: p.latitud as number | null,
    longitud: p.longitud as number | null,
    ratingPromedio: p.rating_promedio as number | null,
    totalResenas: (p.total_resenas as number) ?? 0,
    imagenes: ((p.imagenes as Record<string, unknown>[]) ?? []).filter((img: Record<string, unknown>) => img.es_principal) as { url: string; es_principal: boolean }[],
  }))

  const total = totalCount
  return {
    datos: propiedades,
    total,
    pagina,
    porPagina,
    totalPaginas: Math.ceil(total / porPagina),
  }
}

const _getPropiedadesPublicasCached = unstable_cache(
  _getPropiedadesPublicasInternal,
  ['propiedades-publicas'],
  { revalidate: CACHE_TIMES.PROPIEDADES_LIST, tags: [CACHE_TAGS.PROPIEDADES] }
)

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
  ordenarPor?: string
  pagina?: number
}) {
  return _getPropiedadesPublicasCached(filtros)
}

async function _getPropiedadPorIdInternal(id: string): Promise<PropiedadDetalle | null> {
  const supabase = createAdminClient()

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('*, propietario:usuarios!propietario_id(id, nombre, apellido, avatar_url, verificado)')
    .eq('id', id)
    .single()

  if (!propiedad) return null

  const { data: imagenes } = await supabase
    .from('imagenes_propiedad')
    .select('*')
    .eq('propiedad_id', id)
    .order('orden', { ascending: true })

  const { data: amenidadesRaw } = await supabase
    .from('propiedad_amenidades')
    .select('amenidad_id, amenidad:amenidades(id, nombre, icono, categoria)')
    .eq('propiedad_id', id)

  const { data: resenasRaw } = await supabase
    .from('resenas')
    .select('id, calificacion, comentario, fecha_creacion, autor:usuarios!autor_id(nombre, apellido, avatar_url)')
    .eq('propiedad_id', id)
    .order('fecha_creacion', { ascending: false })
    .limit(10)

  const p = propiedad as Record<string, unknown>

  return {
    id: p.id as string,
    titulo: p.titulo as string,
    descripcion: p.descripcion as string,
    tipoPropiedad: p.tipo_propiedad as string,
    precioPorNoche: p.precio_por_noche as string,
    moneda: p.moneda as string,
    capacidadMaxima: p.capacidad_maxima as number,
    habitaciones: p.habitaciones as number,
    banos: p.banos as number,
    camas: p.camas as number,
    direccion: p.direccion as string,
    ciudad: p.ciudad as string,
    estado: p.estado as string,
    zona: p.zona as string | null,
    latitud: p.latitud as number | null,
    longitud: p.longitud as number | null,
    reglas: p.reglas as string | null,
    politicaCancelacion: p.politica_cancelacion as string,
    horarioCheckIn: p.horario_checkin as string | null,
    horarioCheckOut: p.horario_checkout as string | null,
    estanciaMinima: p.estancia_minima as number,
    estanciaMaxima: p.estancia_maxima as number | null,
    ratingPromedio: p.rating_promedio as number | null,
    totalResenas: (p.total_resenas as number) ?? 0,
    propietario: p.propietario as PropiedadDetalle['propietario'],
    imagenes: (imagenes ?? []) as PropiedadDetalle['imagenes'],
    amenidades: ((amenidadesRaw ?? []) as Record<string, unknown>[]).map((a) => ({
      amenidadId: a.amenidad_id as string,
      amenidad: a.amenidad as PropiedadDetalle['amenidades'][number]['amenidad'],
    })),
    resenas: ((resenasRaw ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      calificacion: r.calificacion as number,
      comentario: r.comentario as string,
      fechaCreacion: r.fecha_creacion as string,
      autor: r.autor as PropiedadDetalle['resenas'][number]['autor'],
    })),
  }
}

const _getPropiedadPorIdCached = unstable_cache(
  _getPropiedadPorIdInternal,
  ['propiedad-detalle'],
  { revalidate: CACHE_TIMES.PROPIEDAD_DETALLE, tags: [CACHE_TAGS.PROPIEDADES] }
)

export async function getPropiedadPorId(id: string): Promise<PropiedadDetalle | null> {
  return _getPropiedadPorIdCached(id)
}
