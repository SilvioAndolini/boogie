'use server'

import { revalidatePath, unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { propiedadSchema } from '@/lib/validations'
import { CACHE_TAGS, CACHE_TIMES, invalidatePropiedadCache } from '@/lib/cache'
import { getUsuarioAutenticado } from '@/lib/auth'
import { generarSlug } from '@/lib/slug'

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
  propietario: { id: string; nombre: string; apellido: string; avatar_url: string | null; verificado: boolean; plan_suscripcion: string; bio: string | null; reputacion: number | null; reputacionManual: boolean } | null
  imagenes: { id: string; url: string; alt: string | null; orden: number; es_principal: boolean; categoria: string }[]
  amenidades: { amenidadId: string; amenidad: { id: string; nombre: string; icono: string | null; categoria: string } }[]
  resenas: { id: string; calificacion: number; comentario: string; fechaCreacion: string; autor: { nombre: string; apellido: string; avatar_url: string | null } }[]
}

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
  const supabase = createAdminClient()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('plan_suscripcion')
    .eq('id', user.id)
    .single()

  if (usuario?.plan_suscripcion !== 'ULTRA') {
    const { count } = await supabase
      .from('propiedades')
      .select('id', { count: 'exact', head: true })
      .eq('propietario_id', user.id)
      .neq('estado_publicacion', 'SUSPENDIDA')

    if ((count ?? 0) >= 5) {
      return { error: 'Has alcanzado el límite de 5 boogies con el plan Boogie Free. Actualiza a Boogie Ultra para publicar más.' }
    }
  }

  const propiedadId = crypto.randomUUID()
  const slug = generarSlug(data.titulo)

  const { data: propiedad, error: insertError } = await supabase
    .from('propiedades')
    .insert({
      id: propiedadId,
      slug,
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipo_propiedad: data.tipoPropiedad,
      precio_por_noche: data.precioPorNoche,
      moneda: data.moneda,
      capacidad_maxima: data.capacidadMaxima,
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
      politica_cancelacion: data.politicaCancelacion,
      horario_checkin: data.horarioCheckIn,
      horario_checkout: data.horarioCheckOut,
      estancia_minima: data.estanciaMinima,
      estancia_maxima: data.estanciaMaxima,
      propietario_id: user.id,
      estado_publicacion: 'PUBLICADA',
      fecha_publicacion: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !propiedad) {
    console.error('[crearPropiedad] Error:', insertError)
    return { error: 'Error al crear el boogie' }
  }

  const { data: usuarioActual } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (usuarioActual?.rol === 'BOOGER') {
    await supabase
      .from('usuarios')
      .update({ rol: 'AMBOS' })
      .eq('id', user.id)
    console.log('[crearPropiedad] Usuario upgraded: BOOGER → AMBOS')
  }

  if (data.amenidades.length > 0) {
    for (const nombre of data.amenidades) {
      const { data: amenidad } = await supabase
        .from('amenidades')
        .select('id')
        .eq('nombre', nombre)
        .single()

      let amenidadId = amenidad?.id

      if (!amenidadId) {
        const { data: nueva, error: errAmen } = await supabase
          .from('amenidades')
          .insert({ nombre, categoria: 'ESENCIALES' })
          .select('id')
          .single()
        if (errAmen || !nueva) continue
        amenidadId = nueva.id
      }

      await supabase
        .from('propiedad_amenidades')
        .insert({ propiedad_id: propiedad.id, amenidad_id: amenidadId })
    }
  }

  const archivos = formData.getAll('imagenes') as File[]
  const categorias = formData.getAll('imagen_categorias') as string[]
  console.log('[crearPropiedad] Archivos recibidos:', archivos.length)
  if (archivos.length > 0) {
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]
      const path = `propiedades/${propiedad.id}/${Date.now()}-${i}.webp`

      console.log('[crearPropiedad] Subiendo:', path, 'type:', archivo.type, 'size:', archivo.size)

      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(path, archivo, { contentType: 'image/webp', upsert: false })

      if (uploadError) {
        console.error('[crearPropiedad] Upload error:', uploadError)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(path)

      const { error: imgInsertError } = await supabase
        .from('imagenes_propiedad')
        .insert({
          id: crypto.randomUUID(),
          propiedad_id: propiedad.id,
          url: urlData.publicUrl,
          orden: i,
          es_principal: i === 0,
          categoria: categorias[i] || 'otro',
        })

      if (imgInsertError) {
        console.error('[crearPropiedad] Img insert error:', imgInsertError)
      }
    }
  }

  await invalidatePropiedadCache(propiedad.id)
  revalidatePath('/dashboard/mis-propiedades')

  return { exito: true, id: propiedad.id }
}

export async function eliminarPropiedad(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('id')
    .eq('id', propiedadId)
    .eq('propietario_id', user.id)
    .single()

  if (!propiedad) return { error: 'Boogie no encontrado' }

  const { data: imagenes } = await supabase
    .from('imagenes_propiedad')
    .select('url')
    .eq('propiedad_id', propiedadId)

  if (imagenes && imagenes.length > 0) {
    const paths = imagenes.map((img: { url: string }) => {
      const parts = img.url.split('/storage/v1/object/public/imagenes/')
      return parts[1] || ''
    }).filter(Boolean)

    if (paths.length > 0) {
      await supabase.storage.from('imagenes').remove(paths)
    }
  }

  await supabase.from('propiedad_amenidades').delete().eq('propiedad_id', propiedadId)
  await supabase.from('imagenes_propiedad').delete().eq('propiedad_id', propiedadId)
  const { error: deleteError } = await supabase.from('propiedades').delete().eq('id', propiedadId)

  if (deleteError) {
    console.error('[eliminarPropiedad] Error:', deleteError)
    return { error: 'Error al eliminar el boogie' }
  }

  await invalidatePropiedadCache(propiedadId)
  revalidatePath('/dashboard/mis-propiedades')

  return { exito: true }
}

export async function actualizarEstadoPropiedad(propiedadId: string, estado: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('id')
    .eq('id', propiedadId)
    .eq('propietario_id', user.id)
    .single()

  if (!propiedad) return { error: 'Propiedad no encontrada' }

  const updateData: Record<string, unknown> = { estado_publicacion: estado }
  if (estado === 'PUBLICADA') {
    updateData.fecha_publicacion = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('propiedades')
    .update(updateData)
    .eq('id', propiedadId)

  if (updateError) {
    console.error('[actualizarEstadoPropiedad] Error:', updateError)
    return { error: 'Error al actualizar' }
  }

  await invalidatePropiedadCache(propiedadId)
  revalidatePath('/dashboard/mis-propiedades')
  return { exito: true }
}

export async function getBoogieParaEditar(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return null

  const supabase = createAdminClient()

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('*')
    .eq('id', propiedadId)
    .eq('propietario_id', user.id)
    .single()

  if (!propiedad) return null

  const { data: amenidadesRaw } = await supabase
    .from('propiedad_amenidades')
    .select('amenidad:amenidades(nombre)')
    .eq('propiedad_id', propiedadId)

  const { data: imagenes } = await supabase
    .from('imagenes_propiedad')
    .select('*')
    .eq('propiedad_id', propiedadId)
    .order('orden', { ascending: true })

  return {
    ...propiedad,
    amenidades: (amenidadesRaw ?? []).map((a: Record<string, unknown>) => (a.amenidad as { nombre: string }).nombre),
    imagenes: imagenes ?? [],
  }
}

export async function actualizarPropiedad(propiedadId: string, formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const supabase = createAdminClient()

  const { data: propiedad } = await supabase
    .from('propiedades')
    .select('id')
    .eq('id', propiedadId)
    .eq('propietario_id', user.id)
    .single()

  if (!propiedad) return { error: 'Boogie no encontrado' }

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

  const { error: updateError } = await supabase
    .from('propiedades')
    .update({
      titulo: data.titulo,
      descripcion: data.descripcion,
      tipo_propiedad: data.tipoPropiedad,
      precio_por_noche: data.precioPorNoche,
      moneda: data.moneda,
      capacidad_maxima: data.capacidadMaxima,
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
      politica_cancelacion: data.politicaCancelacion,
      horario_checkin: data.horarioCheckIn,
      horario_checkout: data.horarioCheckOut,
      estancia_minima: data.estanciaMinima,
      estancia_maxima: data.estanciaMaxima,
    })
    .eq('id', propiedadId)

  if (updateError) {
    console.error('[actualizarPropiedad] Error:', updateError)
    return { error: 'Error al actualizar el boogie' }
  }

  await supabase.from('propiedad_amenidades').delete().eq('propiedad_id', propiedadId)

  if (data.amenidades.length > 0) {
    for (const nombre of data.amenidades) {
      const { data: amenidad } = await supabase
        .from('amenidades')
        .select('id')
        .eq('nombre', nombre)
        .single()

      let amenidadId = amenidad?.id

      if (!amenidadId) {
        const { data: nueva } = await supabase
          .from('amenidades')
          .insert({ nombre, categoria: 'ESENCIALES' })
          .select('id')
          .single()
        if (!nueva) continue
        amenidadId = nueva.id
      }

      await supabase
        .from('propiedad_amenidades')
        .insert({ propiedad_id: propiedadId, amenidad_id: amenidadId })
    }
  }

  const archivos = formData.getAll('imagenes') as File[]
  const categorias = formData.getAll('imagen_categorias') as string[]
  if (archivos.length > 0) {
    const { data: existentes } = await supabase
      .from('imagenes_propiedad')
      .select('orden')
      .eq('propiedad_id', propiedadId)
      .order('orden', { ascending: false })
      .limit(1)

    const ordenBase = (existentes?.[0]?.orden ?? -1) + 1

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]
      const ext = archivo.name.split('.').pop() || 'jpg'
      const path = `propiedades/${propiedadId}/${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(path, archivo, { contentType: archivo.type, upsert: false })

      if (uploadError) continue

      const { data: urlData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(path)

      await supabase
        .from('imagenes_propiedad')
        .insert({
          id: crypto.randomUUID(),
          propiedad_id: propiedadId,
          url: urlData.publicUrl,
          orden: ordenBase + i,
          es_principal: false,
          categoria: categorias[i] || 'otro',
        })
    }
  }

  await invalidatePropiedadCache(propiedadId)
  revalidatePath('/dashboard/mis-propiedades')

  return { exito: true }
}

export async function getMisPropiedades() {
  const user = await getUsuarioAutenticado()
  if (!user) return []

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('propiedades')
    .select('*, imagenes:imagenes_propiedad!propiedad_id(url, es_principal)')
    .eq('propietario_id', user.id)
    .order('fecha_actualizacion', { ascending: false })

  return data ?? []
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
  amenidades?: string[]
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
  if (filtros?.amenidades && filtros.amenidades.length > 0) {
    const { data: amenidadProps } = await supabase
      .from('propiedad_amenidades')
      .select('propiedad_id, amenidad:amenidades(nombre)')
      .in('amenidad.nombre', filtros.amenidades!)

    const validIds = [...new Set(
      (amenidadProps ?? [])
        .filter((a: Record<string, unknown>) => {
          const amenidad = a.amenidad as Record<string, unknown> | null
          return amenidad && filtros.amenidades!.includes(amenidad.nombre as string)
        })
        .map((a: Record<string, unknown>) => a.propiedad_id as string)
    )]

    if (validIds.length > 0) {
      const amenidadCount: Record<string, number> = {}
      for (const id of validIds) {
        amenidadCount[id] = (amenidadCount[id] || 0) + 1
      }
      const matchingIds = Object.entries(amenidadCount)
        .filter(([, count]) => count >= filtros.amenidades!.length)
        .map(([id]) => id)

      query = query.in('id', matchingIds.length > 0 ? matchingIds : ['__none__'])
    } else {
      query = query.in('id', ['__none__'])
    }
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
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
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
  amenidades?: string[]
  ordenarPor?: string
  pagina?: number
}) {
  return _getPropiedadesPublicasCached(filtros)
}

async function _getPropiedadPorIdInternal(idOrSlug: string): Promise<PropiedadDetalle | null> {
  const supabase = createAdminClient()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  let query = supabase
    .from('propiedades')
    .select('*, propietario:usuarios!propietario_id(id, nombre, apellido, avatar_url, verificado, plan_suscripcion, bio, reputacion, reputacion_manual)')

  if (isUUID) {
    query = query.eq('id', idOrSlug)
  } else {
    query = query.eq('slug', idOrSlug)
  }

  const { data: propiedad } = await query.single()

  if (!propiedad) return null

  const propiedadId = (propiedad as Record<string, unknown>).id as string

  const { data: imagenes } = await supabase
    .from('imagenes_propiedad')
    .select('*')
    .eq('propiedad_id', propiedadId)
    .order('orden', { ascending: true })

  const { data: amenidadesRaw } = await supabase
    .from('propiedad_amenidades')
    .select('amenidad_id, amenidad:amenidades(id, nombre, icono, categoria)')
    .eq('propiedad_id', propiedadId)

  const { data: resenasRaw } = await supabase
    .from('resenas')
    .select('id, calificacion, comentario, fecha_creacion, autor:usuarios!autor_id(nombre, apellido, avatar_url)')
    .eq('propiedad_id', propiedadId)
    .order('fecha_creacion', { ascending: false })
    .limit(10)

  const p = propiedad as Record<string, unknown>

  const propietarioRaw = p.propietario as Record<string, unknown> | null
  let hostReputacion: number | null = null
  let hostReputacionManual = false
  if (propietarioRaw?.id) {
    hostReputacionManual = (propietarioRaw.reputacion_manual as boolean) ?? false
    if (hostReputacionManual) {
      hostReputacion = propietarioRaw.reputacion != null ? Number(propietarioRaw.reputacion) : null
    } else {
      const { data: hostResenas } = await supabase
        .from('resenas')
        .select('calificacion')
        .eq('anfitrion_id', propietarioRaw.id as string)
      if (hostResenas && hostResenas.length > 0) {
        hostReputacion = hostResenas.reduce((sum: number, r: Record<string, unknown>) => sum + (r.calificacion as number), 0) / hostResenas.length
      }
    }
  }

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
    propietario: propietarioRaw ? {
      id: propietarioRaw.id as string,
      nombre: propietarioRaw.nombre as string,
      apellido: propietarioRaw.apellido as string,
      avatar_url: propietarioRaw.avatar_url as string | null,
      verificado: propietarioRaw.verificado as boolean,
      plan_suscripcion: (propietarioRaw.plan_suscripcion as string) || 'FREE',
      bio: propietarioRaw.bio as string | null,
      reputacion: hostReputacion,
      reputacionManual: hostReputacionManual,
    } : null,
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
