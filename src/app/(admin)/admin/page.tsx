'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, DollarSign, Users, Building2, CalendarDays,
  ArrowUpRight, Activity, Clock, Loader2, Receipt,
  ChevronDown,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import type { ValueType, NameType, Formatter } from 'recharts/types/component/DefaultTooltipContent'
import { AdminHeader, AdminStatCard, AdminEmptyState } from '@/components/admin'
import {
  getAdminStats,
  getAdminChartsData,
  getAdminTablesData,
} from '@/actions/admin-dashboard.actions'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const ESTADO_RESERVA: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-[#FEF3C7] text-[#92400E]' },
  CONFIRMADA: { label: 'Confirmada', color: 'bg-[#D8F3DC] text-[#1B4332]' },
  EN_CURSO: { label: 'En curso', color: 'bg-[#DBEAFE] text-[#1E40AF]' },
  COMPLETADA: { label: 'Completada', color: 'bg-[#E8E4DF] text-[#6B6560]' },
  CANCELADA_HUESPED: { label: 'Cancelada', color: 'bg-[#FEE2E2] text-[#991B1B]' },
  CANCELADA_ANFITRION: { label: 'Cancelada', color: 'bg-[#FEE2E2] text-[#991B1B]' },
  RECHAZADA: { label: 'Rechazada', color: 'bg-[#FEE2E2] text-[#991B1B]' },
}

const ENTIDAD_ICONS: Record<string, string> = {
  usuario: '👤', propiedad: '🏠', reserva: '📅', pago: '💳',
  verificacion: '✅', wallet: '💰', resena: '⭐', notificacion: '🔔', configuracion: '⚙️',
}

const tooltipStyle = { borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }

function formatMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(s: string) {
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `Hace ${diffDays}d`
  return formatDate(dateStr)
}

interface Stats {
  usuarios: { total: number; nuevosSemana: number }
  propiedades: { total: number; publicadas: number }
  reservas: { total: number; pendientes: number; hoy: unknown[] }
  pagos: { ingresosMes: number; ingresosMesPasado: number; crecimientoIngresos: number }
  crecimientoReservas: number
}

function CollapsibleSection({ title, subtitle, defaultOpen = true, badge, children, rightAction }: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
  rightAction?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#FDFCFA]"
      >
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A1A]">{title}</h3>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-[#9E9892]">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {rightAction}
          <ChevronDown className={`h-4 w-4 text-[#9E9892] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t border-[#E8E4DF]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex h-56 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-[#D8F3DC]" />
        <span className="text-xs text-[#9E9892]">Cargando...</span>
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[#F4F1EC]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-6 py-3.5">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#F4F1EC]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#F4F1EC]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#F4F1EC]" />
          </div>
          <div className="h-3.5 w-16 animate-pulse rounded bg-[#F4F1EC]" />
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [charts, setCharts] = useState<{
    ingresosByMonth: { name: string; ingresos: number }[]
    reservasByStatus: { name: string; value: number; fill: string }[]
    propiedadesByCiudad: { name: string; value: number }[]
    usersByDay: { name: string; usuarios: number }[]
  } | null>(null)
  const [tables, setTables] = useState<{
    reservas: Record<string, unknown>[]
    actividad: Record<string, unknown>[]
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      const res = await getAdminStats()
      if (res && 'usuarios' in res) {
        setStats(res as unknown as Stats)
        setStatsLoading(false)
      }
    } catch (err) {
      console.error('[AdminDashboard] loadStats error:', err)
      setStatsLoading(false)
    }
  }, [])

  const loadCharts = useCallback(async () => {
    try {
      const res = await getAdminChartsData()
      if (res && 'ingresosByMonth' in res) {
        setCharts(res as typeof charts)
      }
    } catch (err) {
      console.error('[AdminDashboard] loadCharts error:', err)
    }
  }, [])

  const loadTables = useCallback(async () => {
    try {
      const res = await getAdminTablesData()
      if (res && 'reservasRecientes' in res) {
        const raw = res as Record<string, unknown>
        setTables({
          reservas: (raw.reservasRecientes as Record<string, unknown>[]) || [],
          actividad: (raw.actividad as Record<string, unknown>[]) || [],
        })
      }
    } catch (err) {
      console.error('[AdminDashboard] loadTables error:', err)
    }
  }, [])

  useEffect(() => {
    startTransition(() => {
      loadStats()
      loadCharts()
      loadTables()
    })

    const interval = setInterval(() => {
      startTransition(() => {
        loadStats()
        loadTables()
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [loadStats, loadCharts, loadTables])

  const reservasHoyCount = stats?.reservas.hoy?.length ?? 0

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">

      <AdminHeader
        icon={Shield}
        titulo="Panel de Administración"
        subtitulo="Resumen general de la plataforma Boogie"
      />

      {/* ====== KPI CARDS ====== */}
      <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E8E4DF] bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-[#F4F1EC]" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-6 w-20 animate-pulse rounded bg-[#F4F1EC]" />
                <div className="h-3 w-28 animate-pulse rounded bg-[#F4F1EC]" />
              </div>
            </div>
          ))
        ) : (
          <>
            <AdminStatCard
              icon={DollarSign}
              label="Ingresos del mes"
              value={formatMoney(stats?.pagos.ingresosMes ?? 0)}
              trend={{ value: stats?.pagos.crecimientoIngresos ?? 0, label: 'vs. mes pasado' }}
              color="green"
            />
            <AdminStatCard
              icon={CalendarDays}
              label="Reservas hoy"
              value={reservasHoyCount}
              trend={{ value: stats?.crecimientoReservas ?? 0, label: 'vs. mes pasado' }}
              color="blue"
            />
            <AdminStatCard
              icon={Users}
              label="Usuarios nuevos"
              value={stats?.usuarios.nuevosSemana ?? 0}
              color="purple"
            />
            <AdminStatCard
              icon={Building2}
              label="Boogies publicados"
              value={stats?.propiedades.publicadas ?? 0}
              color="orange"
            />
          </>
        )}
      </motion.div>

      {/* ====== QUICK STATS BAR ====== */}
      <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Usuarios totales', value: stats?.usuarios.total, icon: Users, href: '/admin/usuarios' },
          { label: 'Boogies', value: stats?.propiedades.total, icon: Building2, href: '/admin/propiedades' },
          { label: 'Reservas totales', value: stats?.reservas.total, icon: Receipt, href: '/admin/reservas' },
          { label: 'Reservas pendientes', value: stats?.reservas.pendientes, icon: Clock, href: '/admin/reservas', highlight: true },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.label} href={item.href}>
              <div className={`group rounded-xl border p-3.5 transition-all hover:shadow-md ${
                item.highlight
                  ? 'border-[#E76F51]/30 bg-[#FEF3C7]/50 hover:border-[#E76F51]'
                  : 'border-[#E8E4DF] hover:border-[#52B788]'
              }`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${item.highlight ? 'text-[#E76F51]' : 'text-[#9E9892]'}`} />
                  <span className="text-[11px] text-[#6B6560]">{item.label}</span>
                </div>
                <p className={`mt-1 text-lg font-bold tabular-nums ${item.highlight ? 'text-[#E76F51]' : 'text-[#1A1A1A]'}`}>
                  {item.value ?? '—'}
                </p>
              </div>
            </Link>
          )
        })}
      </motion.div>

      {/* ====== CHECK-INS DE HOY ====== */}
      {stats?.reservas.hoy && (stats.reservas.hoy as unknown[]).length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <CollapsibleSection
            title="Check-ins de hoy"
            subtitle="Reservas que comienzan hoy"
            badge={
              <span className="rounded-full bg-[#D8F3DC] px-2 py-0.5 text-[10px] font-bold text-[#1B4332]">
                {(stats.reservas.hoy as unknown[]).length}
              </span>
            }
          >
            <div className="divide-y divide-[#F4F1EC]">
              {(stats.reservas.hoy as Record<string, unknown>[]).map((r) => {
                const huesped = r.huesped as Record<string, unknown> | null
                const propiedad = r.propiedad as Record<string, unknown> | null
                return (
                  <div key={r.id as string} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4332] text-xs font-bold text-white">
                      {huesped ? `${String(huesped.nombre || '').charAt(0)}${String(huesped.apellido || '').charAt(0)}` : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {huesped ? `${huesped.nombre} ${huesped.apellido}` : 'Huesped'}
                      </p>
                      <p className="text-xs text-[#9E9892]">
                        {propiedad?.titulo as string} · {r.noches as number} noches · {r.cantidad_huespedes as number} huespedes
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#1B4332]">{formatMoney(Number(r.total || 0))}</span>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>
        </motion.div>
      )}

      {/* ====== CHARTS ====== */}
      <motion.div variants={fadeUp} className="mb-6 space-y-4">

        {/* Ingresos + Usuarios */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CollapsibleSection title="Ingresos mensuales" subtitle="Pagos verificados · Últimos 12 meses">
            <div className="p-6 pt-4">
              {!charts ? <ChartSkeleton /> : (
                <AreaChart width={500} height={208} data={charts.ingresosByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradAdminIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B4332" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#1B4332" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={{ stroke: '#E8E4DF' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={((value: ValueType) => [formatMoney(Number(value)), 'Ingresos']) as Formatter<ValueType, NameType>} />
                  <Area type="monotone" dataKey="ingresos" stroke="#1B4332" strokeWidth={2.5} fill="url(#gradAdminIngresos)" />
                </AreaChart>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Nuevos usuarios" subtitle="Registros diarios · Últimos 14 días">
            <div className="p-6 pt-4">
              {!charts ? <ChartSkeleton /> : (
                <BarChart width={500} height={208} data={charts.usersByDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9E9892' }} axisLine={{ stroke: '#E8E4DF' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={((value: ValueType) => [value, 'Usuarios']) as Formatter<ValueType, NameType>} />
                  <Bar dataKey="usuarios" fill="#D8F3DC" stroke="#1B4332" strokeWidth={1} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* Reservas por Estado + Propiedades por Ciudad */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CollapsibleSection title="Reservas por estado" subtitle="Distribución total" defaultOpen={false}>
            <div className="p-6 pt-4">
              {!charts || !Array.isArray(charts.reservasByStatus) || !charts.reservasByStatus.some(r => r.value > 0) ? (
                <div className="flex h-52 items-center justify-center text-sm text-[#9E9892]">
                  {!charts ? <ChartSkeleton /> : 'Sin datos'}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center" style={{ height: 208 }}>
                    <PieChart width={400} height={208}>
                      <Pie
                        data={charts.reservasByStatus.filter(r => r.value > 0)}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                        paddingAngle={3} dataKey="value" stroke="none"
                      >
                        {charts.reservasByStatus.filter(r => r.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={((value: ValueType, name: NameType) => [value, name]) as Formatter<ValueType, NameType>} />
                    </PieChart>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {charts.reservasByStatus.filter(r => r.value > 0).map((r) => (
                      <div key={r.name} className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                        <span className="text-[10px] text-[#6B6560]">{r.name} ({r.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Boogies por ciudad" subtitle="Boogies publicados" defaultOpen={false}>
            <div className="p-6 pt-4">
              {!charts || !Array.isArray(charts.propiedadesByCiudad) || !charts.propiedadesByCiudad.length ? (
                <div className="flex h-52 items-center justify-center text-sm text-[#9E9892]">
                  {!charts ? <ChartSkeleton /> : 'Sin datos'}
                </div>
              ) : (
                <div style={{ height: 208 }}>
                  <BarChart width={500} height={208} data={charts.propiedadesByCiudad} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B6560' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={tooltipStyle} formatter={((value: ValueType) => [value, 'Boogies']) as Formatter<ValueType, NameType>} />
                    <Bar dataKey="value" fill="#52B788" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>
      </motion.div>

      {/* ====== BOTTOM ROW: RESERVAS + ACTIVIDAD ====== */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        <div className="lg:col-span-3">
          <CollapsibleSection
            title="Reservas recientes"
            subtitle="Últimas reservas creadas"
            rightAction={
              <Link
                href="/admin/reservas"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F]"
              >
                Ver todas <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {!tables ? <TableSkeleton rows={5} /> : tables.reservas.length === 0 ? (
              <AdminEmptyState icon={Receipt} titulo="Sin reservas" />
            ) : (
              <div className="divide-y divide-[#F4F1EC]">
                {tables.reservas.map((r) => {
                  const estado = (r.estado as string) || 'PENDIENTE'
                  const config = ESTADO_RESERVA[estado] || ESTADO_RESERVA.PENDIENTE
                  const huesped = r.huesped as Record<string, unknown> | null
                  const propiedad = r.propiedad as Record<string, unknown> | null
                  return (
                    <div key={r.id as string} className="flex items-center gap-3 px-6 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F8F6F3] text-[11px] font-semibold text-[#1A1A1A]">
                        {huesped ? `${String(huesped.nombre || '').charAt(0)}${String(huesped.apellido || '').charAt(0)}` : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">
                          {huesped ? `${huesped.nombre} ${huesped.apellido}` : 'Sin huesped'}
                        </p>
                        <p className="truncate text-[11px] text-[#9E9892]">
                          {propiedad?.titulo as string || '—'} · {formatDate(r.fecha_entrada as string)} → {formatDate(r.fecha_salida as string)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[#1A1A1A] tabular-nums">{formatMoney(Number(r.total || 0))}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>
        </div>

        <div className="lg:col-span-2">
          <CollapsibleSection
            title="Actividad admin"
            subtitle="Últimas acciones"
            rightAction={
              <Link
                href="/admin/auditoria"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F]"
              >
                Ver todo <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {!tables ? <TableSkeleton rows={5} /> : tables.actividad.length === 0 ? (
              <AdminEmptyState icon={Activity} titulo="Sin actividad" />
            ) : (
              <div className="divide-y divide-[#F4F1EC]">
                {tables.actividad.map((log) => {
                  const adminData = log.admin as Record<string, unknown> | null
                  return (
                    <div key={log.id as string} className="flex items-start gap-3 px-6 py-2.5">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#F8F6F3] text-xs">
                        {ENTIDAD_ICONS[(log.entidad as string) || ''] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-[#1A1A1A] truncate">
                          {adminData ? `${adminData.nombre} ${adminData.apellido}` : 'Admin'}
                          <span className="font-normal text-[#6B6560]"> — {log.accion as string}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#9E9892]">{timeAgo(log.created_at as string)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </motion.div>

    </motion.div>
  )
}
