'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Shield, CalendarDays, Users, Loader2,
  MapPin, Receipt, Check, Home, ArrowRight, Clock, DollarSign,
} from 'lucide-react'
import { PaymentMethodSelector } from '@/components/pagos/payment-method-selector'
import { PaymentForm } from '@/components/pagos/payment-form'
import { COMISION_PLATAFORMA_HUESPED } from '@/lib/constants'
import { crearReserva } from '@/actions/reserva.actions'
import { registrarPagoReserva } from '@/actions/pago-reserva.actions'
import { toast } from 'sonner'
import type { MetodoPagoEnum } from '@/types'

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
  { id: 'resumen', label: 'Resumen', icon: Receipt },
  { id: 'pago', label: 'Pago', icon: Shield },
  { id: 'confirmacion', label: 'Listo', icon: Check },
] as const

type PasoId = typeof PASOS[number]['id']

function ReservarContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paso, setPaso] = useState<PasoId>('resumen')
  const [metodoPago, setMetodoPago] = useState<MetodoPagoEnum | undefined>()
  const [propiedad, setPropiedad] = useState<PropiedadReserva | null>(null)
  const [cargando, setCargando] = useState(true)
  const [creandoReserva, setCreandoReserva] = useState(false)

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
  }, [propiedadId, entradaStr, salidaStr, router])

  const noches = Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24))
  const precioPorNoche = propiedad?.precioPorNoche || 0
  const subtotal = noches * precioPorNoche
  const comision = Math.round(subtotal * COMISION_PLATAFORMA_HUESPED * 100) / 100
  const total = subtotal + comision

  const handlePaymentSubmit = async (paymentFormData: FormData) => {
    if (!propiedad || !metodoPago) return
    setCreandoReserva(true)
    try {
      const result = await crearReserva({
        propiedadId: propiedad.id,
        fechaEntrada: fechaEntrada.toISOString(),
        fechaSalida: fechaSalida.toISOString(),
        cantidadHuespedes: huespedes,
      })

      if (result.exito && result.datos) {
        const referencia = paymentFormData.get('referencia') as string
        const bancoEmisor = paymentFormData.get('bancoEmisor') as string
        const telefonoEmisor = paymentFormData.get('telefonoEmisor') as string
        const comprobanteFile = paymentFormData.get('comprobante') as File | null

        if (referencia && metodoPago) {
          let comprobanteBase64: string | undefined
          let comprobanteExt: string | undefined
          if (comprobanteFile) {
            comprobanteExt = comprobanteFile.name.split('.').pop() || 'jpg'
            const bytes = new Uint8Array(await comprobanteFile.arrayBuffer())
            let binary = ''
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
            comprobanteBase64 = btoa(binary)
          }
          await registrarPagoReserva({
            reservaId: result.datos.id, monto: total, moneda: propiedad.moneda,
            metodoPago: metodoPago, referencia,
            bancoEmisor: bancoEmisor || undefined,
            telefonoEmisor: telefonoEmisor || undefined,
            comprobanteBase64, comprobanteExt,
          })
        }
        setPaso('confirmacion')
      } else if (result.error) {
        toast.error(result.error.mensaje)
      }
    } catch {
      toast.error('Error al crear la reserva')
    } finally {
      setCreandoReserva(false)
    }
  }

  if (cargando || !propiedad) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const imagenPrincipal = propiedad.imagenes?.find((i) => i.es_principal)?.url || propiedad.imagenes?.[0]?.url
  const pasoIndex = PASOS.findIndex((p) => p.id === paso)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* ====== BACK ====== */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <button
          onClick={() => paso === 'pago' ? setPaso('resumen') : router.back()}
          className="flex items-center gap-2 text-sm text-[#9E9892] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {paso === 'pago' ? 'Volver al resumen' : 'Volver'}
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
                <div className={`mx-3 h-px w-16 transition-colors duration-300 ${pasoIndex > i ? 'bg-[#52B788]' : 'bg-[#E8E4DF]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ====== STEPS ====== */}
      <AnimatePresence mode="wait">
        {paso === 'resumen' && (
          <motion.div key="resumen" variants={stagger} initial="hidden" animate="visible" exit={{ opacity: 0, y: -10 }} className="space-y-4">

            {/* Property hero */}
            <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-4 p-5">
                {imagenPrincipal ? (
                  <img src={imagenPrincipal} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-white/20" />
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
                  <span className="text-[#9E9892]">Duración</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{noches} noche{noches > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Users className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Huéspedes</span>
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
                <div className="flex items-center gap-2.5 text-sm">
                  <Shield className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-[#9E9892]">Comisión ({(COMISION_PLATAFORMA_HUESPED * 100).toFixed(0)}%)</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{formatUSD(comision)}</span>
                </div>
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
                onClick={() => setPaso('pago')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98]"
              >
                Continuar al pago
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {paso === 'pago' && (
          <motion.div key="pago" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-5">

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
                  <p className="text-xs text-white/60">{formatDateShort(fechaEntrada)} → {formatDateShort(fechaSalida)}</p>
                </div>
              </div>
            </div>

            <PaymentMethodSelector selected={metodoPago} onSelect={setMetodoPago} />

            {metodoPago && (
              <PaymentForm
                metodo={metodoPago}
                monto={total}
                moneda={propiedad.moneda}
                onSubmit={handlePaymentSubmit}
              />
            )}
          </motion.div>
        )}

        {paso === 'confirmacion' && (
          <motion.div key="confirmacion" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className="relative overflow-hidden rounded-2xl border border-[#E8E4DF] bg-gradient-to-br from-white to-[#F8F6F3]">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#1B4332]/[0.03]" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[#1B4332]/[0.03]" />

              <div className="relative flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C]">
                  <Check className="h-8 w-8 text-white" />
                </div>

                <h2 className="text-xl font-bold text-[#1A1A1A]">¡Reserva registrada!</h2>

                <p className="max-w-sm text-sm text-[#6B6560] leading-relaxed">
                  Tu pago está en verificación. Te notificaremos por correo cuando sea confirmado.
                </p>

                <div className="mt-2 flex gap-3">
                  <button
                    onClick={() => router.push('/dashboard/mis-reservas')}
                    className="flex h-10 items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-5 text-sm font-medium text-[#1A1A1A] transition-all hover:bg-[#F8F6F3]"
                  >
                    Mis reservas
                  </button>
                  <button
                    onClick={() => router.push('/propiedades')}
                    className="flex h-10 items-center gap-2 rounded-xl bg-[#1B4332] px-5 text-sm font-medium text-white transition-all hover:bg-[#2D6A4F]"
                  >
                    Explorar
                  </button>
                </div>
              </div>
            </div>
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
