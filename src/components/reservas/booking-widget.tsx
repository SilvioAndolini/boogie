// Widget de reserva para la página de detalle de propiedad
'use client'

import { useState } from 'react'
import { CalendarDays, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrecio } from '@/lib/format'

interface BookingWidgetProps {
  precioPorNoche: number
  moneda: 'USD' | 'VES'
  capacidadMaxima: number
  estanciaMinima: number
  propiedadId: string
}

export function BookingWidget({
  precioPorNoche,
  moneda,
  capacidadMaxima,
  estanciaMinima,
  propiedadId,
}: BookingWidgetProps) {
  const [fechaEntrada, setFechaEntrada] = useState<Date | undefined>()
  const [fechaSalida, setFechaSalida] = useState<Date | undefined>()
  const [huespedes, setHuespedes] = useState(1)

  // Calcular noches y total
  const noches = fechaEntrada && fechaSalida
    ? Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const subtotal = noches * precioPorNoche
  const comision = Math.round(subtotal * 0.06 * 100) / 100
  const total = subtotal + comision

  return (
    <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 shadow-lg">
      {/* Precio */}
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#1A1A1A]">
          {formatPrecio(precioPorNoche, moneda)}
        </span>
        <span className="text-[#6B6560]">/ noche</span>
      </div>

      {/* Selector de fechas y huéspedes */}
      <div className="mb-4 overflow-hidden rounded-lg border border-[#E8E4DF]">
        <div className="grid grid-cols-2">
          <button className="border-b border-r border-[#E8E4DF] p-3 text-left">
            <span className="block text-xs font-semibold text-[#1A1A1A]">Check-in</span>
            <span className="text-sm text-[#6B6560]">
              {fechaEntrada ? fechaEntrada.toLocaleDateString('es-VE') : 'Agregar fecha'}
            </span>
          </button>
          <button className="border-b border-[#E8E4DF] p-3 text-left">
            <span className="block text-xs font-semibold text-[#1A1A1A]">Check-out</span>
            <span className="text-sm text-[#6B6560]">
              {fechaSalida ? fechaSalida.toLocaleDateString('es-VE') : 'Agregar fecha'}
            </span>
          </button>
        </div>
        <button className="flex w-full items-center gap-2 p-3 text-left">
          <Users className="h-4 w-4 text-[#6B6560]" />
          <span className="text-sm text-[#6B6560]">{huespedes} huésped{huespedes > 1 ? 'es' : ''}</span>
        </button>
      </div>

      {/* Botón de reserva */}
      <Button
        className="w-full bg-[#1B4332] py-6 text-base font-semibold text-white hover:bg-[#2D6A4F]"
        disabled={!fechaEntrada || !fechaSalida}
      >
        {fechaEntrada && fechaSalida ? 'Reservar ahora' : 'Selecciona las fechas'}
      </Button>

      {/* Desglose de precios */}
      {noches > 0 && (
        <div className="mt-4 space-y-2 border-t border-[#E8E4DF] pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6560]">
              {formatPrecio(precioPorNoche, moneda)} x {noches} noche{noches > 1 ? 's' : ''}
            </span>
            <span>{formatPrecio(subtotal, moneda)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6560]">Comisión de servicio</span>
            <span>{formatPrecio(comision, moneda)}</span>
          </div>
          <div className="flex justify-between border-t border-[#E8E4DF] pt-2 font-semibold">
            <span>Total</span>
            <span>{formatPrecio(total, moneda)}</span>
          </div>
        </div>
      )}

      {/* Garantía */}
      <div className="mt-4 flex items-center gap-2 text-xs text-[#6B6560]">
        <Shield className="h-4 w-4" />
        <span>Pago seguro con verificación manual</span>
      </div>
    </div>
  )
}
