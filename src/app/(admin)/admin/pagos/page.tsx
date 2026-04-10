'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Search, Loader2, CheckCircle2, XCircle,
  Clock, DollarSign, TrendingUp, ArrowRight, ShieldCheck,
  ChevronDown, FileText, Smartphone, Building2, Home, ExternalLink, Coins,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getPagosAdmin, getPagosStatsAdmin, verificarPagoAdmin } from '@/actions/admin-pagos.actions'
import { getTasaBCV } from '@/actions/wallet.actions'
import { METODOS_PAGO } from '@/lib/constants'
import type { EstadoPago } from '@/types'

interface ReservaMini {
  id: string
  codigo: string
  estado: string
  propiedades: { id: string; titulo: string } | null
  usuarios: { id: string; nombre: string; apellido: string; email: string } | null
}

interface Pago {
  id: string
  monto: number
  moneda: string
  monto_equivalente: number | null
  moneda_equivalente: string | null
  tasa_cambio: number | null
  metodo_pago: string
  referencia: string | null
  comprobante: string | null
  estado: EstadoPago
  fecha_creacion: string
  fecha_verificacion: string | null
  fecha_acreditacion: string | null
  notas_verificacion: string | null
  crypto_address: string | null
  crypto_tx_hash: string | null
  crypto_confirmations: number | null
  crypto_value_coin: string | null
  reservas: ReservaMini | ReservaMini[] | null
  usuarios: { id: string; nombre: string; apellido: string; email: string } | null
}

const ESTADO_PAGO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_VERIFICACION: 'En verificación',
  VERIFICADO: 'Verificado',
  ACREDITADO: 'Acreditado',
  RECHAZADO: 'Rechazado',
  REEMBOLSADO: 'Reembolsado',
}

const ESTADO_PAGO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-[#FEF3C7] text-[#92400E]',
  EN_VERIFICACION: 'bg-[#DBEAFE] text-[#1E40AF]',
  VERIFICADO: 'bg-[#D8F3DC] text-[#1B4332]',
  ACREDITADO: 'bg-[#D8F3DC] text-[#2D6A4F]',
  RECHAZADO: 'bg-[#FEE2E2] text-[#C1121F]',
  REEMBOLSADO: 'bg-[#E8E4DF] text-[#6B6560]',
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

function formatDateTime(s: string) {
  return new Date(s).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getReserva(pago: Pago): ReservaMini | null {
  if (!pago.reservas) return null
  if (Array.isArray(pago.reservas)) return pago.reservas[0] || null
  return pago.reservas
}

const ESTADOS_FILTRO = ['TODOS', 'PENDIENTE', 'EN_VERIFICACION', 'VERIFICADO', 'ACREDITADO', 'RECHAZADO'] as const

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [stats, setStats] = useState({ pendientes: 0, enVerificacion: 0, verificados: 0, acreditados: 0, rechazados: 0, totalProcesadoUSD: 0, totalProcesadoVES: 0 })
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [filtroMetodo, setFiltroMetodo] = useState<string>('TODOS')
  const [accionando, setAccionando] = useState<string | null>(null)
  const [pagoExpandido, setPagoExpandido] = useState<string | null>(null)
  const [tasaBCV, setTasaBCV] = useState<number | null>(null)

  const cargarDatos = async () => {
    const [resPagos, resStats] = await Promise.all([
      getPagosAdmin({ estado: filtroEstado, metodoPago: filtroMetodo, busqueda }),
      getPagosStatsAdmin(),
    ])
    if (resPagos.error) {
      toast.error(resPagos.error)
    } else {
      setPagos((resPagos.pagos || []) as unknown as Pago[])
    }
    if ('pendientes' in resStats) {
      setStats(resStats as typeof stats)
    }
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [filtroEstado, filtroMetodo])

  useEffect(() => {
    getTasaBCV().then((res) => { if (res.tasa) setTasaBCV(res.tasa) })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { if (!cargando) cargarDatos() }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  const handleAccion = async (pagoId: string, accion: string) => {
    setAccionando(pagoId)
    const formData = new FormData()
    formData.append('pagoId', pagoId)
    formData.append('accion', accion)
    const res = await verificarPagoAdmin(formData)
    if (res.error) toast.error(res.error)
    else {
      toast.success(`Pago ${accion === 'VERIFICADO' ? 'verificado' : accion === 'ACREDITADO' ? 'acreditado' : 'rechazado'}`)
      cargarDatos()
    }
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
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Gestión de Pagos</h1>
            <p className="text-sm text-white/60 mt-0.5">Verifica, acredita y gestiona todos los pagos</p>
          </div>
        </div>

        <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-5">
          {[
            { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'text-[#FCD34D]' },
            { label: 'Verificados', value: stats.verificados, icon: CheckCircle2, color: 'text-white' },
            { label: 'Acreditados', value: stats.acreditados, icon: ShieldCheck, color: 'text-white' },
            { label: 'Rechazados', value: stats.rechazados, icon: XCircle, color: 'text-white/60' },
            { label: 'Total proc.', value: formatMoney(stats.totalProcesadoUSD), icon: TrendingUp, color: 'text-white' },
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
      <motion.div variants={fadeUp} className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar por referencia o notas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-[#E8E4DF] bg-white pl-10 h-11 rounded-xl"
          />
        </div>
      </motion.div>

      {/* ====== FILTROS ====== */}
      <motion.div variants={fadeUp} className="mb-2 flex gap-1 overflow-x-auto rounded-xl border border-[#E8E4DF] bg-white p-1">
        {ESTADOS_FILTRO.map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              filtroEstado === e ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {e === 'TODOS' ? 'Todos' : ESTADO_PAGO_LABELS[e]}
          </button>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#E8E4DF] bg-white p-1">
        {['TODOS', ...Object.keys(METODOS_PAGO)].map((m) => (
          <button
            key={m}
            onClick={() => setFiltroMetodo(m)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
              filtroMetodo === m ? 'bg-[#1B4332]/10 text-[#1B4332]' : 'text-[#9E9892] hover:bg-[#F8F6F3]'
            }`}
          >
            {m === 'TODOS' ? 'Todos' : METODOS_PAGO[m as keyof typeof METODOS_PAGO]}
          </button>
        ))}
      </motion.div>

      {/* ====== LISTA PAGOS ====== */}
      <motion.div variants={stagger} className="space-y-2">
        {pagos.map((p) => {
          const reserva = getReserva(p)
          const huesped = reserva?.usuarios
          const esPendiente = p.estado === 'PENDIENTE' || p.estado === 'EN_VERIFICACION'
          const esVerificado = p.estado === 'VERIFICADO'
          const expandido = pagoExpandido === p.id
          const montoVES = tasaBCV ? Math.round(Number(p.monto) * tasaBCV * 100) / 100 : null
          const MetodoIcon = p.metodo_pago === 'PAGO_MOVIL' ? Smartphone : p.metodo_pago === 'TRANSFERENCIA_BANCARIA' ? Building2 : CreditCard

          return (
            <motion.div key={p.id} variants={fadeUp}>
              <div className="group rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden transition-all hover:shadow-sm">
                <button
                  onClick={() => setPagoExpandido(expandido ? null : p.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C]">
                    <MetodoIcon className="h-5 w-5 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[#1A1A1A] truncate text-sm">
                        {huesped ? `${huesped.nombre} ${huesped.apellido}` : '—'}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${ESTADO_PAGO_COLORS[p.estado]}`}>
                        {ESTADO_PAGO_LABELS[p.estado]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9E9892]">
                      <span className="rounded bg-[#F8F6F3] px-1.5 py-0.5 font-medium">
                        {METODOS_PAGO[p.metodo_pago as keyof typeof METODOS_PAGO] || p.metodo_pago}
                      </span>
                      {reserva?.propiedades && (
                        <>
                          <span className="text-[#E8E4DF]">·</span>
                          <span className="truncate">{reserva.propiedades.titulo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1A1A1A]">{formatMoney(Number(p.monto), p.moneda)}</p>
                      {montoVES && (
                        <p className="text-[10px] text-[#9E9892]/60">{formatMoney(montoVES, 'VES')}</p>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#9E9892] shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                  </div>
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
                      <div className="border-t border-[#E8E4DF] px-5 py-5 space-y-4">

                        <div className="flex flex-col gap-2.5">
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
                          {p.metodo_pago === 'CRIPTO' && p.crypto_tx_hash && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <Coins className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                              <span className="text-[#9E9892]">TX Hash</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <a
                                href={`https://tronscan.org/#/transaction/${p.crypto_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 font-mono text-xs font-medium text-[#1B4332] hover:underline"
                              >
                                {p.crypto_tx_hash.slice(0, 16)}...
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          {p.metodo_pago === 'CRIPTO' && p.crypto_confirmations != null && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <ShieldCheck className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                              <span className="text-[#9E9892]">Confirmaciones</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A]">{p.crypto_confirmations}</span>
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
                          {p.fecha_acreditacion && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <ShieldCheck className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                              <span className="text-[#9E9892]">Acreditado</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A]">{formatDateTime(p.fecha_acreditacion)}</span>
                            </div>
                          )}
                          {p.notas_verificacion && (
                            <div className="flex items-start gap-2.5 text-sm">
                              <FileText className="h-3.5 w-3.5 text-[#9E9892] shrink-0 mt-0.5" />
                              <span className="text-[#9E9892]">Notas</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A] text-right max-w-[220px]">{p.notas_verificacion}</span>
                            </div>
                          )}
                          {reserva && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <Home className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                              <span className="text-[#9E9892]">Propiedad</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A] truncate max-w-[200px]">{reserva.propiedades?.titulo || '—'}</span>
                            </div>
                          )}
                          {huesped && (
                            <div className="flex items-center gap-2.5 text-sm">
                              <span className="text-[#9E9892] text-xs shrink-0 w-3.5 text-center">@</span>
                              <span className="text-[#9E9892]">Huésped</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A]">{huesped.nombre} {huesped.apellido}</span>
                            </div>
                          )}
                        </div>

                        {p.comprobante && (
                          <div className="pt-3 border-t border-[#E8E4DF]">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9E9892] mb-2">Comprobante</p>
                            <a
                              href={p.comprobante}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/img relative block overflow-hidden rounded-lg border border-[#E8E4DF]"
                            >
                              <img
                                src={p.comprobante}
                                alt="Comprobante de pago"
                                className="w-full max-h-56 object-cover transition-transform group-hover/img:scale-105"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/20">
                                <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1A1A1A] opacity-0 transition-opacity group-hover/img:opacity-100">
                                  Ver completa
                                </span>
                              </div>
                            </a>
                          </div>
                        )}

                        {esPendiente && (
                          <div className="pt-3 border-t border-[#E8E4DF] flex gap-2">
                            <button
                              disabled={accionando === p.id}
                              onClick={(e) => { e.stopPropagation(); handleAccion(p.id, 'VERIFICADO') }}
                              className="flex h-9 items-center gap-2 rounded-xl bg-[#1B4332] px-4 text-xs font-medium text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-60"
                            >
                              {accionando === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Verificar
                            </button>
                            <button
                              disabled={accionando === p.id}
                              onClick={(e) => { e.stopPropagation(); handleAccion(p.id, 'RECHAZADO') }}
                              className="flex h-9 items-center gap-2 rounded-xl border border-[#C1121F]/30 px-4 text-xs font-medium text-[#C1121F] transition-all hover:bg-[#FEE2E2] disabled:opacity-60"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Rechazar
                            </button>
                          </div>
                        )}

                        {esVerificado && (
                          <div className="pt-3 border-t border-[#E8E4DF]">
                            <button
                              disabled={accionando === p.id}
                              onClick={(e) => { e.stopPropagation(); handleAccion(p.id, 'ACREDITADO') }}
                              className="flex h-9 items-center gap-2 rounded-xl bg-[#1B4332] px-4 text-xs font-medium text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-60"
                            >
                              {accionando === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                              Acreditar
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {pagos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9E9892]">
          <CreditCard className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No se encontraron pagos</p>
          <p className="text-xs mt-1">Intenta ajustar los filtros o la búsqueda</p>
        </div>
      )}
    </motion.div>
  )
}
