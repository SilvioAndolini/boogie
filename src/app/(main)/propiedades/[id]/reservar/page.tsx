'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Shield, CalendarDays, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentMethodSelector } from '@/components/pagos/payment-method-selector'
import { PaymentForm } from '@/components/pagos/payment-form'
import { formatPrecio, formatFecha } from '@/lib/format'
import { COMISION_PLATAFORMA_HUESPED } from '@/lib/constants'
import { crearReserva } from '@/actions/reserva.actions'
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

function ReservarContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paso, setPaso] = useState<'resumen' | 'pago' | 'confirmacion'>('resumen')
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
        if (!data) {
          toast.error('No se pudo cargar la propiedad')
          router.back()
          return
        }
        setPropiedad({
          id: data.id,
          titulo: data.titulo,
          ciudad: data.ciudad,
          estado: data.estado,
          precioPorNoche: parseFloat(String(data.precioPorNoche)),
          moneda: data.moneda as 'USD' | 'VES',
          imagenes: (data.imagenes || []).map((img: Record<string, unknown>) => ({
            url: img.url as string,
            es_principal: img.es_principal as boolean,
          })),
        })
      } catch {
        toast.error('Error al cargar la propiedad')
        router.back()
      } finally {
        setCargando(false)
      }
    }

    fetchPropiedad()
  }, [propiedadId, entradaStr, salidaStr, router])

  const noches = Math.ceil(
    (fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24)
  )

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

      if (result.exito) {
        const referencia = paymentFormData.get('referencia') as string
        console.log('[reserva] Pago referencia:', referencia, 'metodo:', metodoPago)
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const imagenPrincipal = propiedad.imagenes?.find((i) => i.es_principal)?.url
    || propiedad.imagenes?.[0]?.url

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-[#6B6560] hover:text-[#1B4332]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <h1 className="mb-6 text-2xl font-bold text-[#1A1A1A]">
        {paso === 'resumen' && 'Confirma tu reserva'}
        {paso === 'pago' && 'Realiza el pago'}
        {paso === 'confirmacion' && '¡Reserva confirmada!'}
      </h1>

      <div className="mb-8 flex items-center gap-2">
        {['resumen', 'pago', 'confirmacion'].map((p, i) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                paso === p
                  ? 'bg-[#1B4332] text-white'
                  : ['resumen', 'pago', 'confirmacion'].indexOf(paso) > i
                    ? 'bg-[#52B788] text-white'
                    : 'bg-[#E8E4DF] text-[#9E9892]'
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="h-px w-12 bg-[#E8E4DF]" />}
          </div>
        ))}
      </div>

      {paso === 'resumen' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E8E4DF] p-4">
            <div className="flex gap-4">
              {imagenPrincipal ? (
                <img
                  src={imagenPrincipal}
                  alt={propiedad.titulo}
                  className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-[#F8F6F3]" />
              )}
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{propiedad.titulo}</h3>
                <p className="text-sm text-[#6B6560]">{propiedad.ciudad}, {propiedad.estado}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E4DF] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#1B4332]" />
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {formatFecha(fechaEntrada)} → {formatFecha(fechaSalida)}
                </p>
                <p className="text-xs text-[#6B6560]">{noches} noche{noches > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#1B4332]" />
              <p className="text-sm text-[#1A1A1A]">{huespedes} huésped{huespedes > 1 ? 'es' : ''}</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E4DF] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6560]">
                {formatPrecio(precioPorNoche)} x {noches} noche{noches > 1 ? 's' : ''}
              </span>
              <span>{formatPrecio(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6560]">Comisión de servicio ({(COMISION_PLATAFORMA_HUESPED * 100).toFixed(0)}%)</span>
              <span>{formatPrecio(comision)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E8E4DF] pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrecio(total)}</span>
            </div>
          </div>

          <Button
            onClick={() => setPaso('pago')}
            className="w-full bg-[#1B4332] py-6 text-base font-semibold text-white hover:bg-[#2D6A4F]"
          >
            Continuar al pago
          </Button>
        </div>
      )}

      {paso === 'pago' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-[#FEF9E7] p-4">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              Total a pagar: {formatPrecio(total)}
            </p>
          </div>

          <PaymentMethodSelector
            selected={metodoPago}
            onSelect={setMetodoPago}
          />

          {metodoPago && (
            <PaymentForm
              metodo={metodoPago}
              monto={total}
              moneda={propiedad.moneda}
              onSubmit={handlePaymentSubmit}
            />
          )}
        </div>
      )}

      {paso === 'confirmacion' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
            <Shield className="h-8 w-8 text-[#1B4332]" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">¡Tu reserva fue registrada!</h2>
          <p className="max-w-sm text-sm text-[#6B6560]">
            Tu pago está en verificación. Te notificaremos por correo cuando sea confirmado.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="border-[#E8E4DF]" onClick={() => router.push('/dashboard/mis-reservas')}>
              Ver mis reservas
            </Button>
            <Button className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]" onClick={() => router.push('/propiedades')}>
              Seguir explorando
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReservarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
        </div>
      }
    >
      <ReservarContent />
    </Suspense>
  )
}
