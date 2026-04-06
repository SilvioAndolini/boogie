// Página de reserva de una propiedad (flujo de pago)
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Shield, CalendarDays, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaymentMethodSelector } from '@/components/pagos/payment-method-selector'
import { PaymentForm } from '@/components/pagos/payment-form'
import { formatPrecio, formatFecha } from '@/lib/format'
import type { MetodoPagoEnum } from '@/types'

export default function ReservarPage() {
  const params = useParams()
  const router = useRouter()
  const [paso, setPaso] = useState<'resumen' | 'pago' | 'confirmacion'>('resumen')
  const [metodoPago, setMetodoPago] = useState<MetodoPagoEnum | undefined>()

  // Datos placeholder de la propiedad y reserva
  const propiedad = {
    titulo: 'Apartamento con vista al mar',
    ciudad: 'Porlamar',
    estado: 'Nueva Esparta',
    precioPorNoche: 45,
    moneda: 'USD' as const,
  }

  const reserva = {
    fechaEntrada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    fechaSalida: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    noches: 3,
    huespedes: 2,
    subtotal: 135,
    comision: 8.10,
    total: 143.10,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Encabezado */}
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

      {/* Indicador de pasos */}
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

      {/* Paso 1: Resumen */}
      {paso === 'resumen' && (
        <div className="space-y-6">
          {/* Detalle de la propiedad */}
          <div className="rounded-xl border border-[#E8E4DF] p-4">
            <div className="flex gap-4">
              <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-[#F8F6F3]" />
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">{propiedad.titulo}</h3>
                <p className="text-sm text-[#6B6560]">{propiedad.ciudad}, {propiedad.estado}</p>
              </div>
            </div>
          </div>

          {/* Detalle de la reserva */}
          <div className="rounded-xl border border-[#E8E4DF] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#1B4332]" />
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {formatFecha(reserva.fechaEntrada)} → {formatFecha(reserva.fechaSalida)}
                </p>
                <p className="text-xs text-[#6B6560]">{reserva.noches} noches</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#1B4332]" />
              <p className="text-sm text-[#1A1A1A]">{reserva.huespedes} huésped{reserva.huespedes > 1 ? 'es' : ''}</p>
            </div>
          </div>

          {/* Desglose de precios */}
          <div className="rounded-xl border border-[#E8E4DF] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6560]">
                {formatPrecio(propiedad.precioPorNoche)} x {reserva.noches} noches
              </span>
              <span>{formatPrecio(reserva.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6560]">Comisión de servicio</span>
              <span>{formatPrecio(reserva.comision)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E8E4DF] pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrecio(reserva.total)}</span>
            </div>
          </div>

          <Button
            onClick={() => setPaso('pago')}
            className="w-full bg-[#E76F51] py-6 text-base font-semibold text-white hover:bg-[#D45D3E]"
          >
            Continuar al pago
          </Button>
        </div>
      )}

      {/* Paso 2: Pago */}
      {paso === 'pago' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-[#FEF9E7] p-4">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              Total a pagar: {formatPrecio(reserva.total)}
            </p>
          </div>

          <PaymentMethodSelector
            selected={metodoPago}
            onSelect={setMetodoPago}
          />

          {metodoPago && (
            <PaymentForm
              metodo={metodoPago}
              monto={reserva.total}
              moneda={propiedad.moneda}
              onSubmit={() => setPaso('confirmacion')}
            />
          )}
        </div>
      )}

      {/* Paso 3: Confirmación */}
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
