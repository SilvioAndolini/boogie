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

function soloFecha(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function obtenerDiasOcupados(rangos: { inicio: Date; fin: Date }[]): Set<number> {
  const dias = new Set<number>()
  for (const { inicio, fin } of rangos) {
    const start = soloFecha(inicio)
    const end = soloFecha(fin)
    for (let t = start; t <= end; t += 86400000) {
      dias.add(t)
    }
  }
  return dias
}

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

  const primerDia = new Date(año, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(año, mes + 1, 0).getDate()

  const diasOcupados = obtenerDiasOcupados(fechasOcupadas)

  const mesAnterior = () => {
    setMesActual(new Date(año, mes - 1, 1))
  }
  const mesSiguiente = () => {
    setMesActual(new Date(año, mes + 1, 1))
  }

  const estaOcupada = (ts: number) => diasOcupados.has(ts)

  const rangoTieneOcupados = (startTs: number, endTs: number) => {
    for (let t = startTs; t <= endTs; t += 86400000) {
      if (diasOcupados.has(t)) return true
    }
    return false
  }

  const enRango = (ts: number) => {
    if (!fechaEntrada || !fechaSalida) return false
    const entTs = soloFecha(fechaEntrada)
    const salTs = soloFecha(fechaSalida)
    return ts > entTs && ts < salTs
  }

  const handleDiaClick = (dia: number) => {
    const fecha = new Date(año, mes, dia)
    const ts = soloFecha(fecha)
    const hoyTs = soloFecha(new Date())

    if (estaOcupada(ts) || ts < hoyTs) return

    if (!fechaEntrada || (fechaEntrada && fechaSalida)) {
      onFechaEntradaChange?.(fecha)
      onFechaSalidaChange?.(undefined as unknown as Date)
    } else {
      const entTs = soloFecha(fechaEntrada)
      if (ts > entTs && !rangoTieneOcupados(entTs, ts)) {
        onFechaSalidaChange?.(fecha)
      } else if (ts > entTs) {
        onFechaEntradaChange?.(fecha)
        onFechaSalidaChange?.(undefined as unknown as Date)
      } else {
        onFechaEntradaChange?.(fecha)
        onFechaSalidaChange?.(undefined as unknown as Date)
      }
    }
  }

  const hoyTs = soloFecha(new Date())
  const entTs = fechaEntrada ? soloFecha(fechaEntrada) : null
  const salTs = fechaSalida ? soloFecha(fechaSalida) : null

  return (
    <div className="w-full">
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

      <div className="mb-2 grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="flex h-8 items-center justify-center text-xs font-medium text-[#9E9892]">
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: ajustePrimerDia }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {Array.from({ length: diasEnMes }).map((_, i) => {
          const dia = i + 1
          const ts = soloFecha(new Date(año, mes, dia))
          const pasado = ts < hoyTs
          const ocupada = estaOcupada(ts)
          const esEntrada = entTs !== null && ts === entTs
          const esSalida = salTs !== null && ts === salTs
          const enMedio = enRango(ts)
          const seleccionable = !pasado && !ocupada

          return (
            <button
              key={dia}
              disabled={!seleccionable}
              onClick={() => handleDiaClick(dia)}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors sm:h-8',
                seleccionable && 'hover:bg-[#D8F3DC] cursor-pointer',
                pasado && !ocupada && 'text-[#D8D3CC] cursor-not-allowed',
                ocupada && 'bg-[#FEE2E2] text-[#B91C1C] cursor-not-allowed line-through',
                esEntrada && !ocupada && 'bg-[#1B4332] text-white rounded-l-md',
                esSalida && !ocupada && 'bg-[#1B4332] text-white rounded-r-md',
                enMedio && !ocupada && 'bg-[#D8F3DC] text-[#1B4332]',
                ts === hoyTs && !esEntrada && !esSalida && !ocupada && 'font-bold text-[#1B4332]',
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
