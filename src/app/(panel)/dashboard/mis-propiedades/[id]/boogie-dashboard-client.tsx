'use client'

import { useState, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, BarChart3, Calendar, Receipt, Pencil, Check,
  DollarSign, TrendingUp, Users, Clock, Loader2,
  Plus, Trash2, ChevronLeft, ChevronRight, MapPin,
  Eye, Bed, Bath, DoorOpen,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { toast } from 'sonner'
import type { ValueType, NameType, Formatter } from 'recharts/types/component/DefaultTooltipContent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { crearGastoMantenimiento, eliminarGastoMantenimiento } from '@/actions/boogie-dashboard.actions'

type DashboardData = {
  propiedad: Record<string, unknown>
  reservas: Record<string, unknown>[]
  gastos: Record<string, unknown>[]
  fechasBloqueadas: Record<string, unknown>[]
  preciosEspeciales: Record<string, unknown>[]
  kpis: {
    totalIngresos: number
    totalGastos: number
    totalGastosVes: number
    balance: number
    totalReservas: number
    reservasActivas: number
    reservasConfirmadas: number
    totalNoches: number
    tarifaPromedio: number
  }
  ingresosByMonth: Record<string, number>
  gastosByMonth: Record<string, number>
  ocupadas: Array<{ fecha_entrada: string; fecha_salida: string; estado: string; huesped?: string }>
}

const CATEGORIAS_GASTO: Record<string, string> = {
  reparacion: 'Reparación',
  limpieza: 'Limpieza',
  mobiliario: 'Mobiliario',
  servicios: 'Servicios',
  otro: 'Otro',
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

const ESTADO_PUBLICACION: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-white/80 text-[#6B6560]' },
  PUBLICADA: { label: 'Publicada', color: 'bg-[#D8F3DC] text-[#1B4332]' },
  PAUSADA: { label: 'Pausada', color: 'bg-[#FEF3C7] text-[#92400E]' },
}

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: BarChart3 },
  { id: 'reservas', label: 'Reservas', icon: Receipt },
  { id: 'calendario', label: 'Calendario', icon: Calendar },
  { id: 'gastos', label: 'Gastos', icon: DollarSign },
] as const

type TabId = (typeof TABS)[number]['id']

const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatMoney(n: number, moneda = 'USD') {
  if (moneda === 'VES') return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function formatDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function BoogieDashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('resumen')
  const [showGastoForm, setShowGastoForm] = useState(false)
  const [gastoMoneda, setGastoMoneda] = useState('USD')
  const [gastoCategoria, setGastoCategoria] = useState('')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [guardandoGasto, setGuardandoGasto] = useState(false)
  const [eliminandoGasto, setEliminandoGasto] = useState<string | null>(null)

  const propiedad = data.propiedad
  const kpis = data.kpis
  const imagenes = (propiedad.imagenes as { url: string; es_principal: boolean }[]) || []
  const imagenPrincipal = imagenes.find((i) => i.es_principal)?.url || imagenes[0]?.url
  const propId = propiedad.id as string
  const estadoPub = (propiedad.estado_publicacion as string) || 'BORRADOR'
  const pubConfig = ESTADO_PUBLICACION[estadoPub] || ESTADO_PUBLICACION.BORRADOR

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  function getDayStatus(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    for (const fb of data.fechasBloqueadas) {
      const inicio = (fb.fecha_inicio as string).slice(0, 10)
      const fin = (fb.fecha_fin as string).slice(0, 10)
      if (dateStr >= inicio && dateStr <= fin) return { type: 'bloqueada' as const }
    }
    for (const r of data.ocupadas) {
      const inicio = r.fecha_entrada.slice(0, 10)
      const fin = r.fecha_salida.slice(0, 10)
      if (dateStr >= inicio && dateStr < fin) {
        if (r.estado === 'CONFIRMADA' || r.estado === 'EN_CURSO') return { type: 'ocupada' as const, huesped: r.huesped }
        if (r.estado === 'PENDIENTE') return { type: 'pendiente' as const, huesped: r.huesped }
      }
    }
    return { type: 'disponible' as const }
  }

  const handleCrearGasto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGuardandoGasto(true)
    const formData = new FormData(e.currentTarget)
    formData.append('propiedadId', propId)
    const res = await crearGastoMantenimiento(formData)
    if (res.error) toast.error(res.error)
    else { toast.success('Gasto registrado'); setShowGastoForm(false); router.refresh() }
    setGuardandoGasto(false)
  }

  const handleEliminarGasto = async (gastoId: string) => {
    setEliminandoGasto(gastoId)
    const res = await eliminarGastoMantenimiento(gastoId, propId)
    if (res.error) toast.error(res.error)
    else { toast.success('Gasto eliminado'); router.refresh() }
    setEliminandoGasto(null)
  }

  const chartData = (() => {
    const allMonths = Object.keys({ ...data.ingresosByMonth, ...data.gastosByMonth }).sort()
    const last12 = allMonths.slice(-12)
    if (last12.length === 0) {
      const now = new Date()
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        return { name: meses[d.getMonth()], ingresos: 0, gastos: 0, balance: 0 }
      })
    }
    return last12.map((m) => {
      const [, mm] = m.split('-')
      const ing = data.ingresosByMonth[m] || 0
      const gas = data.gastosByMonth[m] || 0
      return { name: meses[parseInt(mm) - 1], ingresos: ing, gastos: gas, balance: ing - gas }
    })
  })()

  const ingresosTotales = chartData.reduce((a, c) => a + c.ingresos, 0)

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-6xl">

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-4 h-20 w-20 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/20 sm:h-24 sm:w-24">
            {imagenPrincipal ? (
              <Image fill src={imagenPrincipal} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-bold text-white">B</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl truncate">{propiedad.titulo as string}</h1>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${pubConfig.color}`}>
                {pubConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/60 text-sm mb-3">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{propiedad.ciudad as string}, {propiedad.estado as string}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs">
              <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{propiedad.habitaciones as number} hab.</span>
              <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{propiedad.banos as number} baño{(propiedad.banos as number) !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" />{propiedad.camas as number} cama{(propiedad.camas as number) !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{propiedad.capacidad_maxima as number} huéspedes</span>
              <span className="font-bold text-white">{formatMoney(propiedad.precio_por_noche as number, propiedad.moneda as string)}<span className="font-normal text-white/50">/noche</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push(`/propiedades/${propiedad.slug || propId}`)}
              className="flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Vista pública</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/mis-propiedades')}
              className="flex h-10 items-center justify-center rounded-xl bg-white/10 px-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'Ingresos', value: formatMoney(kpis.totalIngresos), icon: DollarSign },
            { label: 'Balance', value: formatMoney(kpis.balance), icon: TrendingUp },
            { label: 'Reservas', value: String(kpis.totalReservas), icon: Receipt },
            { label: 'Activas', value: String(kpis.reservasActivas), icon: Clock },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10 last:border-r-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <item.icon className="h-3.5 w-3.5 text-white/60" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ====== TABS + EDIT TOGGLE ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 gap-1 rounded-xl border border-[#E8E4DF] bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push(`/dashboard/mis-propiedades/${propId}/editar`)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E4DF] bg-white text-[#6B6560] transition-all hover:bg-[#F8F6F3] shrink-0"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </motion.div>

      {/* ====== CONTENT ====== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>

            {/* ====== RESUMEN ====== */}
            {activeTab === 'resumen' && (
              <motion.div variants={stagger} initial="hidden" animate="visible">
                <motion.div variants={fadeUp} className="mb-6 rounded-2xl border border-[#E8E4DF] bg-white p-6">
                  <h3 className="mb-1 text-sm font-bold text-[#1A1A1A]">Ingresos vs Gastos</h3>
                  <p className="mb-5 text-xs text-[#9E9892]">Evolución mensual de los últimos 12 meses</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={{ stroke: '#E8E4DF' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={((value: ValueType, name: NameType) => [formatMoney(Number(value ?? 0)), name === 'ingresos' ? 'Ingresos' : 'Gastos']) as Formatter<ValueType, NameType>}
                        />
                        <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2.5} fill="url(#gradIngresos)" />
                        <Area type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2.5} fill="url(#gradGastos)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex items-center gap-5">
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /><span className="text-xs text-[#9E9892]">Ingresos</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /><span className="text-xs text-[#9E9892]">Gastos</span></div>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="mb-6 rounded-2xl border border-[#E8E4DF] bg-white p-6">
                  <h3 className="mb-1 text-sm font-bold text-[#1A1A1A]">Balance neto mensual</h3>
                  <p className="mb-5 text-xs text-[#9E9892]">Diferencia entre ingresos y gastos por mes</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={{ stroke: '#E8E4DF' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                          formatter={((value: ValueType) => [formatMoney(Number(value ?? 0)), 'Balance']) as Formatter<ValueType, NameType>}
                        />
                        <Bar dataKey="balance" radius={[6, 6, 0, 0]} fill="#1B4332" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC]"><Clock className="h-4 w-4 text-[#1B4332]" /></div>
                      <span className="text-xs font-medium text-[#9E9892]">Noches reservadas</span>
                    </div>
                    <p className="text-2xl font-extrabold text-[#1A1A1A] tabular-nums">{kpis.totalNoches}</p>
                  </motion.div>
                  <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DBEAFE]"><DollarSign className="h-4 w-4 text-[#1E40AF]" /></div>
                      <span className="text-xs font-medium text-[#9E9892]">Tarifa promedio</span>
                    </div>
                    <p className="text-2xl font-extrabold text-[#1A1A1A] tabular-nums">{formatMoney(kpis.tarifaPromedio)}</p>
                  </motion.div>
                  <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEE2E2]"><DollarSign className="h-4 w-4 text-[#991B1B]" /></div>
                      <span className="text-xs font-medium text-[#9E9892]">Gastos</span>
                    </div>
                    <p className="text-2xl font-extrabold text-[#1A1A1A] tabular-nums">{formatMoney(kpis.totalGastos)}</p>
                    {kpis.totalGastosVes > 0 && <p className="text-xs text-[#9E9892] mt-0.5">+ {formatMoney(kpis.totalGastosVes, 'VES')}</p>}
                  </motion.div>
                </div>

                {data.reservas.filter(r => ['CONFIRMADA', 'PENDIENTE', 'EN_CURSO'].includes(r.estado as string)).length > 0 && (
                  <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
                    <h3 className="mb-4 text-sm font-bold text-[#1A1A1A]">Próximas reservas</h3>
                    <div className="space-y-2">
                      {data.reservas
                        .filter(r => ['CONFIRMADA', 'PENDIENTE', 'EN_CURSO'].includes(r.estado as string))
                        .slice(0, 5)
                        .map((r) => {
                          const est = ESTADO_RESERVA[r.estado as string] || ESTADO_RESERVA.PENDIENTE
                          const h = r.huesped as Record<string, unknown> | null
                          return (
                            <div key={r.id as string} className="flex items-center gap-4 rounded-xl border border-[#F4F1EC] p-3 hover:bg-[#FDFCFA] transition-colors">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8F3DC] text-xs font-bold text-[#1B4332]">
                                {(h?.nombre as string || '?').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1A1A1A] truncate">{h ? `${h.nombre || ''} ${h.apellido || ''}`.trim() : 'Huésped'}</p>
                                <p className="text-xs text-[#9E9892]">{formatDate(r.fecha_entrada as string)} — {formatDate(r.fecha_salida as string)}</p>
                              </div>
                              <Badge className={est.color}>{est.label}</Badge>
                              <span className="text-sm font-bold text-[#1A1A1A]">{formatMoney(r.monto_total as number)}</span>
                            </div>
                          )
                        })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ====== RESERVAS ====== */}
            {activeTab === 'reservas' && (
              <div className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E8E4DF] bg-[#FDFCFA]">
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Huésped</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Entrada</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Salida</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Noches</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Monto</th>
                        <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reservas.length === 0 ? (
                        <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-[#9E9892]">No hay reservas para este boogie</td></tr>
                      ) : data.reservas.map((r) => {
                        const est = ESTADO_RESERVA[r.estado as string] || ESTADO_RESERVA.PENDIENTE
                        const h = r.huesped as Record<string, unknown> | null
                        const ent = new Date(r.fecha_entrada as string)
                        const sal = new Date(r.fecha_salida as string)
                        const noches = Math.max(1, Math.ceil((sal.getTime() - ent.getTime()) / (1000 * 60 * 60 * 24)))
                        return (
                          <tr key={r.id as string} className="border-b border-[#F4F1EC] hover:bg-[#FDFCFA] transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F3DC] text-xs font-bold text-[#1B4332]">{(h?.nombre as string || '?').charAt(0)}</div>
                                <div>
                                  <p className="text-sm font-medium text-[#1A1A1A]">{h ? `${h.nombre || ''} ${h.apellido || ''}`.trim() : 'Huésped'}</p>
                                  <p className="text-xs text-[#9E9892]">{h?.email as string || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-[#4A4540]">{formatDate(r.fecha_entrada as string)}</td>
                            <td className="px-5 py-3 text-sm text-[#4A4540]">{formatDate(r.fecha_salida as string)}</td>
                            <td className="px-5 py-3 text-sm text-[#4A4540] tabular-nums">{noches}</td>
                            <td className="px-5 py-3 text-sm font-bold text-[#1A1A1A]">{formatMoney(r.monto_total as number)}</td>
                            <td className="px-5 py-3"><Badge className={est.color}>{est.label}</Badge></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ====== CALENDARIO ====== */}
            {activeTab === 'calendario' && (
              <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E4DF] hover:bg-[#F8F6F3] transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                  <h3 className="text-base font-bold text-[#1A1A1A]">{meses[calMonth]} {calYear}</h3>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E8E4DF] hover:bg-[#F8F6F3] transition-colors"><ChevronRight className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {diasSemana.map(d => <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const s = getDayStatus(day)
                    const d = new Date(calYear, calMonth, day)
                    const isPast = d < today
                    const isToday = d.getTime() === today.getTime()
                    let bg = 'bg-white hover:bg-[#F8F6F3]'
                    let tc = 'text-[#1A1A1A]'
                    let dot = null
                    if (s.type === 'ocupada') { bg = 'bg-[#FEE2E2]'; tc = 'text-[#991B1B]'; dot = <div className="h-1 w-1 rounded-full bg-[#EF4444] mt-0.5" /> }
                    else if (s.type === 'pendiente') { bg = 'bg-[#FEF3C7]'; tc = 'text-[#92400E]'; dot = <div className="h-1 w-1 rounded-full bg-[#F59E0B] mt-0.5" /> }
                    else if (s.type === 'bloqueada') { bg = 'bg-[#F4F1EC]'; tc = 'text-[#9E9892]'; dot = <div className="h-1 w-1 rounded-full bg-[#9E9892] mt-0.5" /> }
                    if (isPast && s.type === 'disponible') tc = 'text-[#D4CFC9]'
                    return (
                      <div key={day} className={`flex flex-col items-center rounded-lg py-2 text-xs transition-colors ${bg} ${isToday ? 'ring-2 ring-[#1B4332]' : ''}`} title={s.type !== 'disponible' ? (s.huesped ? `${s.huesped}` : s.type) : undefined}>
                        <span className={`font-medium ${tc}`}>{day}</span>
                        {dot}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#F4F1EC] pt-4">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-white border border-[#E8E4DF]" /><span className="text-[10px] text-[#9E9892]">Disponible</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-[#FEE2E2]" /><span className="text-[10px] text-[#9E9892]">Ocupada</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-[#FEF3C7]" /><span className="text-[10px] text-[#9E9892]">Pendiente</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-[#F4F1EC]" /><span className="text-[10px] text-[#9E9892]">Bloqueada</span></div>
                </div>
              </div>
            )}

            {/* ====== GASTOS ====== */}
            {activeTab === 'gastos' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Gastos de mantenimiento</h3>
                    <p className="text-xs text-[#9E9892]">Total: {formatMoney(kpis.totalGastos)}{kpis.totalGastosVes > 0 ? ` + ${formatMoney(kpis.totalGastosVes, 'VES')}` : ''}</p>
                  </div>
                  <Button className="bg-[#1B4332] text-white hover:bg-[#2D6A4F] h-10" onClick={() => setShowGastoForm(!showGastoForm)}>
                    <Plus className="mr-2 h-4 w-4" />Agregar gasto
                  </Button>
                </div>

                {chartData.some(c => c.gastos > 0) && (
                  <div className="mb-6 rounded-2xl border border-[#E8E4DF] bg-white p-6">
                    <h3 className="mb-1 text-sm font-bold text-[#1A1A1A]">Gastos por mes</h3>
                    <p className="mb-4 text-xs text-[#9E9892]">Distribución cronológica de gastos</p>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.filter(c => c.gastos > 0 || c.ingresos > 0)} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={{ stroke: '#E8E4DF' }} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12 }} formatter={((value: ValueType, name: NameType) => [formatMoney(Number(value ?? 0)), name === 'ingresos' ? 'Ingresos' : 'Gastos']) as Formatter<ValueType, NameType>} />
                          <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="ingresos" />
                          <Bar dataKey="gastos" fill="#EF4444" radius={[4, 4, 0, 0]} name="gastos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {showGastoForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="mb-6 overflow-hidden" onSubmit={handleCrearGasto}>
                      <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
                        <h4 className="mb-4 text-sm font-bold text-[#1A1A1A]">Nuevo gasto</h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1.5"><label className="text-xs font-semibold text-[#6B6560]">Descripción</label><Input name="descripcion" placeholder="Ej: Reparación de aire" required className="h-11 border-[#E8E4DF] bg-[#FDFCFA]" /></div>
                          <div className="space-y-1.5"><label className="text-xs font-semibold text-[#6B6560]">Monto</label><Input name="monto" type="number" step="0.01" min="0.01" placeholder="0.00" required className="h-11 border-[#E8E4DF] bg-[#FDFCFA]" /></div>
                         <div className="space-y-1.5"><Label className="text-xs font-semibold text-[#6B6560]">Moneda</Label><input type="hidden" name="moneda" value={gastoMoneda} /><Select value={gastoMoneda} onValueChange={(v) => setGastoMoneda(v ?? 'USD')}><SelectTrigger className="h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus:ring-[#1B4332]/20"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="VES">VES (Bs.)</SelectItem></SelectContent></Select></div>
                         <div className="space-y-1.5"><Label className="text-xs font-semibold text-[#6B6560]">Categoría</Label><input type="hidden" name="categoria" value={gastoCategoria} /><Select value={gastoCategoria} onValueChange={(v) => setGastoCategoria(v ?? '')}><SelectTrigger className="h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus:ring-[#1B4332]/20"><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{Object.entries(CATEGORIAS_GASTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                          <div className="space-y-1.5"><label className="text-xs font-semibold text-[#6B6560]">Fecha</label><Input name="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-11 border-[#E8E4DF] bg-[#FDFCFA]" /></div>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <Button type="button" variant="outline" className="border-[#E8E4DF]" onClick={() => setShowGastoForm(false)}>Cancelar</Button>
                          <Button type="submit" className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]" disabled={guardandoGasto}>{guardandoGasto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Guardar</Button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E8E4DF] bg-[#FDFCFA]">
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Fecha</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Descripción</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Categoría</th>
                          <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9E9892]">Monto</th>
                          <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#9E9892]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.gastos.length === 0 ? (
                          <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-[#9E9892]">No hay gastos registrados</td></tr>
                        ) : data.gastos.map((g) => (
                          <tr key={g.id as string} className="border-b border-[#F4F1EC] hover:bg-[#FDFCFA] transition-colors">
                            <td className="px-5 py-3 text-sm text-[#4A4540]">{formatDate(g.fecha as string)}</td>
                            <td className="px-5 py-3 text-sm font-medium text-[#1A1A1A]">{g.descripcion as string}</td>
                            <td className="px-5 py-3"><Badge className="bg-[#F8F6F3] text-[#6B6560]">{CATEGORIAS_GASTO[g.categoria as string] || (g.categoria as string)}</Badge></td>
                            <td className="px-5 py-3 text-sm font-bold text-[#1A1A1A]">{formatMoney(g.monto as number, g.moneda as string)}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => handleEliminarGasto(g.id as string)} disabled={eliminandoGasto === (g.id as string)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#D4CFC9] transition-colors hover:bg-[#FEE2E2] hover:text-[#EF4444] ml-auto">
                                {eliminandoGasto === (g.id as string) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
      </motion.div>
    </motion.div>
  )
}


