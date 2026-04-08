'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function getAdminStats() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const now = new Date()
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const inicioMesPasado = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const finMesPasado = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const inicioSemana = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const manana = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

  const [
    usuariosTotal,
    usuariosNuevosSemana,
    propiedadesTotal,
    propiedadesPublicadas,
    reservasTotal,
    reservasPendientes,
    reservasHoy,
    pagosMes,
    pagosMesPasado,
    reservasMes,
    reservasMesPasado,
  ] = await Promise.all([
    admin.from('usuarios').select('id', { count: 'exact', head: true }).eq('activo', true),
    admin.from('usuarios').select('id', { count: 'exact', head: true }).gte('fecha_registro', inicioSemana),
    admin.from('propiedades').select('id', { count: 'exact', head: true }),
    admin.from('propiedades').select('id', { count: 'exact', head: true }).eq('estado_publicacion', 'PUBLICADA'),
    admin.from('reservas').select('id', { count: 'exact', head: true }),
    admin.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
    admin.from('reservas').select('id, codigo, fecha_entrada, fecha_salida, noches, total, moneda, estado, cantidad_huespedes, propiedad:propiedades(id, titulo), huesped:usuarios!reservas_huesped_id_fkey(id, nombre, apellido, email, avatar_url)')
      .gte('fecha_entrada', hoy).lt('fecha_entrada', manana).order('fecha_entrada', { ascending: true }),
    admin.from('pagos').select('monto, moneda').eq('estado', 'VERIFICADO').gte('fecha_creacion', inicioMes),
    admin.from('pagos').select('monto, moneda').eq('estado', 'VERIFICADO').gte('fecha_creacion', inicioMesPasado).lte('fecha_creacion', finMesPasado),
    admin.from('reservas').select('id', { count: 'exact', head: true }).gte('fecha_creacion', inicioMes),
    admin.from('reservas').select('id', { count: 'exact', head: true }).gte('fecha_creacion', inicioMesPasado).lte('fecha_creacion', finMesPasado),
  ])

  const calcularTotalUSD = (pagos: { monto: string; moneda: string }[]) => {
    return pagos.reduce((acc, p) => {
      const monto = Number(p.monto)
      return acc + (p.moneda === 'USD' ? monto : monto / 100)
    }, 0)
  }

  const pagosMesData = (pagosMes as unknown as { data: { monto: string; moneda: string }[] })?.data || []
  const pagosMesPasadoData = (pagosMesPasado as unknown as { data: { monto: string; moneda: string }[] })?.data || []
  const ingresosMes = calcularTotalUSD(pagosMesData)
  const ingresosMesPasado = calcularTotalUSD(pagosMesPasadoData)
  const crecimientoIngresos = ingresosMesPasado > 0 ? Math.round(((ingresosMes - ingresosMesPasado) / ingresosMesPasado) * 100) : 0
  const crecimientoReservas = (reservasMesPasado as { count: number } | null)?.count
    ? Math.round((((reservasMes as { count: number } | null)?.count || 0) - (reservasMesPasado as { count: number } | null)!.count) / (reservasMesPasado as { count: number } | null)!.count * 100)
    : 0

  return {
    usuarios: {
      total: (usuariosTotal as { count: number } | null)?.count ?? 0,
      nuevosSemana: (usuariosNuevosSemana as { count: number } | null)?.count ?? 0,
    },
    propiedades: {
      total: (propiedadesTotal as { count: number } | null)?.count ?? 0,
      publicadas: (propiedadesPublicadas as { count: number } | null)?.count ?? 0,
    },
    reservas: {
      total: (reservasTotal as { count: number } | null)?.count ?? 0,
      pendientes: (reservasPendientes as { count: number } | null)?.count ?? 0,
      hoy: reservasHoy || [],
    },
    pagos: {
      ingresosMes: Math.round(ingresosMes * 100) / 100,
      ingresosMesPasado: Math.round(ingresosMesPasado * 100) / 100,
      crecimientoIngresos,
    },
    crecimientoReservas,
  }
}

export async function getAdminChartsData() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
  const now = new Date()
  const mesesEspanol = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  const doceMesesAtras = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()
  const catorceDiasAtras = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13).toISOString()

  const [pagosData, reservasAll, propiedadesCiudad, usuariosRecientes] = await Promise.all([
    admin.from('pagos').select('monto, moneda, fecha_creacion').eq('estado', 'VERIFICADO').gte('fecha_creacion', doceMesesAtras),
    admin.from('reservas').select('estado'),
    admin.from('propiedades').select('ciudad').eq('estado_publicacion', 'PUBLICADA'),
    admin.from('usuarios').select('fecha_registro').gte('fecha_registro', catorceDiasAtras),
  ])

  const ingresosByMonth: { name: string; ingresos: number }[] = []
  const meses: { name: string; key: string; ingresos: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push({
      name: mesesEspanol[d.getMonth()],
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      ingresos: 0,
    })
  }

  const pagosRows = (pagosData as unknown as { data: { monto: string; moneda: string; fecha_creacion: string }[] })?.data || []
  for (const pago of pagosRows) {
    const fecha = new Date(pago.fecha_creacion)
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const mesData = meses.find(m => m.key === key)
    if (mesData) {
      const monto = Number(pago.monto)
      mesData.ingresos += pago.moneda === 'USD' ? monto : monto / 100
    }
  }
  for (const m of meses) {
    ingresosByMonth.push({ name: m.name, ingresos: Math.round(m.ingresos * 100) / 100 })
  }

  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', EN_CURSO: 'En curso',
    COMPLETADA: 'Completada', CANCELADA_HUESPED: 'Cancelada (H)',
    CANCELADA_ANFITRION: 'Cancelada (A)', RECHAZADA: 'Rechazada',
  }
  const colors: Record<string, string> = {
    PENDIENTE: '#FEF3C7', CONFIRMADA: '#D8F3DC', EN_CURSO: '#DBEAFE',
    COMPLETADA: '#E8E4DF', CANCELADA_HUESPED: '#FEE2E2',
    CANCELADA_ANFITRION: '#FEE2E2', RECHAZADA: '#FECACA',
  }
  const reservasRows = (reservasAll as unknown as { data: { estado: string }[] })?.data || []
  const statusCount: Record<string, number> = {}
  for (const r of reservasRows) {
    statusCount[r.estado] = (statusCount[r.estado] || 0) + 1
  }
  const reservasByStatus = Object.entries(statusCount).map(([estado, count]) => ({
    name: labels[estado] || estado,
    value: count,
    fill: colors[estado] || '#E8E4DF',
  }))

  const propRows = (propiedadesCiudad as unknown as { data: { ciudad: string }[] })?.data || []
  const ciudadCount: Record<string, number> = {}
  for (const p of propRows) {
    ciudadCount[p.ciudad] = (ciudadCount[p.ciudad] || 0) + 1
  }
  const propiedadesByCiudad = Object.entries(ciudadCount)
    .map(([ciudad, count]) => ({ name: ciudad, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const usersRows = (usuariosRecientes as unknown as { data: { fecha_registro: string }[] })?.data || []
  const usersByDay: { name: string; usuarios: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayKey = d.toISOString().slice(0, 10)
    const nextDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString().slice(0, 10)
    const count = usersRows.filter(u => {
      const reg = u.fecha_registro.slice(0, 10)
      return reg >= dayKey && reg < nextDay
    }).length
    usersByDay.push({
      name: d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' }),
      usuarios: count,
    })
  }

  return { ingresosByMonth, reservasByStatus, propiedadesByCiudad, usersByDay }
}

export async function getAdminTablesData() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const [reservasRes, actividadRes] = await Promise.all([
    admin.from('reservas').select(`
      id, codigo, fecha_entrada, fecha_salida, noches, total, moneda, estado, cantidad_huespedes,
      propiedad:propiedades(id, titulo, slug),
      huesped:usuarios!reservas_huesped_id_fkey(id, nombre, apellido, email, avatar_url)
    `).order('fecha_creacion', { ascending: false }).limit(8),
    admin.from('admin_audit_log').select(`
      id, accion, entidad, entidad_id, detalles, created_at,
      admin:usuarios!admin_audit_log_admin_id_fkey(id, nombre, apellido, email, avatar_url)
    `).order('created_at', { ascending: false }).limit(15),
  ])

  const reservas = (reservasRes as unknown as { data: Record<string, unknown>[] })?.data || []
  const actividad = (actividadRes as unknown as { data: Record<string, unknown>[] })?.data || []

  return { reservas, actividad }
}
