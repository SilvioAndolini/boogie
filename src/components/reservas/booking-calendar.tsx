'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'

interface BookingCalendarProps {
  fechaEntrada?: Date
  fechaSalida?: Date
  fechasOcupadas?: { inicio: Date; fin: Date; estado: string }[]
  onFechaEntradaChange?: (fecha: Date) => void
  onFechaSalidaChange?: (fecha: Date) => void
  propiedadId?: string
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function soloFecha(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

type DiaEstado = 'disponible' | 'pendiente' | 'ocupada' | 'bloqueada'

function obtenerEstadosPorDia(rangos: { inicio: Date; fin: Date; estado: string }[]): Map<number, DiaEstado> {
  const dias = new Map<number, DiaEstado>()
  const prioridad: Record<DiaEstado, number> = {
    bloqueada: 4,
    ocupada: 3,
    pendiente: 2,
    disponible: 1,
  }

  function clasificar(estado: string): DiaEstado {
    switch (estado) {
      case 'PENDIENTE_CONFIRMACION':
      case 'PENDIENTE_PAGO':
        return 'pendiente'
      case 'BLOQUEADA':
        return 'bloqueada'
      default:
        return 'ocupada'
    }
  }

  for (const { inicio, fin, estado } of rangos) {
    const start = soloFecha(inicio)
    const end = soloFecha(fin)
    const tipo = clasificar(estado)
    for (let t = start; t < end; t += 86400000) {
      const actual = dias.get(t)
      if (!actual || prioridad[tipo] > prioridad[actual]) {
        dias.set(t, tipo)
      }
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
  propiedadId,
}: BookingCalendarProps) {
  const [mesActual, setMesActual] = useState(new Date())
  const [verificando, setVerificando] = useState(false)

  const ano = mesActual.getFullYear()
  const mes = mesActual.getMonth()

  const primerDia = new Date(ano, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(ano, mes + 1, 0).getDate()

  const estadosPorDia = obtenerEstadosPorDia(fechasOcupadas)

  const mesAnterior = () => setMesActual(new Date(ano, mes - 1, 1))
  const mesSiguiente = () => setMesActual(new Date(ano, mes + 1, 1))

  const estadoDia = (ts: number): DiaEstado => estadosPorDia.get(ts) || 'disponible'

  const esNoSeleccionable = (ts: number): boolean => {
    const e = estadoDia(ts)
    return e === 'ocupada' || e === 'bloqueada'
  }

  const rangoTieneBloqueados = (startTs: number, endTs: number) => {
    for (let t = startTs; t <= endTs; t += 86400000) {
      if (esNoSeleccionable(t)) return true
    }
    return false
  }

  const enRango = (ts: number) => {
    if (!fechaEntrada || !fechaSalida) return false
    const entTs = soloFecha(fechaEntrada)
    const salTs = soloFecha(fechaSalida)
    return ts > entTs && ts < salTs
  }

  const handleDiaClick = async (dia: number) => {
    const fecha = new Date(ano, mes, dia)
    const ts = soloFecha(fecha)
    const hoyTs = soloFecha(new Date())

    if (esNoSeleccionable(ts) || ts < hoyTs) return

    if (!fechaEntrada || (fechaEntrada && fechaSalida)) {
      onFechaEntradaChange?.(fecha)
      onFechaSalidaChange?.(undefined as unknown as Date)
      return
    }

    const entTs = soloFecha(fechaEntrada)

    if (ts <= entTs) {
      onFechaEntradaChange?.(fecha)
      onFechaSalidaChange?.(undefined as unknown as Date)
      return
    }

    if (rangoTieneBloqueados(entTs, ts)) {
      onFechaEntradaChange?.(fecha)
      onFechaSalidaChange?.(undefined as unknown as Date)
      return
    }

    if (propiedadId) {
      setVerificando(true)
      try {
        const verif = await verificarDisponibilidad(propiedadId, fechaEntrada, fecha)
        if (!verif.disponible) {
          return
        }
      } catch {
        onFechaSalidaChange?.(fecha)
        return
      } finally {
        setVerificando(false)
      }
    }

    onFechaSalidaChange?.(fecha)
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
          {MESES[mes]} {ano}
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
          const ts = soloFecha(new Date(ano, mes, dia))
          const pasado = ts < hoyTs
          const estado = estadoDia(ts)
          const noSeleccionable = pasado || estado === 'ocupada' || estado === 'bloqueada'
          const esEntrada = entTs !== null && ts === entTs
          const esSalida = salTs !== null && ts === salTs
          const enMedio = enRango(ts)

          return (
            <button
              key={dia}
              disabled={noSeleccionable || verificando}
              onClick={() => handleDiaClick(dia)}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors sm:h-8',
                estado === 'disponible' && !pasado && !esEntrada && !esSalida && !enMedio && 'text-[#1B4332] bg-[#D8F3DC]/40 hover:bg-[#D8F3DC] cursor-pointer',
                estado === 'pendiente' && !pasado && 'bg-[#FEF3C7] text-[#92400E] cursor-pointer',
                estado === 'ocupada' && 'bg-[#FEE2E2] text-[#B91C1C] cursor-not-allowed line-through',
                estado === 'bloqueada' && 'bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed line-through',
                pasado && estado === 'disponible' && 'bg-transparent text-[#D8D3CC] cursor-not-allowed',
                esEntrada && (estado === 'disponible' || estado === 'pendiente') && 'bg-[#1B4332] !text-white rounded-l-md',
                esSalida && (estado === 'disponible' || estado === 'pendiente') && 'bg-[#1B4332] !text-white rounded-r-md',
                enMedio && (estado === 'disponible' || estado === 'pendiente') && 'bg-[#D8F3DC] text-[#1B4332]',
                ts === hoyTs && !esEntrada && !esSalida && estado === 'disponible' && 'font-bold text-[#1B4332]',
                verificando && 'opacity-60',
              )}
            >
              {dia}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[#6B6560]">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#D8F3DC]/60" />
          Disponible
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FEF3C7]" />
          Por confirmar
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FEE2E2]" />
          Ocupada
        </div>
      </div>
    </div>
  )
}
