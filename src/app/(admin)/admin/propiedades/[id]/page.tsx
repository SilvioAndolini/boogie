'use client'

import { useState, useEffect, Suspense, lazy, startTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Star, Eye, Users, Bed, Bath, DoorOpen,
  CalendarDays, DollarSign, ArrowLeft, Sparkles, Pause, Play,
  Trash2, Loader2, Shield, Clock, Receipt, ExternalLink,
  ChevronDown, User, TrendingUp, BarChart3, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AdminHeader, AdminEmptyState, AdminConfirmDialog, AdminStatCard } from '@/components/admin'
import { getPropiedadDetalleAdmin, actualizarPropiedadAdmin, eliminarPropiedadAdmin, getPropiedadIngresos } from '@/actions/admin-propiedades.actions'
import { TIPOS_PROPIEDAD } from '@/lib/constants'

const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })))
const Area = lazy(() => import('recharts').then(m => ({ default: m.Area })))
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })))
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })))
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })))
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })))
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })))
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })))
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })))
const Legend = lazy(() => import('recharts').then(m => ({ default: m.Legend })))

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-[#F8F6F3] text-[#6B6560]' },
  PENDIENTE_REVISION: { label: 'Pendiente', color: 'bg-[#FEF3C7] text-[#92400E]' },
  PUBLICADA: { label: 'Publicada', color: 'bg-[#D8F3DC] text-[#1B4332]' },
  PAUSADA: { label: 'Pausada', color: 'bg-[#FEF3C7] text-[#92400E]' },
  SUSPENDIDA: { label: 'Suspendida', color: 'bg-[#FEE2E2] text-[#C1121F]' },
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

const TABS = [
  { id: 'info' as const, label: 'Información', icon: Info },
  { id: 'rendimiento' as const, label: 'Rendimiento', icon: BarChart3 },
]

type TabId = (typeof TABS)[number]['id']

function formatMoney(n: number, moneda?: string) {
  if (moneda === 'VES') return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function formatDate(s: string) {
  if (!s) return '—'
  const d = s.includes('T') ? new Date(s) : new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ChartSkeleton() {
  return (
    <div className="flex h-52 items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-[#D8F3DC]" />
    </div>
  )
}

export default function AdminPropiedadDetallePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<{ propiedad: Record<string, unknown>; reservas: Record<string, unknown>[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [showReservas, setShowReservas] = useState(true)
  const [showResenas, setShowResenas] = useState(true)

  const [ingresosData, setIngresosData] = useState<{
    reservas: Record<string, unknown>[]
    kpis: {
      totalIngresos: number; totalComisiones: number; totalComisionesAnfitrion: number
      ingresosNetos: number; totalNoches: number; totalHuespedes: number
      tarifaPromedio: number; totalReservas: number; ingresosMes: number
      ingresosMesPasado: number; crecimiento: number
    }
    ingresosByMonth: { name: string; ingresos: number; comisiones: number }[]
  } | null>(null)
  const [ingresosLoading, setIngresosLoading] = useState(false)

  useEffect(() => {
    getPropiedadDetalleAdmin(id).then((res) => {
      if (res && 'propiedad' in res) {
        setData(res as { propiedad: Record<string, unknown>; reservas: Record<string, unknown>[] })
      } else {
        toast.error('Boogie no encontrado')
        router.push('/admin/propiedades')
      }
      setLoading(false)
    })
  }, [id, router])

  const loadIngresos = async () => {
    if (ingresosData) return
    setIngresosLoading(true)
    const res = await getPropiedadIngresos(id)
    if (res && 'kpis' in res) setIngresosData(res as unknown as typeof ingresosData)
    setIngresosLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'rendimiento') loadIngresos()
  }, [activeTab])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  if (!data) return null

  const p = data.propiedad
  const estadoPub = (p.estado_publicacion as string) || 'BORRADOR'
  const estadoConfig = ESTADO_CONFIG[estadoPub] || ESTADO_CONFIG.BORRADOR
  const propietario = p.propietario as Record<string, unknown> | null
  const imagenes = (p.imagenes as { url: string; es_principal: boolean }[]) || []
  const imagenPrincipal = imagenes.find(i => i.es_principal)?.url || imagenes[0]?.url
  const amenidades = (p.amenidades as { amenidad_id: string; amenidad: { nombre: string } }[]) || []
  const resenas = (p.resenas as Record<string, unknown>[]) || []

  const handleEstado = async (nuevoEstado: string) => {
    setActionLoading(true)
    const formData = new FormData()
    formData.append('propiedadId', id)
    formData.append('estadoPublicacion', nuevoEstado)
    const res = await actualizarPropiedadAdmin(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Estado actualizado')
      const updated = await getPropiedadDetalleAdmin(id)
      if (updated && 'propiedad' in updated) setData(updated as typeof data)
    }
    setActionLoading(false)
  }

  const handleDestacar = async () => {
    setActionLoading(true)
    const formData = new FormData()
    formData.append('propiedadId', id)
    formData.append('destacada', String(!p.destacada))
    const res = await actualizarPropiedadAdmin(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success(p.destacada ? 'Destacada removida' : 'Boogie destacado')
      const updated = await getPropiedadDetalleAdmin(id)
      if (updated && 'propiedad' in updated) setData(updated as typeof data)
    }
    setActionLoading(false)
  }

  const handleEliminar = async () => {
    setActionLoading(true)
    const formData = new FormData()
    formData.append('propiedadId', id)
    const res = await eliminarPropiedadAdmin(formData)
    if (res.error) { toast.error(res.error); setActionLoading(false) }
    else { toast.success('Boogie eliminado'); router.push('/admin/propiedades') }
  }

  return (
    <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible">

      <motion.div variants={fadeUp}>
        <button
          onClick={() => router.push('/admin/propiedades')}
          className="mb-4 flex items-center gap-1.5 text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Boogies
        </button>
      </motion.div>

      {/* ====== HERO ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/20 sm:h-24 sm:w-24">
            {imagenPrincipal ? (
              <Image fill src={imagenPrincipal} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-bold text-white">B</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{p.titulo as string}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${estadoConfig.color}`}>{estadoConfig.label}</span>
              {p.destacada ? <span className="flex items-center gap-0.5 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#92400E]"><Sparkles className="h-3 w-3" />Destacada</span> : null}
            </div>
            <div className="flex items-center gap-1 text-sm text-white/60 mb-3">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{p.ciudad as string}, {p.estado as string}</span>
              <span className="mx-2 text-white/30">·</span>
              <span>{TIPOS_PROPIEDAD[p.tipo_propiedad as keyof typeof TIPOS_PROPIEDAD] || p.tipo_propiedad as string}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
              <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.habitaciones as number} hab.</span>
              <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.banos as number} baños</span>
              <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" />{p.camas as number} camas</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p.capacidad_maxima as number} personas</span>
              <span className="font-bold text-white">{formatMoney(p.precio_por_noche as number, p.moneda as string)}<span className="font-normal text-white/50">/noche</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-white/10 sm:grid-cols-4">
          {[
            { label: 'Vistas', value: String(p.vistas_totales || 0), icon: Eye },
            { label: 'Rating', value: p.rating_promedio ? `${(p.rating_promedio as number).toFixed(1)} (${p.total_resenas})` : '—', icon: Star },
            { label: 'Reservas', value: String(data.reservas.length), icon: Receipt },
            { label: 'Reseñas', value: String(resenas.length), icon: Star },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 border-r border-white/10 px-5 py-3.5 last:border-r-0">
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

      {/* ====== ACTIONS ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => window.open(`/propiedades/${p.slug || id}`, '_blank')} variant="outline" size="sm" className="border-[#E8E4DF] text-[#6B6560]">
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Vista pública
        </Button>
        {estadoPub !== 'PUBLICADA' && (
          <Button onClick={() => handleEstado('PUBLICADA')} disabled={actionLoading} size="sm" className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            {actionLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 h-3.5 w-3.5" />} Publicar
          </Button>
        )}
        {estadoPub === 'PUBLICADA' && (
          <Button onClick={() => handleEstado('PAUSADA')} disabled={actionLoading} variant="outline" size="sm" className="border-[#E8E4DF] text-[#6B6560]">
            <Pause className="mr-1.5 h-3.5 w-3.5" /> Pausar
          </Button>
        )}
        {estadoPub !== 'SUSPENDIDA' && (
          <Button onClick={() => handleEstado('SUSPENDIDA')} disabled={actionLoading} variant="outline" size="sm" className="border-[#C1121F] text-[#C1121F]">
            <Shield className="mr-1.5 h-3.5 w-3.5" /> Suspender
          </Button>
        )}
        <Button onClick={handleDestacar} disabled={actionLoading} variant="outline" size="sm" className="border-[#E8E4DF] text-[#6B6560]">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {p.destacada ? 'Quitar destacada' : 'Destacar'}
        </Button>
        <Button onClick={() => setDeleteOpen(true)} variant="outline" size="sm" className="border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2]">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
        </Button>
      </motion.div>

      {/* ====== TABS ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 rounded-xl border border-[#E8E4DF] bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </motion.div>

      {/* ====== TAB CONTENT ====== */}
      <AnimatePresence mode="wait">
        {activeTab === 'info' ? (
          <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">

                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
                  <h3 className="mb-3 text-sm font-bold text-[#1A1A1A]">Información</h3>
                  <p className="mb-4 text-sm text-[#6B6560] leading-relaxed">{(p.descripcion as string) || 'Sin descripción'}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-[#9E9892]">Dirección:</span> <span className="text-[#1A1A1A]">{(p.direccion as string) || '—'}</span></div>
                    <div><span className="text-[#9E9892]">Check-in:</span> <span className="text-[#1A1A1A]">{(p.horario_checkin as string) || '14:00'}</span></div>
                    <div><span className="text-[#9E9892]">Check-out:</span> <span className="text-[#1A1A1A]">{(p.horario_checkout as string) || '11:00'}</span></div>
                    <div><span className="text-[#9E9892]">Estancia mínima:</span> <span className="text-[#1A1A1A]">{(p.estancia_minima as number) || 1} noches</span></div>
                    <div><span className="text-[#9E9892]">Política:</span> <span className="text-[#1A1A1A]">{(p.politica_cancelacion as string) || '—'}</span></div>
                    <div><span className="text-[#9E9892]">Creada:</span> <span className="text-[#1A1A1A]">{formatDate(p.fecha_publicacion as string || p.fecha_actualizacion as string)}</span></div>
                  </div>
                  {amenidades.length > 0 && (
                    <div className="mt-4 border-t border-[#E8E4DF] pt-4">
                      <p className="mb-2 text-xs font-medium text-[#9E9892]">Amenidades</p>
                      <div className="flex flex-wrap gap-1.5">
                        {amenidades.map((a) => (
                          <span key={a.amenidad_id} className="rounded-full bg-[#F8F6F3] px-2.5 py-1 text-[11px] text-[#6B6560]">{a.amenidad.nombre}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(p.reglas as string) && (
                    <div className="mt-4 border-t border-[#E8E4DF] pt-4">
                      <p className="mb-1 text-xs font-medium text-[#9E9892]">Reglas</p>
                      <p className="text-sm text-[#6B6560]">{p.reglas as string}</p>
                    </div>
                  )}
                </motion.div>

                {imagenes.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
                    <h3 className="mb-3 text-sm font-bold text-[#1A1A1A]">Imágenes ({imagenes.length})</h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {imagenes.map((img, i) => (
                        <a key={i} href={img.url} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-lg border border-[#E8E4DF]">
                          <Image fill src={img.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          {img.es_principal && <span className="absolute bottom-0 left-0 right-0 bg-[#1B4332] px-1 py-0.5 text-center text-[9px] font-bold text-white">Principal</span>}
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Reservas */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                  <button onClick={() => setShowReservas(!showReservas)} className="flex w-full items-center justify-between rounded-t-2xl border border-[#E8E4DF] bg-white px-6 py-4 text-left transition-colors hover:bg-[#FDFCFA]">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Reservas ({data.reservas.length})</h3>
                    <ChevronDown className={`h-4 w-4 text-[#9E9892] transition-transform ${showReservas ? 'rotate-180' : ''}`} />
                  </button>
                  {showReservas && (
                    <div className="rounded-b-2xl border border-t-0 border-[#E8E4DF] bg-white">
                      {data.reservas.length === 0 ? <AdminEmptyState icon={Receipt} titulo="Sin reservas" /> : (
                        <div className="divide-y divide-[#F4F1EC]">
                          {data.reservas.map((r) => {
                            const estado = (r.estado as string) || 'PENDIENTE'
                            const config = ESTADO_RESERVA[estado] || ESTADO_RESERVA.PENDIENTE
                            const huesped = r.huesped as Record<string, unknown> | null
                            return (
                              <div key={r.id as string} className="flex items-center gap-3 px-6 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F8F6F3] text-[11px] font-semibold text-[#1A1A1A]">
                                  {huesped ? `${String(huesped.nombre || '').charAt(0)}${String(huesped.apellido || '').charAt(0)}` : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-medium text-[#1A1A1A]">{huesped ? `${huesped.nombre} ${huesped.apellido}` : '—'}</p>
                                  <p className="text-[11px] text-[#9E9892]">{formatDate(r.fecha_entrada as string)} → {formatDate(r.fecha_salida as string)} · {r.noches as number} noches</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold tabular-nums text-[#1A1A1A]">{formatMoney(Number(r.total || 0), r.moneda as string)}</p>
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>{config.label}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Resenas */}
                {resenas.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <button onClick={() => setShowResenas(!showResenas)} className="flex w-full items-center justify-between rounded-t-2xl border border-[#E8E4DF] bg-white px-6 py-4 text-left transition-colors hover:bg-[#FDFCFA]">
                      <h3 className="text-sm font-bold text-[#1A1A1A]">Reseñas ({resenas.length})</h3>
                      <ChevronDown className={`h-4 w-4 text-[#9E9892] transition-transform ${showResenas ? 'rotate-180' : ''}`} />
                    </button>
                    {showResenas && (
                      <div className="rounded-b-2xl border border-t-0 border-[#E8E4DF] bg-white">
                        <div className="divide-y divide-[#F4F1EC]">
                          {resenas.map((r) => {
                            const autor = r.autor as Record<string, unknown> | null
                            return (
                              <div key={r.id as string} className="px-6 py-4">
                                <div className="mb-2 flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8F6F3] text-[10px] font-semibold text-[#1A1A1A]">
                                    {autor ? `${String(autor.nombre || '').charAt(0)}${String(autor.apellido || '').charAt(0)}` : '?'}
                                  </div>
                                  <span className="text-xs font-medium text-[#1A1A1A]">{autor ? `${autor.nombre} ${autor.apellido}` : '—'}</span>
                                  <span className="flex items-center gap-0.5 text-xs text-[#F4A261]"><Star className="h-3 w-3 fill-[#F4A261]" /> {r.calificacion as number}</span>
                                  <span className="ml-auto text-[10px] text-[#9E9892]">{formatDate(r.fecha_creacion as string)}</span>
                                </div>
                                <p className="text-sm text-[#6B6560]">{r.comentario as string}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* RIGHT: Propietario */}
              <div className="space-y-4">
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
                  <h3 className="mb-4 text-sm font-bold text-[#1A1A1A]">Propietario</h3>
                  {propietario ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D8F3DC] text-sm font-bold text-[#1B4332]">
                          {String(propietario.nombre || '').charAt(0)}{String(propietario.apellido || '').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{propietario.nombre as string} {propietario.apellido as string}</p>
                          <p className="text-xs text-[#6B6560]">{propietario.email as string}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-[#9E9892]" /><span className="text-[#6B6560]">Rol: <span className="font-medium text-[#1A1A1A]">{propietario.rol as string}</span></span></div>
                        <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-[#9E9892]" /><span className="text-[#6B6560]">Verificado: <span className={propietario.verificado ? 'font-medium text-[#1B4332]' : 'text-[#C1121F]'}>{propietario.verificado ? 'Sí' : 'No'}</span></span></div>
                        {propietario.telefono ? <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#9E9892]" /><span className="text-[#6B6560]">Tel: <span className="text-[#1A1A1A]">{propietario.telefono as string}</span></span></div> : null}
                        <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-[#9E9892]" /><span className="text-[#6B6560]">Registro: <span className="text-[#1A1A1A]">{formatDate(propietario.fecha_registro as string)}</span></span></div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full border-[#E8E4DF] text-[#6B6560]" onClick={() => router.push(`/admin/usuarios?busqueda=${propietario.email}`)}>
                        Ver en usuarios
                      </Button>
                    </div>
                  ) : <p className="text-sm text-[#9E9892]">Sin propietario asignado</p>}
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (

          /* ====== RENDIMIENTO TAB ====== */
          <motion.div key="rendimiento" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {ingresosLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
              </div>
            ) : !ingresosData ? (
              <AdminEmptyState icon={BarChart3} titulo="Sin datos de rendimiento" descripcion="No se pudieron cargar los ingresos" />
            ) : (
              <motion.div variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible">

                {/* KPI Cards */}
                <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <AdminStatCard
                    icon={DollarSign}
                    label="Ingresos totales"
                    value={formatMoney(ingresosData.kpis.totalIngresos)}
                    trend={{ value: ingresosData.kpis.crecimiento, label: 'vs. mes pasado' }}
                    color="green"
                  />
                  <AdminStatCard
                    icon={TrendingUp}
                    label="Ingresos del mes"
                    value={formatMoney(ingresosData.kpis.ingresosMes)}
                    color="blue"
                  />
                  <AdminStatCard
                    icon={Receipt}
                    label="Comisiones plataforma"
                    value={formatMoney(ingresosData.kpis.totalComisiones)}
                    color="orange"
                  />
                  <AdminStatCard
                    icon={CalendarDays}
                    label="Noches reservadas"
                    value={ingresosData.kpis.totalNoches}
                    color="purple"
                  />
                </motion.div>

                {/* Extra KPIs row */}
                <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Tarifa promedio/noche', value: formatMoney(ingresosData.kpis.tarifaPromedio), icon: DollarSign },
                    { label: 'Ingresos netos', value: formatMoney(ingresosData.kpis.ingresosNetos), icon: TrendingUp, highlight: true },
                    { label: 'Total huéspedes', value: ingresosData.kpis.totalHuespedes, icon: Users },
                    { label: 'Reservas efectivas', value: ingresosData.kpis.totalReservas, icon: Receipt },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className={`rounded-xl border p-3.5 ${item.highlight ? 'border-[#1B4332]/30 bg-[#D8F3DC]/30' : 'border-[#E8E4DF] bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-3.5 w-3.5 ${item.highlight ? 'text-[#1B4332]' : 'text-[#9E9892]'}`} />
                          <span className="text-[11px] text-[#6B6560]">{item.label}</span>
                        </div>
                        <p className={`mt-1 text-lg font-bold tabular-nums ${item.highlight ? 'text-[#1B4332]' : 'text-[#1A1A1A]'}`}>{item.value}</p>
                      </div>
                    )
                  })}
                </motion.div>

                {/* Chart */}
                <motion.div variants={fadeUp} className="mb-6 rounded-2xl border border-[#E8E4DF] bg-white p-6">
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Ingresos mensuales</h3>
                    <span className="text-xs text-[#9E9892]">Últimos 12 meses</span>
                  </div>
                  <p className="mb-4 text-xs text-[#9E9892]">Ingresos y comisiones de la plataforma por mes</p>
                  <Suspense fallback={<ChartSkeleton />}>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={ingresosData.ingresosByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradRendIngresos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1B4332" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#1B4332" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradRendComisiones" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F4A261" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#F4A261" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F4F1EC" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={{ stroke: '#E8E4DF' }} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9E9892' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid #E8E4DF', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter={(value: any, name: any) => [formatMoney(Number(value)), name === 'ingresos' ? 'Ingresos' : 'Comisiones']}
                          />
                          <Area type="monotone" dataKey="ingresos" stroke="#1B4332" strokeWidth={2.5} fill="url(#gradRendIngresos)" />
                          <Area type="monotone" dataKey="comisiones" stroke="#F4A261" strokeWidth={2} fill="url(#gradRendComisiones)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Suspense>
                  <div className="mt-3 flex items-center gap-5">
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#1B4332]" /><span className="text-xs text-[#9E9892]">Ingresos</span></div>
                    <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#F4A261]" /><span className="text-xs text-[#9E9892]">Comisiones plataforma</span></div>
                  </div>
                </motion.div>

                {/* Reservas que generaron ingreso */}
                <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
                  <div className="border-b border-[#E8E4DF] px-6 py-4">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Reservas con ingreso ({ingresosData.reservas.length})</h3>
                    <p className="text-xs text-[#9E9892]">Confirmadas, en curso y completadas</p>
                  </div>
                  {ingresosData.reservas.length === 0 ? (
                    <AdminEmptyState icon={Receipt} titulo="Sin reservas con ingreso" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E8E4DF] bg-[#FDFCFA]">
                            <th className="px-6 py-2.5 text-left text-[11px] font-medium text-[#9E9892]">Huésped</th>
                            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#9E9892]">Check-in</th>
                            <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#9E9892]">Noches</th>
                            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-[#9E9892]">Total</th>
                            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-[#9E9892]">Comisión</th>
                            <th className="px-4 py-2.5 text-right text-[11px] font-medium text-[#9E9892]">Neto</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-medium text-[#9E9892]">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F1EC]">
                          {ingresosData.reservas.map((r) => {
                            const huesped = r.huesped as Record<string, unknown> | null
                            const estado = (r.estado as string) || 'CONFIRMADA'
                            const config = ESTADO_RESERVA[estado] || ESTADO_RESERVA.CONFIRMADA
                            const total = Number(r.total || 0)
                            const comision = Number(r.comision_plataforma || 0)
                            const neto = total - comision
                            return (
                              <tr key={r.id as string} className="hover:bg-[#FDFCFA]">
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F8F6F3] text-[10px] font-semibold text-[#1A1A1A]">
                                      {huesped ? `${String(huesped.nombre || '').charAt(0)}${String(huesped.apellido || '').charAt(0)}` : '?'}
                                    </div>
                                    <span className="truncate text-[13px] font-medium text-[#1A1A1A]">
                                      {huesped ? `${huesped.nombre} ${huesped.apellido}` : '—'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[13px] text-[#6B6560]">{formatDate(r.fecha_entrada as string)}</td>
                                <td className="px-4 py-3 text-[13px] text-[#6B6560] tabular-nums">{r.noches as number}</td>
                                <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#1A1A1A] tabular-nums">{formatMoney(total)}</td>
                                <td className="px-4 py-3 text-right text-[13px] text-[#F4A261] tabular-nums">{formatMoney(comision)}</td>
                                <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#1B4332] tabular-nums">{formatMoney(neto)}</td>
                                <td className="px-4 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>{config.label}</span></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titulo="Eliminar Boogie"
        descripcion={`Se eliminará permanentemente "${p.titulo as string}" junto con todas sus imágenes y datos. Esta acción es irreversible.`}
        onConfirm={handleEliminar}
        destructive
        loading={actionLoading}
        textoConfirmar="Eliminar"
      />
    </motion.div>
  )
}
