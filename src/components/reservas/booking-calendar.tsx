// Calendario de disponibilidad para reservas
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BookingCalendarProps {
  fechaEntrada?: Date
  fechaSalida?: Date
  fechasOcupadas?: { inicio: Date; fin: Date }[]
  onFechaEntradaChange?: (fecha: Date) => void
  onFechaSalidaChange?: (fecha: Date) => void
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function BookingCalendar({
  fechaEntrada,
  fechaSalida,
  fechasOcupadas = [],
  onFechaEntradaChange,
  onFechaSalidaChange,
}: BookingCalendarProps) {
  const [mesActual, setMesActual] = useState(new Date())

  const año = mesActual.getFullYear()
  const mes = mesActual.getMonth()

  // Primer día del mes y total de días
  const primerDia = new Date(año, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1 // Ajustar para empezar en lunes
  const diasEnMes = new Date(año, mes + 1, 0).getDate()

  // Navegar meses
  const mesAnterior = () => {
    setMesActual(new Date(año, mes - 1, 1))
  }
  const mesSiguiente = () => {
    setMesActual(new Date(año, mes + 1, 1))
  }

  // Verificar si una fecha está ocupada
  const estaOcupada = (fecha: Date) => {
    return fechasOcupadas.some(({ inicio, fin }) => {
      return fecha >= inicio && fecha <= fin
    })
  }

  // Verificar si una fecha está en el rango seleccionado
  const enRango = (fecha: Date) => {
    if (!fechaEntrada || !fechaSalida) return false
    return fecha > fechaEntrada && fecha < fechaSalida
  }

  // Manejar click en un día
  const handleDiaClick = (dia: number) => {
    const fecha = new Date(año, mes, dia)

    if (estaOcupada(fecha)) return
    if (fecha < new Date()) return

    if (!fechaEntrada || (fechaEntrada && fechaSalida)) {
      onFechaEntradaChange?.(fecha)
      onFechaSalidaChange?.(undefined as unknown as Date)
    } else if (fecha > fechaEntrada) {
      onFechaSalidaChange?.(fecha)
    } else {
      onFechaEntradaChange?.(fecha)
    }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  return (
    <div className="w-full">
      {/* Encabezado del calendario */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={mesAnterior}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-[#1A1A1A]">
          {MESES[mes]} {año}
        </span>
        <Button variant="ghost" size="icon" onClick={mesSiguiente}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="flex h-8 items-center justify-center text-xs font-medium text-[#9E9892]">
            {dia}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: ajustePrimerDia }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1
          const fecha = new Date(año, mes, dia)
          const esHoy = fecha.getTime() === hoy.getTime()
          const pasado = fecha < hoy
          const ocupada = estaOcupada(fecha)
          const esEntrada = fechaEntrada && fecha.getTime() === fechaEntrada.getTime()
          const esSalida = fechaSalida && fecha.getTime() === fechaSalida.getTime()
          const enMedio = enRango(fecha)
          const seleccionable = !pasado && !ocupada

          return (
            <button
              key={dia}
              disabled={!seleccionable}
              onClick={() => handleDiaClick(dia)}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors sm:h-8',
                seleccionable && 'hover:bg-[#D8F3DC] cursor-pointer',
                !seleccionable && 'text-[#D8D3CC] cursor-not-allowed line-through',
                esEntrada && 'bg-[#1B4332] text-white rounded-l-md',
                esSalida && 'bg-[#1B4332] text-white rounded-r-md',
                enMedio && 'bg-[#D8F3DC] text-[#1B4332]',
                esHoy && !esEntrada && !esSalida && 'font-bold text-[#1B4332]',
              )}
            >
              {dia}
            </button>
          )
        })}
      </div>
    </div>
  )
}
