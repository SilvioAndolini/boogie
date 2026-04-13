'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  CalendarDays, Search, Loader2, Clock, CheckCircle2, XCircle,
  PlayCircle, ArrowRight, DollarSign,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getReservasAdmin, getReservasStatsAdmin, accionReservaAdmin } from '@/actions/admin-reservas.actions'
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_COLORS } from '@/types/reserva'
import type { EstadoReserva } from '@/types'

interface Reserva {
  id: string
  codigo: string
  fecha_entrada: string
  fecha_salida: string
  noches: number
  precio_por_noche: number
  subtotal: number
  comision_plataforma: number
  total: number
  moneda: string
  estado: EstadoReserva
  cantidad_huespedes: number
  notas_huesped: string | null
  fecha_creacion: string
  propiedades: { id: string; titulo: string; slug: string; ciudad: string } | null
  usuarios: { id: string; nombre: string; apellido: string; email: string } | null
}

const ESTADO_ICONS: Record<string, typeof Clock> = {
  PENDIENTE: Clock,
  CONFIRMADA: CheckCircle2,
  EN_CURSO: PlayCircle,
  COMPLETADA: CheckCircle2,
  CANCELADA_HUESPED: XCircle,
  CANCELADA_ANFITRION: XCircle,
  RECHAZADA: XCircle,
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function formatMoney(n: number, moneda = 'USD') {
  if (moneda === 'VES') return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function formatDate(s: string) {
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ESTADOS_FILTRO = ['TODOS', 'PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA'] as const

export default function AdminReservasPage() {
  const router = useRouter()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [stats, setStats] = useState({ pendientes: 0, confirmadas: 0, enCurso: 0, completadas: 0, canceladas: 0 })
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [accionando, setAccionando] = useState<string | null>(null)

  const cargarDatos = async () => {
    const [resReservas, resStats] = await Promise.all([
      getReservasAdmin({ estado: filtroEstado, busqueda }),
      getReservasStatsAdmin(),
    ])
    if (resReservas.error) {
      toast.error(resReservas.error)
    } else {
      setReservas((resReservas.data || []) as unknown as Reserva[])
    }
    if ('PENDIENTE' in resStats) {
      setStats(resStats as typeof stats)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [filtroEstado])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cargando) cargarDatos()
    }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  const handleAccion = async (reservaId: string, accion: string) => {
    setAccionando(reservaId)
    const formData = new FormData()
    formData.append('reservaId', reservaId)
    formData.append('accion', accion)
    const res = await accionReservaAdmin(formData)
    if (res.error) toast.error(res.error)
    else { toast.success(`Reserva ${accion === 'confirmar' ? 'confirmada' : accion === 'rechazar' ? 'rechazada' : 'cancelada'}`); cargarDatos() }
    setAccionando(null)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-5xl">

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-4 h-20 w-20 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Gestión de Reservas</h1>
            <p className="text-sm text-white/60 mt-0.5">Administra y da seguimiento a todas las reservas</p>
          </div>
        </div>

        <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-5">
          {[
            { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'text-[#FCD34D]' },
            { label: 'Confirmadas', value: stats.confirmadas, icon: CheckCircle2, color: 'text-white' },
            { label: 'En curso', value: stats.enCurso, icon: PlayCircle, color: 'text-white' },
            { label: 'Completadas', value: stats.completadas, icon: CheckCircle2, color: 'text-white' },
            { label: 'Canceladas', value: stats.canceladas, icon: XCircle, color: 'text-white/60' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3 border-r border-white/10 last:border-r-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[9px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ====== TOOLBAR ====== */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar por código o notas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-[#E8E4DF] bg-white pl-10 h-11 rounded-xl"
          />
        </div>
      </motion.div>

      {/* ====== FILTROS ESTADO ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#E8E4DF] bg-white p-1">
        {ESTADOS_FILTRO.map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              filtroEstado === e ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {e === 'TODOS' ? 'Todos' : ESTADO_RESERVA_LABELS[e]}
          </button>
        ))}
      </motion.div>

      {/* ====== LISTA RESERVAS ====== */}
      <motion.div variants={stagger} className="space-y-2">
        {reservas.map((r) => {
          const EstadoIcon = ESTADO_ICONS[r.estado] || Clock
          const prop = r.propiedades
          const huesped = r.usuarios
          const esPendiente = r.estado === 'PENDIENTE'

          return (
            <motion.div key={r.id} variants={fadeUp}>
              <div className="group rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden transition-all hover:shadow-sm">
                <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C]">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[#1A1A1A] truncate text-sm">
                        {prop?.titulo || 'Propiedad eliminada'}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${ESTADO_RESERVA_COLORS[r.estado]}`}>
                        {ESTADO_RESERVA_LABELS[r.estado]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#9E9892]">
                      <span>{huesped ? `${huesped.nombre} ${huesped.apellido}` : '—'}</span>
                      <span className="text-[#E8E4DF]">·</span>
                      <span>{formatDate(r.fecha_entrada)} → {formatDate(r.fecha_salida)}</span>
                      <span className="text-[#E8E4DF]">·</span>
                      <span>{r.noches} noche{r.noches !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1A1A1A]">{formatMoney(Number(r.total), r.moneda)}</p>
                      <p className="text-[10px] text-[#9E9892]">{r.cantidad_huespedes} huésped{r.cantidad_huespedes !== 1 ? 'es' : ''}</p>
                    </div>

                    {esPendiente && (
                      <div className="flex gap-1">
                        <button
                          title="Confirmar"
                          disabled={accionando === r.id}
                          onClick={() => handleAccion(r.id, 'confirmar')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#D8F3DC] hover:text-[#1B4332]"
                        >
                          {accionando === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          title="Rechazar"
                          disabled={accionando === r.id}
                          onClick={() => handleAccion(r.id, 'rechazar')}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#FEE2E2] hover:text-[#C1121F]"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      title="Ver detalle"
                      onClick={() => router.push(`/admin/reservas/${r.id}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#F8F6F3] hover:text-[#1A1A1A]"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {reservas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9E9892]">
          <CalendarDays className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No se encontraron reservas</p>
          <p className="text-xs mt-1">Intenta ajustar los filtros o la búsqueda</p>
        </div>
      )}
    </motion.div>
  )
}
