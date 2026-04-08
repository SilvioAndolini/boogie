'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { adminActualizarPropiedadSchema } from '@/lib/admin-validations'
import { revalidatePath } from 'next/cache'
import { PROPIEDADES_POR_PAGINA } from '@/lib/constants'

export async function getPropiedadesAdmin(filters: {
  estado?: string
  ciudad?: string
  busqueda?: string
  pagina?: number
  limite?: number
}) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const pagina = filters.pagina || 1
  const limite = filters.limite || PROPIEDADES_POR_PAGINA
  const offset = (pagina - 1) * limite

  let query = admin
    .from('propiedades')
    .select(`
      id, titulo, slug, tipo_propiedad, precio_por_noche, moneda,
      capacidad_maxima, habitaciones, banos, camas,
      ciudad, estado, direccion, estado_publicacion, destacada,
      fecha_publicacion, fecha_actualizacion, vistas_totales,
      rating_promedio, total_resenas,
      propietario:usuarios!propiedades_propietario_id_fkey(id, nombre, apellido, email, avatar_url),
      imagenes:imagenes_propiedad(url, es_principal)
    `, { count: 'exact' })
    .order('fecha_actualizacion', { ascending: false })
    .range(offset, offset + limite - 1)

  if (filters.estado) query = query.eq('estado_publicacion', filters.estado)
  if (filters.ciudad) query = query.eq('ciudad', filters.ciudad)
  if (filters.busqueda) {
    query = query.or(`titulo.ilike.%${filters.busqueda}%,ciudad.ilike.%${filters.busqueda}%,estado.ilike.%${filters.busqueda}%`)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[getPropiedadesAdmin] Error:', error.message)
    return { error: 'Error al cargar propiedades' }
  }

  return {
    propiedades: data || [],
    total: count ?? 0,
    paginas: Math.ceil((count ?? 0) / limite),
  }
}

export async function getCiudadesPropiedades() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('propiedades')
    .select('ciudad')
    .order('ciudad')

  if (error) return []

  const ciudades = [...new Set((data || []).map(p => p.ciudad))].sort()
  return ciudades
}

export async function getPropiedadDetalleAdmin(id: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const { data: propiedad, error: propError } = await admin
    .from('propiedades')
    .select(`
      *,
      propietario:usuarios!propiedades_propietario_id_fkey(id, nombre, apellido, email, telefono, avatar_url, verificado, rol, fecha_registro),
      imagenes:imagenes_propiedad(id, url, es_principal, orden, alt),
      amenidades:propiedad_amenidades(amenidad_id, amenidad:amenidades(nombre, icono, categoria)),
      resenas:resenas(id, calificacion, comentario, fecha_creacion, autor:usuarios!resenas_autor_id_fkey(id, nombre, apellido, avatar_url))
    `)
    .eq('id', id)
    .single()

  if (propError || !propiedad) {
    return { error: 'Propiedad no encontrada' }
  }

  const { data: reservas, error: resError } = await admin
    .from('reservas')
    .select(`
      id, codigo, fecha_entrada, fecha_salida, noches, total, moneda, estado, cantidad_huespedes, fecha_creacion,
      huesped:usuarios!reservas_huesped_id_fkey(id, nombre, apellido, email, avatar_url)
    `)
    .eq('propiedad_id', id)
    .order('fecha_creacion', { ascending: false })
    .limit(20)

  return {
    propiedad,
    reservas: resError ? [] : (reservas || []),
  }
}

export async function actualizarPropiedadAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    propiedadId: formData.get('propiedadId') as string,
    estadoPublicacion: (formData.get('estadoPublicacion') as string) || undefined,
    destacada: formData.get('destacada') === 'true' ? true : formData.get('destacada') === 'false' ? false : undefined,
    motivo: (formData.get('motivo') as string) || undefined,
  }

  const parsed = adminActualizarPropiedadSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const { propiedadId, estadoPublicacion, destacada, motivo } = parsed.data
  const admin = createAdminClient()

  const updateData: Record<string, unknown> = { fecha_actualizacion: new Date().toISOString() }
  if (estadoPublicacion) updateData.estado_publicacion = estadoPublicacion
  if (destacada !== undefined) updateData.destacada = destacada
  if (estadoPublicacion === 'PUBLICADA' && !destacada) updateData.fecha_publicacion = new Date().toISOString()

  const { error } = await admin
    .from('propiedades')
    .update(updateData)
    .eq('id', propiedadId)

  if (error) {
    console.error('[actualizarPropiedadAdmin] Error:', error.message)
    return { error: 'Error al actualizar propiedad' }
  }

  const accionParts: string[] = []
  if (estadoPublicacion) accionParts.push(`ESTADO:${estadoPublicacion}`)
  if (destacada !== undefined) accionParts.push(destacada ? 'DESTACADA' : 'NO_DESTACADA')

  await logAdminAction({
    accion: `PROPIEDAD_${accionParts.join(', ')}`,
    entidad: 'propiedad',
    entidadId: propiedadId,
    detalles: { estadoPublicacion, destacada, motivo },
  })

  revalidatePath('/admin/propiedades')
  return { exito: true }
}

export async function eliminarPropiedadAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const propiedadId = formData.get('propiedadId') as string
  if (!propiedadId) return { error: 'ID de propiedad requerido' }

  const admin = createAdminClient()

  const { data: imagenes } = await admin
    .from('imagenes_propiedad')
    .select('url')
    .eq('propiedad_id', propiedadId)

  if (imagenes && imagenes.length > 0) {
    const paths = imagenes.map(img => {
      const url = new URL(img.url)
      return decodeURIComponent(url.pathname.split('/storage/v1/object/public/imagenes/')[1] || '')
    }).filter(Boolean)

    if (paths.length > 0) {
      await admin.storage.from('imagenes').remove(paths)
    }
  }

  const { error } = await admin
    .from('propiedades')
    .delete()
    .eq('id', propiedadId)

  if (error) {
    console.error('[eliminarPropiedadAdmin] Error:', error.message)
    return { error: 'Error al eliminar propiedad' }
  }

  await logAdminAction({
    accion: 'PROPIEDAD_ELIMINADA',
    entidad: 'propiedad',
    entidadId: propiedadId,
  })

  revalidatePath('/admin/propiedades')
  return { exito: true }
}

const ESTADOS_INGRESO = ['CONFIRMADA', 'EN_CURSO', 'COMPLETADA']

export async function getPropiedadIngresos(propiedadId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const { data: reservas, error } = await admin
    .from('reservas')
    .select('id, fecha_entrada, fecha_salida, noches, subtotal, comision_plataforma, comision_anfitrion, total, moneda, estado, cantidad_huespedes, fecha_creacion, huesped:usuarios!reservas_huesped_id_fkey(id, nombre, apellido, email)')
    .eq('propiedad_id', propiedadId)
    .in('estado', ESTADOS_INGRESO)
    .order('fecha_entrada', { ascending: false })

  if (error) {
    console.error('[getPropiedadIngresos] Error:', error.message)
    return { error: 'Error al cargar ingresos' }
  }

  const lista = (reservas || []) as Record<string, unknown>[]

  const totalIngresos = lista.reduce((acc, r) => acc + Number(r.total || 0), 0)
  const totalComisiones = lista.reduce((acc, r) => acc + Number(r.comision_plataforma || 0), 0)
  const totalComisionesAnfitrion = lista.reduce((acc, r) => acc + Number(r.comision_anfitrion || 0), 0)
  const totalNoches = lista.reduce((acc, r) => acc + Number(r.noches || 0), 0)
  const totalHuespedes = lista.reduce((acc, r) => acc + Number(r.cantidad_huespedes || 0), 0)
  const tarifaPromedio = totalNoches > 0 ? totalIngresos / totalNoches : 0

  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
  const inicioMesPasado = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const finMesPasado = new Date(now.getFullYear(), now.getMonth(), 0)

  const ingresosMes = lista
    .filter(r => new Date(r.fecha_creacion as string) >= inicioMes)
    .reduce((acc, r) => acc + Number(r.total || 0), 0)
  const ingresosMesPasado = lista
    .filter(r => {
      const d = new Date(r.fecha_creacion as string)
      return d >= inicioMesPasado && d <= finMesPasado
    })
    .reduce((acc, r) => acc + Number(r.total || 0), 0)
  const crecimiento = ingresosMesPasado > 0
    ? Math.round(((ingresosMes - ingresosMesPasado) / ingresosMesPasado) * 100)
    : 0

  const mesesEspanol = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const byMonth: { name: string; ingresos: number; comisiones: number; mes: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth.push({ name: mesesEspanol[d.getMonth()], ingresos: 0, comisiones: 0, mes: key })
  }

  for (const r of lista) {
    const fecha = new Date(r.fecha_entrada as string)
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const mesData = byMonth.find(m => m.mes === key)
    if (mesData) {
      mesData.ingresos += Number(r.total || 0)
      mesData.comisiones += Number(r.comision_plataforma || 0)
    }
  }

  const ingresosByMonth = byMonth.map(m => ({
    name: m.name,
    ingresos: Math.round(m.ingresos * 100) / 100,
    comisiones: Math.round(m.comisiones * 100) / 100,
  }))

  return {
    reservas: lista,
    kpis: {
      totalIngresos: Math.round(totalIngresos * 100) / 100,
      totalComisiones: Math.round(totalComisiones * 100) / 100,
      totalComisionesAnfitrion: Math.round(totalComisionesAnfitrion * 100) / 100,
      ingresosNetos: Math.round((totalIngresos - totalComisiones) * 100) / 100,
      totalNoches,
      totalHuespedes,
      tarifaPromedio: Math.round(tarifaPromedio * 100) / 100,
      totalReservas: lista.length,
      ingresosMes: Math.round(ingresosMes * 100) / 100,
      ingresosMesPasado: Math.round(ingresosMesPasado * 100) / 100,
      crecimiento,
    },
    ingresosByMonth,
  }
}
