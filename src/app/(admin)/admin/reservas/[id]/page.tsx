'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CalendarDays, Loader2, CheckCircle2, XCircle, Ban,
  Clock, MapPin, Users, Receipt, DollarSign, CreditCard, FileText,
  Home, Shield, ArrowRight, ImageIcon, ChevronDown, Smartphone, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getReservaDetalleAdmin, accionReservaAdmin } from '@/actions/admin-reservas.actions'
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_COLORS, ESTADO_PAGO_LABELS } from '@/types/reserva'
import { METODOS_PAGO } from '@/lib/constants'
import type { EstadoReserva } from '@/types'

interface Pago {
  id: string
  monto: number
  moneda: string
  metodo_pago: string
  referencia: string | null
  comprobante: string | null
  estado: string
  fecha_creacion: string
  fecha_verificacion: string | null
  notas_verificacion: string | null
}

interface TimelineEntry {
  accion: string
  creado_en: string
  detalles: Record<string, unknown>
  admin: { nombre: string; apellido: string; email: string } | null
}

interface ReservaDetalle {
  id: string
  codigo: string
  fecha_entrada: string
  fecha_salida: string
  noches: number
  precio_por_noche: number
  subtotal: number
  comision_plataforma: number
  comision_anfitrion: number | null
  total: number
  moneda: string
  estado: EstadoReserva
  cantidad_huespedes: number
  notas_huesped: string | null
  notas_internas: string | null
  fecha_creacion: string
  fecha_confirmacion: string | null
  fecha_cancelacion: string | null
  propiedad: {
    id: string; titulo: string; slug: string; ciudad: string; estado: string; direccion: string
    propietario: { id: string; nombre: string; apellido: string; email: string; telefono: string | null } | null
  } | null
  huesped: { id: string; nombre: string; apellido: string; email: string; telefono: string | null; cedula: string | null } | null
  pagos: Pago[] | null
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
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

function formatDateTime(s: string) {
  return new Date(s).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminReservaDetallePage() {
  const params = useParams()
  const router = useRouter()
  const reservaId = params.id as string

  const [data, setData] = useState<{ reserva: ReservaDetalle; timeline: TimelineEntry[]; tasaBCV: number; fuenteBCV: string } | null>(null)
  const [cargando, setCargando] = useState(true)
  const [accionando, setAccionando] = useState(false)
  const [pagoExpandido, setPagoExpandido] = useState<string | null>(null)

  useEffect(() => {
    getReservaDetalleAdmin(reservaId).then((res) => {
      if (res.error) {
        toast.error(res.error)
      } else {
        setData(res as unknown as typeof data)
      }
      setCargando(false)
    })
  }, [reservaId])

  const handleAccion = async (accion: string) => {
    setAccionando(true)
    const formData = new FormData()
    formData.append('reservaId', reservaId)
    formData.append('accion', accion)
    const res = await accionReservaAdmin(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(`Reserva ${accion === 'confirmar' ? 'confirmada' : accion === 'rechazar' ? 'rechazada' : 'cancelada'}`)
      const refreshed = await getReservaDetalleAdmin(reservaId)
      if (!refreshed.error) setData(refreshed as unknown as typeof data)
    }
    setAccionando(false)
  }

  if (cargando || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const r = data.reserva
  const prop = r.propiedad
  const huesped = r.huesped
  const anfitrion = prop?.propietario
  const pagos = r.pagos || []
  const esPendiente = r.estado === 'PENDIENTE'
  const esConfirmada = r.estado === 'CONFIRMADA'
  const puedeActuar = esPendiente || esConfirmada

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-5xl">

      {/* ====== BACK ====== */}
      <motion.div variants={fadeUp} className="mb-4">
        <button
          onClick={() => router.push('/admin/reservas')}
          className="flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a reservas
        </button>
      </motion.div>

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl truncate">{prop?.titulo || 'Propiedad'}</h1>
              <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide bg-white/20 text-white">
                {ESTADO_RESERVA_LABELS[r.estado]}
              </span>
            </div>
            <p className="text-sm text-white/60 font-mono">{r.codigo}</p>
          </div>
        </div>

        <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'Total', value: formatMoney(Number(r.total), r.moneda), icon: DollarSign, sub: data.tasaBCV ? formatMoney(Math.round(Number(r.total) * data.tasaBCV * 100) / 100, 'VES') : null },
            { label: 'Noches', value: String(r.noches), icon: CalendarDays },
            { label: 'Huéspedes', value: String(r.cantidad_huespedes), icon: Users },
            { label: 'Comisión', value: formatMoney(Number(r.comision_plataforma), r.moneda), icon: Receipt },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10 last:border-r-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <item.icon className="h-3.5 w-3.5 text-white/60" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{item.value}</p>
                {item.sub && <p className="text-[10px] text-white/30 tabular-nums">{item.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ====== ACCIONES ====== */}
      {puedeActuar && (
        <motion.div variants={fadeUp} className="mb-6 flex gap-2">
          {esPendiente && (
            <>
              <button
                disabled={accionando}
                onClick={() => handleAccion('confirmar')}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#1B4332] px-5 text-sm font-medium text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-60"
              >
                {accionando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirmar
              </button>
              <button
                disabled={accionando}
                onClick={() => { if (confirm('¿Rechazar esta reserva?')) handleAccion('rechazar') }}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#C1121F]/30 px-5 text-sm font-medium text-[#C1121F] transition-all hover:bg-[#FEE2E2] disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </>
          )}
          {(esPendiente || esConfirmada) && (
            <button
              disabled={accionando}
              onClick={() => { if (confirm('¿Cancelar esta reserva?')) handleAccion('cancelar') }}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#E8E4DF] px-5 text-sm font-medium text-[#6B6560] transition-all hover:bg-[#F8F6F3] disabled:opacity-60"
            >
              <Ban className="h-4 w-4" />
              Cancelar
            </button>
          )}
        </motion.div>
      )}

      {/* ====== CONTENT GRID ====== */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT — Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Fechas y precios */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4">Fechas y precios</h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                <span className="text-[#9E9892]">Check-in</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="font-medium text-[#1A1A1A]">{formatDate(r.fecha_entrada)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                <span className="text-[#9E9892]">Check-out</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="font-medium text-[#1A1A1A]">{formatDate(r.fecha_salida)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <DollarSign className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                <span className="text-[#9E9892]">Precio/noche</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="font-medium text-[#1A1A1A]">{formatMoney(Number(r.precio_por_noche), r.moneda)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <DollarSign className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                <span className="text-[#9E9892]">Subtotal</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="font-medium text-[#1A1A1A]">{formatMoney(Number(r.subtotal), r.moneda)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <Receipt className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                <span className="text-[#9E9892]">Comisión plataforma</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="font-medium text-[#1A1A1A]">{formatMoney(Number(r.comision_plataforma), r.moneda)}</span>
              </div>
              {r.comision_anfitrion != null && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Receipt className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Comisión anfitrión</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{formatMoney(Number(r.comision_anfitrion), r.moneda)}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm pt-2 border-t border-[#E8E4DF]">
                <DollarSign className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                <span className="font-semibold text-[#1A1A1A]">Total</span>
                <span className="flex-1 border-b border-dotted border-[#1B4332]/30 min-w-[12px]" />
                <span className="font-bold text-[#1B4332]">{formatMoney(Number(r.total), r.moneda)}</span>
              </div>
            </div>
          </motion.div>

          {/* Pagos */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4">Pagos ({pagos.length})</h3>
            {pagos.length === 0 ? (
              <p className="text-sm text-[#9E9892]">Sin pagos registrados</p>
            ) : (
              <div className="space-y-2">
                {pagos.map((p) => {
                  const expandido = pagoExpandido === p.id
                  const montoVES = data?.tasaBCV ? Math.round(Number(p.monto) * data.tasaBCV * 100) / 100 : null
                  const metodoIcon = p.metodo_pago === 'PAGO_MOVIL' ? Smartphone : p.metodo_pago === 'TRANSFERENCIA_BANCARIA' ? Building2 : CreditCard
                  const MetodoIcon = metodoIcon

                  return (
                    <div key={p.id} className="rounded-xl border border-[#E8E4DF] bg-[#FDFCFA] overflow-hidden">
                      <button
                        onClick={() => setPagoExpandido(expandido ? null : p.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                          <MetodoIcon className="h-3.5 w-3.5 text-[#9E9892]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#1A1A1A]">{formatMoney(Number(p.monto), p.moneda)}</p>
                            <span className="rounded-full bg-[#E8E4DF] px-2 py-0.5 text-[10px] font-medium text-[#6B6560]">
                              {METODOS_PAGO[p.metodo_pago as keyof typeof METODOS_PAGO] || p.metodo_pago}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#9E9892] mt-0.5">{formatDateTime(p.fecha_creacion)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.estado === 'VERIFICADO' || p.estado === 'ACREDITADO'
                            ? 'bg-[#D8F3DC] text-[#1B4332]'
                            : p.estado === 'RECHAZADO'
                              ? 'bg-[#FEE2E2] text-[#C1121F]'
                              : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}>
                          {ESTADO_PAGO_LABELS[p.estado as keyof typeof ESTADO_PAGO_LABELS] || p.estado}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-[#9E9892] shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {expandido && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[#E8E4DF] px-4 py-4 space-y-3">

                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2.5 text-sm">
                                  <DollarSign className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                                  <span className="text-[#9E9892]">Monto</span>
                                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                  <span className="font-medium text-[#1A1A1A]">{formatMoney(Number(p.monto), p.moneda)}</span>
                                </div>
                                {montoVES && (
                                  <div className="flex items-center gap-2.5 text-sm">
                                    <DollarSign className="h-3.5 w-3.5 text-[#9E9892]/40 shrink-0" />
                                    <span className="text-[#9E9892]/60">Equiv.</span>
                                    <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                    <span className="text-xs text-[#9E9892]/70">{formatMoney(montoVES, 'VES')}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2.5 text-sm">
                                  <CreditCard className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                                  <span className="text-[#9E9892]">Método</span>
                                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                  <span className="font-medium text-[#1A1A1A]">{METODOS_PAGO[p.metodo_pago as keyof typeof METODOS_PAGO] || p.metodo_pago}</span>
                                </div>
                                {p.referencia && (
                                  <div className="flex items-center gap-2.5 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                                    <span className="text-[#9E9892]">Referencia</span>
                                    <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                    <span className="font-medium text-[#1A1A1A] font-mono text-xs">{p.referencia}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2.5 text-sm">
                                  <Clock className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                                  <span className="text-[#9E9892]">Creado</span>
                                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                  <span className="font-medium text-[#1A1A1A]">{formatDateTime(p.fecha_creacion)}</span>
                                </div>
                                {p.fecha_verificacion && (
                                  <div className="flex items-center gap-2.5 text-sm">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                                    <span className="text-[#9E9892]">Verificado</span>
                                    <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                    <span className="font-medium text-[#1A1A1A]">{formatDateTime(p.fecha_verificacion)}</span>
                                  </div>
                                )}
                                {p.notas_verificacion && (
                                  <div className="flex items-start gap-2.5 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-[#9E9892] shrink-0 mt-0.5" />
                                    <span className="text-[#9E9892]">Notas</span>
                                    <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                                    <span className="font-medium text-[#1A1A1A] text-right max-w-[200px]">{p.notas_verificacion}</span>
                                  </div>
                                )}
                              </div>

                              {p.comprobante && (
                                <div className="pt-2 border-t border-[#E8E4DF]">
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#9E9892] mb-2">Comprobante</p>
                                  <a
                                    href={p.comprobante}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block overflow-hidden rounded-lg border border-[#E8E4DF]"
                                  >
                                    <img
                                      src={p.comprobante}
                                      alt="Comprobante de pago"
                                      className="w-full max-h-56 object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1A1A1A] opacity-0 transition-opacity group-hover:opacity-100">
                                        Ver completa
                                      </span>
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Notas */}
          {(r.notas_huesped || r.notas_internas) && (
            <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-3">Notas</h3>
              {r.notas_huesped && (
                <div className="mb-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#9E9892] mb-1">Huésped</p>
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{r.notas_huesped}</p>
                </div>
              )}
              {r.notas_internas && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#9E9892] mb-1">Internas</p>
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{r.notas_internas}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-4">
          {/* Huésped */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Huésped
            </h3>
            {huesped ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C] text-xs font-bold text-white">
                    {huesped.nombre.charAt(0)}{huesped.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{huesped.nombre} {huesped.apellido}</p>
                    <p className="text-xs text-[#9E9892]">{huesped.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-xs">
                  {huesped.telefono && (
                    <div className="flex items-center gap-2 text-[#6B6560]">
                      <span className="text-[#9E9892]">Tel:</span> {huesped.telefono}
                    </div>
                  )}
                  {huesped.cedula && (
                    <div className="flex items-center gap-2 text-[#6B6560]">
                      <span className="text-[#9E9892]">Doc:</span> {huesped.cedula}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#9E9892]">Sin información</p>
            )}
          </motion.div>

          {/* Propiedad */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
              <Home className="h-3 w-3" /> Propiedad
            </h3>
            {prop ? (
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/admin/propiedades/${prop.id}`)}
                  className="text-sm font-semibold text-[#1A1A1A] hover:text-[#1B4332] transition-colors text-left"
                >
                  {prop.titulo} <ArrowRight className="inline h-3 w-3 ml-1" />
                </button>
                <div className="flex items-center gap-1.5 text-xs text-[#9E9892]">
                  <MapPin className="h-3 w-3" />
                  <span>{prop.ciudad}, {prop.estado}</span>
                </div>
                {anfitrion && (
                  <div className="mt-2 pt-2 border-t border-[#E8E4DF]">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#9E9892] mb-1">Anfitrión</p>
                    <p className="text-sm text-[#1A1A1A]">{anfitrion.nombre} {anfitrion.apellido}</p>
                    <p className="text-xs text-[#9E9892]">{anfitrion.email}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#9E9892]">Propiedad eliminada</p>
            )}
          </motion.div>

          {/* Timeline */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Actividad
            </h3>

            <div className="flex items-center gap-2.5 text-sm mb-3">
              <FileText className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
              <span className="text-[#9E9892]">Creada</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
              <span className="text-xs text-[#1A1A1A]">{formatDateTime(r.fecha_creacion)}</span>
            </div>
            {r.fecha_confirmacion && (
              <div className="flex items-center gap-2.5 text-sm mb-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                <span className="text-[#9E9892]">Confirmada</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="text-xs text-[#1A1A1A]">{formatDateTime(r.fecha_confirmacion)}</span>
              </div>
            )}
            {r.fecha_cancelacion && (
              <div className="flex items-center gap-2.5 text-sm mb-3">
                <XCircle className="h-3.5 w-3.5 text-[#C1121F] shrink-0" />
                <span className="text-[#9E9892]">{r.estado === 'CANCELADA_HUESPED' ? 'Cancelada por Huésped' : 'Cancelada por Anfitrión'}</span>
                <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                <span className="text-xs text-[#1A1A1A]">{formatDateTime(r.fecha_cancelacion)}</span>
              </div>
            )}

            {data.timeline.length > 0 && (
              <div className="border-t border-[#E8E4DF] pt-3 mt-1 space-y-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#9E9892]">Auditoría admin</p>
                {data.timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <Shield className="h-3 w-3 text-[#9E9892] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[#1A1A1A] font-medium">{entry.accion.replace(/_/g, ' ')}</p>
                      <p className="text-[#9E9892]">
                        {entry.admin ? `${entry.admin.nombre} ${entry.admin.apellido}` : 'Admin'} · {formatDateTime(entry.creado_en)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
