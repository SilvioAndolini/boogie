'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Shield, CalendarDays, Users, Loader2,
  MapPin, Receipt, Check, Home, ArrowRight, Clock, DollarSign,
  Sparkles, Tag, XCircle,
} from 'lucide-react'
import { PaymentMethodSelector } from '@/components/pagos/payment-method-selector'
import { PaymentForm } from '@/components/pagos/payment-form'
import { BoogieStore } from '@/components/reservas/boogie-store'
import { CuponInput } from '@/components/reservas/cupon-input'
import { TTLCountdown } from '@/components/reservas/ttl-countdown'
import { TTLExpiredModal } from '@/components/reservas/ttl-expired-modal'
import { COMISION_PLATAFORMA_HUESPED } from '@/lib/constants'
import { crearReserva } from '@/actions/reserva.actions'
import { cancelarReserva } from '@/actions/reserva.actions'
import { crearReservaConPago, registrarPagoReserva } from '@/actions/pago-reserva.actions'
import Image from 'next/image'
import { toast } from 'sonner'
import type { MetodoPagoEnum } from '@/types'
import type { CartItem } from '@/lib/store-constants'

interface PropiedadReserva {
  id: string
  titulo: string
  ciudad: string
  estado: string
  precioPorNoche: number
  moneda: 'USD' | 'VES'
  imagenes: { url: string; es_principal: boolean }[]
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}

function formatDateLong(d: Date) {
  return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })
}

const PASOS = [
  { id: 'store', label: 'Arma tu Boogie', icon: Sparkles },
  { id: 'resumen', label: 'Resumen', icon: Receipt },
  { id: 'pago', label: 'Pago', icon: Shield },
] as const

type PasoId = typeof PASOS[number]['id']

function ReservarContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paso, setPaso] = useState<PasoId>('store')
  const [metodoPago, setMetodoPago] = useState<MetodoPagoEnum | undefined>()
  const [propiedad, setPropiedad] = useState<PropiedadReserva | null>(null)
  const [cargando, setCargando] = useState(true)
  const [creandoReserva, setCreandoReserva] = useState(false)
  const [reservaCreadaId, setReservaCreadaId] = useState<string | null>(null)
  const [fechaCreacionReserva, setFechaCreacionReserva] = useState<Date | null>(null)
  const [storeCart, setStoreCart] = useState<CartItem[]>([])
  const [tasaCambio, setTasaCambio] = useState(78.39)
  const [cuponCodigo, setCuponCodigo] = useState<string | null>(null)
  const [descuentoCupon, setDescuentoCupon] = useState(0)
  const [ttlExpired, setTtlExpired] = useState(false)

  const propiedadId = params.id as string
  const entradaStr = searchParams.get('entrada') || ''
  const salidaStr = searchParams.get('salida') || ''
  const huespedes = parseInt(searchParams.get('huespedes') || '1', 10)
  const fechaEntrada = entradaStr ? new Date(entradaStr) : new Date()
  const fechaSalida = salidaStr ? new Date(salidaStr) : new Date()

  useEffect(() => {
    if (!entradaStr || !salidaStr) {
      toast.error('Faltan datos de la reserva')
      router.back()
      return
    }

    const fetchPropiedad = async () => {
      try {
        const { getPropiedadPorId } = await import('@/actions/propiedad.actions')
        const data = await getPropiedadPorId(propiedadId)
        if (!data) { toast.error('No se pudo cargar la propiedad'); router.back(); return }
        setPropiedad({
          id: data.id, titulo: data.titulo, ciudad: data.ciudad, estado: data.estado,
          precioPorNoche: parseFloat(String(data.precioPorNoche)),
          moneda: data.moneda as 'USD' | 'VES',
          imagenes: (data.imagenes || []).map((img: Record<string, unknown>) => ({
            url: img.url as string, es_principal: img.es_principal as boolean,
          })),
        })
      } catch { toast.error('Error al cargar la propiedad'); router.back() }
      finally { setCargando(false) }
    }
    fetchPropiedad()

    const fetchTasa = async () => {
      try {
        const res = await fetch('/api/exchange-rate')
        if (res.ok) {
          const body = await res.json()
          const data = body?.data ?? body
          setTasaCambio(data.tasa ?? 78.39)
        }
      } catch {}
    }
    fetchTasa()
  }, [propiedadId, entradaStr, salidaStr, router])

  const noches = Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24))
  const precioPorNoche = propiedad?.precioPorNoche || 0
  const subtotal = noches * precioPorNoche
  const subtotalConDescuento = Math.max(0, subtotal - descuentoCupon)
  const comision = Math.round(subtotalConDescuento * COMISION_PLATAFORMA_HUESPED * 100) / 100

  const storeTotal = storeCart.reduce((sum, item) => {
    const esPorNoche = item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE'
    return sum + (esPorNoche ? item.precio * noches : item.precio) * item.cantidad
  }, 0)

  const total = subtotalConDescuento + comision + storeTotal

  const handleConfirmarReserva = async () => {
    if (!propiedad) return
    setCreandoReserva(true)
    try {
      const result = await crearReserva({
        propiedadId: propiedad.id,
        fechaEntrada: fechaEntrada.toISOString(),
        fechaSalida: fechaSalida.toISOString(),
        cantidadHuespedes: huespedes,
        storeItems: storeCart,
        noches,
        cuponCodigo: cuponCodigo || undefined,
      })

      if (result.exito && result.datos) {
        setReservaCreadaId(result.datos.id)
        setFechaCreacionReserva(new Date())
        setPaso('pago')
      } else if (result.error) {
        toast.error(result.error.mensaje)
      }
    } catch (err) {
      console.error('[ReservarPage] Error:', err)
      toast.error(err instanceof Error ? err.message : 'Error al crear la reserva')
    } finally {
      setCreandoReserva(false)
    }
  }

  const handleCancelarReserva = async () => {
    if (!reservaCreadaId) return
    try {
      const result = await cancelarReserva(reservaCreadaId, undefined, propiedadId)
      if (result.exito) {
        toast.success('Reserva cancelada')
        router.push(`/propiedades/${propiedadId}`)
      } else {
        toast.error(result.error?.mensaje || 'Error al cancelar la reserva')
      }
    } catch {
      toast.error('Error al cancelar la reserva')
    }
  }

  const handlePaymentSubmit = async (paymentFormData: FormData) => {
    if (!propiedad || !metodoPago || !reservaCreadaId) return

    const referencia = paymentFormData.get('referencia') as string
    const bancoEmisor = paymentFormData.get('bancoEmisor') as string
    const telefonoEmisor = paymentFormData.get('telefonoEmisor') as string
    const comprobanteFile = paymentFormData.get('comprobante') as File | null

    let comprobanteBase64: string | undefined
    let comprobanteExt: string | undefined
    if (comprobanteFile) {
      comprobanteExt = comprobanteFile.name.split('.').pop() || 'jpg'
      const bytes = new Uint8Array(await comprobanteFile.arrayBuffer())
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      comprobanteBase64 = btoa(binary)
    }

    try {
      const result = await registrarPagoReserva({
        reservaId: reservaCreadaId,
        monto: total,
        moneda: propiedad.moneda,
        metodoPago: metodoPago,
        referencia: referencia || '',
        bancoEmisor: bancoEmisor || undefined,
        telefonoEmisor: telefonoEmisor || undefined,
        comprobanteBase64,
        comprobanteExt,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }
    } catch (err) {
      console.error('[ReservarPage] Payment error:', err)
      toast.error(err instanceof Error ? err.message : 'Error al registrar el pago')
    }
  }

  const handleTTLExpired = useCallback(async () => {
    if (reservaCreadaId) {
      try {
        await cancelarReserva(reservaCreadaId, 'TTL expirado', propiedadId)
      } catch {}
    }
    setTtlExpired(true)
  }, [reservaCreadaId, propiedadId])

  const fechaExpiracion = fechaCreacionReserva
    ? new Date(fechaCreacionReserva.getTime() + 15 * 60 * 1000)
    : null

  useEffect(() => {
    if (metodoPago !== 'CRIPTO' && metodoPago !== 'WALLET' && reservaCreadaId && metodoPago) {
      setReservaCreadaId(null)
    }
  }, [metodoPago])

  if (cargando || !propiedad) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const imagenPrincipal = propiedad.imagenes?.find((i) => i.es_principal)?.url || propiedad.imagenes?.[0]?.url
  const pasoIndex = PASOS.findIndex((p) => p.id === paso)

  const getBackAction = () => {
    if (paso === 'resumen') return () => setPaso('store')
    if (paso === 'pago' && !reservaCreadaId) return () => setPaso('resumen')
    return () => router.push(`/propiedades/${propiedadId}`)
  }

  const getBackLabel = () => {
    if (paso === 'resumen') return 'Volver al store'
    if (paso === 'pago' && !reservaCreadaId) return 'Volver al resumen'
    return 'Volver'
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {ttlExpired && reservaCreadaId && (
        <TTLExpiredModal onVolver={() => router.push(`/propiedades/${propiedadId}`)} />
      )}

      {/* ====== BACK ====== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <button
          onClick={getBackAction()}
          className="flex items-center gap-2 text-sm text-[#9E9892] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {getBackLabel()}
        </button>
      </motion.div>

      {/* ====== STEPPER ====== */}
      <div className="mb-8 flex items-center justify-center gap-0">
        {PASOS.map((p, i) => {
          const active = paso === p.id
          const done = pasoIndex > i
          return (
            <div key={p.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  active ? 'bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/20'
                    : done ? 'bg-[#52B788] text-white'
                    : 'bg-[#E8E4DF] text-[#9E9892]'
                  }`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-[#1B4332]' : done ? 'text-[#52B788]' : 'text-[#9E9892]'}`}>
                  {p.label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className={`mx-3 h-px w-10 transition-colors duration-300 ${pasoIndex > i ? 'bg-[#52B788]' : 'bg-[#E8E4DF]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ====== STEPS ====== */}
      <AnimatePresence mode="wait">
        {paso === 'store' && (
          <motion.div key="store" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            <BoogieStore
              noches={noches}
              tasaCambio={tasaCambio}
              initialCart={storeCart}
              onBack={() => router.push(`/propiedades/${propiedadId}`)}
              onContinue={(cart) => {
                setStoreCart(cart)
                setPaso('resumen')
              }}
            />
          </motion.div>
        )}

        {paso === 'resumen' && (
          <motion.div key="resumen" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0, y: -10 }} className="space-y-4">

            {/* Property hero */}
            <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-4 p-5">
                {imagenPrincipal ? (
                  <Image src={imagenPrincipal} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-white/20" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-2 ring-white/20">
                    <Home className="h-7 w-7 text-white/60" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white truncate">{propiedad.titulo}</h2>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{propiedad.ciudad}, {propiedad.estado}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dates & guests */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Check-in</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{formatDateLong(fechaEntrada)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Check-out</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{formatDateLong(fechaSalida)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Duracion</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{noches} noche{noches > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Users className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Huespedes</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{huespedes}</span>
                </div>
              </div>
            </motion.div>

            {/* Price breakdown */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  <Receipt className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">{formatUSD(precioPorNoche)} x {noches} noche{noches > 1 ? 's' : ''}</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{formatUSD(subtotal)}</span>
                </div>
                {descuentoCupon > 0 && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Tag className="h-3.5 w-3.5 text-[#52B788] shrink-0" />
                    <span className="text-[#52B788]">Cupon {cuponCodigo}</span>
                    <span className="flex-1 border-b border-dotted border-[#52B788]/30 min-w-[12px]" />
                    <span className="font-medium text-[#52B788]">-{formatUSD(descuentoCupon)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                  <Shield className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Comision ({(COMISION_PLATAFORMA_HUESPED * 100).toFixed(0)}%)</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{formatUSD(comision)}</span>
                </div>
                {storeTotal > 0 && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Sparkles className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                    <span className="text-[#9E9892]">Boogie Store ({storeCart.length} item{storeCart.length > 1 ? 's' : ''})</span>
                    <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                    <span className="font-medium text-[#1A1A1A]">{formatUSD(storeTotal)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm pt-2 border-t border-[#E8E4DF]">
                  <DollarSign className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                  <span className="font-bold text-[#1A1A1A]">Total</span>
                  <span className="flex-1 border-b border-dotted border-[#1B4332]/30 min-w-[12px]" />
                  <span className="text-lg font-bold text-[#1B4332]">{formatUSD(total)}</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <button
                onClick={handleConfirmarReserva}
                disabled={creandoReserva}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98] disabled:opacity-50"
              >
                {creandoReserva ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Confirmar reserva y pagar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}

        {paso === 'pago' && reservaCreadaId && (
          <motion.div key="pago" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">

            {/* TTL Countdown */}
            {fechaExpiracion && (
              <TTLCountdown fechaExpiracion={fechaExpiracion} onExpired={handleTTLExpired} />
            )}

            {/* Total badge */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total a pagar</p>
                  <p className="text-2xl font-bold text-white">{formatUSD(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40">{propiedad.titulo}</p>
                  <p className="text-xs text-white/60">{formatDateShort(fechaEntrada)} &rarr; {formatDateShort(fechaSalida)}</p>
                  {storeCart.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-[#52B788]">+ {storeCart.length} item{storeCart.length > 1 ? 's' : ''} del store</p>
                  )}
                </div>
              </div>
            </div>

            {storeTotal > 0 && (
              <div className="rounded-xl border border-[#D8F3DC] bg-[#D8F3DC]/20 p-3">
                <p className="text-xs font-semibold text-[#1B4332] mb-1.5">Boogie Store</p>
                <div className="space-y-1">
                  {storeCart.map((item) => (
                    <div key={`${item.tipo}-${item.id}`} className="flex items-center justify-between text-xs">
                      <span className="text-[#6B6560]">{item.nombre} x{item.cantidad}</span>
                      <span className="font-medium text-[#1A1A1A]">{formatUSD((item.tipo === 'servicio' && item.tipoPrecio === 'POR_NOCHE' ? item.precio * noches : item.precio) * item.cantidad)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-[#D8F3DC] pt-1 mt-1">
                    <span className="font-semibold text-[#1B4332]">Subtotal store</span>
                    <span className="font-bold text-[#1B4332]">{formatUSD(storeTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <CuponInput
              propiedadId={propiedadId}
              subtotal={subtotal + storeTotal}
              noches={noches}
              appliedCupon={cuponCodigo}
              descuento={descuentoCupon}
              onApply={(desc, cod) => { setDescuentoCupon(desc); setCuponCodigo(cod) }}
              onRemove={() => { setDescuentoCupon(0); setCuponCodigo(null) }}
            />

            <PaymentMethodSelector selected={metodoPago} onSelect={setMetodoPago} />

            {metodoPago && (
              <PaymentForm
                metodo={metodoPago}
                monto={total}
                moneda={propiedad.moneda}
                reservaId={reservaCreadaId || undefined}
                propiedadId={propiedad.id}
                fechaEntrada={fechaEntrada.toISOString()}
                fechaSalida={fechaSalida.toISOString()}
                cantidadHuespedes={huespedes}
                onCryptoReservaCreated={(id) => setReservaCreadaId(id)}
                onSubmit={handlePaymentSubmit}
              />
            )}

            {/* Cancel reservation button */}
            <button
              onClick={handleCancelarReserva}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Cancelar reserva
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ReservarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#52B788]" /></div>}>
      <ReservarContent />
    </Suspense>
  )
}
