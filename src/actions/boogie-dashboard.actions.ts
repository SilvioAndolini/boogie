'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { goGet, goPost, goDelete, useGoBackend } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

export async function getBoogieDashboard(propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  if (useGoBackend('dashboard')) {
    try {
      const data = await goGet<Record<string, unknown>>(`/api/v1/propiedades/${propiedadId}/dashboard`)
      const propiedad = (data.propiedad as Record<string, unknown>) || {}
      propiedad.capacidad_maxima = propiedad.capacidad
      propiedad.habitaciones = propiedad.dormitorios
      propiedad.horario_checkin = propiedad.check_in
      propiedad.horario_checkout = propiedad.check_out
      propiedad.cantidad_resenas = propiedad.cantidad_resenas ?? propiedad.total_resenas ?? 0
      propiedad.amenidades = data.amenidades

      return {
        propiedad,
        reservas: data.reservas || [],
        gastos: data.gastos || [],
        fechasBloqueadas: data.fechasBloqueadas || [],
        preciosEspeciales: data.preciosEspeciales || [],
        kpis: data.kpis,
        ingresosByMonth: data.ingresosByMonth || {},
        gastosByMonth: data.gastosByMonth || {},
        ocupadas: data.ocupadas || [],
      }
    } catch (err: any) {
      return { error: err.message || 'Boogie no encontrado' }
    }
  }

  let propiedad: Record<string, unknown> | null = null
  try {
    propiedad = await goGet<Record<string, unknown>>(`/api/v1/propiedades/${propiedadId}`)
  } catch {
    return { error: 'Boogie no encontrado' }
  }

  if (!propiedad) return { error: 'Boogie no encontrado' }

  propiedad.capacidad_maxima = propiedad.capacidad
  propiedad.habitaciones = propiedad.dormitorios
  propiedad.horario_checkin = propiedad.check_in
  propiedad.horario_checkout = propiedad.check_out
  propiedad.cantidad_resenas = propiedad.cantidad_resenas ?? propiedad.total_resenas ?? 0

  const supabase = createAdminClient()

  const [gastosResult, fechasBloqueadasResult, preciosEspecialesResult, reservasResult, amenidadesResult] = await Promise.all([
    supabase
      .from('gastos_mantenimiento')
      .select('*')
      .eq('propiedad_id', propiedadId)
      .order('fecha', { ascending: false }),
    supabase
      .from('fechas_bloqueadas')
      .select('*')
      .eq('propiedad_id', propiedadId),
    supabase
      .from('precios_especiales')
      .select('*')
      .eq('propiedad_id', propiedadId),
    supabase
      .from('reservas')
      .select('id, estado, fecha_entrada, fecha_salida, noches, monto_total:total, moneda, cantidad_huespedes, huesped:usuarios!huesped_id(nombre, apellido, email, avatar_url)')
      .eq('propiedad_id', propiedadId)
      .order('fecha_entrada', { ascending: false }),
    supabase
      .from('propiedad_amenidades')
      .select('amenidad:amenidades(nombre)')
      .eq('propiedad_id', propiedadId),
  ])

  const { data: gastos } = gastosResult
  const { data: fechasBloqueadas } = fechasBloqueadasResult
  const { data: preciosEspeciales } = preciosEspecialesResult
  const { data: reservasRaw } = reservasResult
  const { data: amenidadesRaw } = amenidadesResult

  const reservasList: Record<string, unknown>[] = (reservasRaw || []) as Record<string, unknown>[]
  const amenidades: string[] = (amenidadesRaw || [])
    .map((a: Record<string, unknown>) => {
      const amenidad = a.amenidad as Record<string, unknown> | null
      return amenidad?.nombre as string
    })
    .filter(Boolean)

  propiedad.amenidades = amenidades

  const gastosList = gastos || []

  const totalIngresos = reservasList
    .filter((r: Record<string, unknown>) => {
      const estado = r.estado as string
      return ['CONFIRMADA', 'EN_CURSO', 'COMPLETADA'].includes(estado)
    })
    .reduce((acc: number, r: Record<string, unknown>) => acc + ((r.monto_total as number) || 0), 0)

  const totalGastos = gastosList
    .filter((g: Record<string, unknown>) => (g.moneda as string) === 'USD')
    .reduce((acc: number, g: Record<string, unknown>) => acc + ((g.monto as number) || 0), 0)

  const totalGastosVes = gastosList
    .filter((g: Record<string, unknown>) => (g.moneda as string) === 'VES')
    .reduce((acc: number, g: Record<string, unknown>) => acc + ((g.monto as number) || 0), 0)

  const reservasConfirmadas = reservasList.filter((r: Record<string, unknown>) => (r.estado as string) === 'CONFIRMADA')
  const reservasActivas = reservasList.filter((r: Record<string, unknown>) => ['CONFIRMADA', 'EN_CURSO'].includes(r.estado as string))

  const totalNoches = reservasList
    .filter((r: Record<string, unknown>) => ['CONFIRMADA', 'EN_CURSO', 'COMPLETADA'].includes(r.estado as string))
    .reduce((acc: number, r: Record<string, unknown>) => {
      const entrada = new Date(r.fecha_entrada as string)
      const salida = new Date(r.fecha_salida as string)
      return acc + Math.max(1, Math.ceil((salida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24)))
    }, 0)

  const ingresosByMonth: Record<string, number> = {}
  reservasList
    .filter((r: Record<string, unknown>) => ['CONFIRMADA', 'EN_CURSO', 'COMPLETADA'].includes(r.estado as string))
    .forEach((r: Record<string, unknown>) => {
      const date = new Date(r.fecha_entrada as string)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      ingresosByMonth[key] = (ingresosByMonth[key] || 0) + ((r.monto_total as number) || 0)
    })

  const gastosByMonth: Record<string, number> = {}
  gastosList
    .filter((g: Record<string, unknown>) => (g.moneda as string) === 'USD')
    .forEach((g: Record<string, unknown>) => {
      const date = new Date(g.fecha as string)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      gastosByMonth[key] = (gastosByMonth[key] || 0) + ((g.monto as number) || 0)
    })

  const ocupadas: Array<{ fecha_entrada: string; fecha_salida: string; estado: string; huesped?: string }> = []
  reservasList.forEach((r: Record<string, unknown>) => {
    const huesped = r.huesped as Record<string, unknown> | null
    ocupadas.push({
      fecha_entrada: r.fecha_entrada as string,
      fecha_salida: r.fecha_salida as string,
      estado: r.estado as string,
      huesped: huesped ? `${huesped.nombre || ''} ${huesped.apellido || ''}`.trim() : undefined,
    })
  })

  return {
    propiedad,
    reservas: reservasList,
    gastos: gastosList,
    fechasBloqueadas: fechasBloqueadas || [],
    preciosEspeciales: preciosEspeciales || [],
    kpis: {
      totalIngresos,
      totalGastos,
      totalGastosVes,
      balance: totalIngresos - totalGastos,
      totalReservas: reservasList.length,
      reservasActivas: reservasActivas.length,
      reservasConfirmadas: reservasConfirmadas.length,
      totalNoches,
      tarifaPromedio: totalNoches > 0 ? totalIngresos / totalNoches : 0,
    },
    ingresosByMonth,
    gastosByMonth,
    ocupadas,
  }
}

export async function crearGastoMantenimiento(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const propiedadId = formData.get('propiedadId') as string
  const descripcion = formData.get('descripcion') as string
  const monto = parseFloat(formData.get('monto') as string)
  const moneda = (formData.get('moneda') as string) || 'USD'
  const categoria = formData.get('categoria') as string
  const fecha = formData.get('fecha') as string

  if (!propiedadId || !descripcion || isNaN(monto) || monto <= 0 || !categoria) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (useGoBackend('dashboard')) {
    try {
      await goPost(`/api/v1/propiedades/${propiedadId}/gastos`, {
        descripcion, monto, moneda, categoria, fecha,
      })
      revalidatePath(`/dashboard/mis-propiedades/${propiedadId}`)
      return { exito: true }
    } catch (err: any) {
      return { error: err.message || 'Error al crear el gasto' }
    }
  }

  const supabase = createAdminClient()

  const { data: prop } = await supabase
    .from('propiedades')
    .select('id')
    .eq('id', propiedadId)
    .eq('propietario_id', user.id)
    .maybeSingle()

  if (!prop) return { error: 'Boogie no encontrado' }

  const { error } = await supabase
    .from('gastos_mantenimiento')
    .insert({
      propiedad_id: propiedadId,
      descripcion,
      monto,
      moneda,
      categoria,
      fecha: fecha || new Date().toISOString().split('T')[0],
    })

  if (error) {
    console.error('[crearGastoMantenimiento] Error:', error.message)
    return { error: 'Error al crear el gasto' }
  }

  revalidatePath(`/dashboard/mis-propiedades/${propiedadId}`)
  return { exito: true }
}

export async function eliminarGastoMantenimiento(gastoId: string, propiedadId: string) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  if (useGoBackend('dashboard')) {
    try {
      await goDelete(`/api/v1/propiedades/${propiedadId}/gastos/${gastoId}`)
      revalidatePath(`/dashboard/mis-propiedades/${propiedadId}`)
      return { exito: true }
    } catch (err: any) {
      return { error: err.message || 'Error al eliminar el gasto' }
    }
  }

  const supabase = createAdminClient()

  const { data: prop } = await supabase
    .from('propiedades')
    .select('id')
    .eq('id', propiedadId)
    .eq('propietario_id', user.id)
    .maybeSingle()

  if (!prop) return { error: 'Boogie no encontrado' }

  const { error } = await supabase
    .from('gastos_mantenimiento')
    .delete()
    .eq('id', gastoId)
    .eq('propiedad_id', propiedadId)

  if (error) {
    console.error('[eliminarGastoMantenimiento] Error:', error.message)
    return { error: 'Error al eliminar el gasto' }
  }

  revalidatePath(`/dashboard/mis-propiedades/${propiedadId}`)
  return { exito: true }
}
