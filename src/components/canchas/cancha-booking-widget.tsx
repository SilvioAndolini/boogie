'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CalendarDays, Clock, Loader2, MapPin,
  ChevronLeft, ChevronRight, ArrowLeftRight, Shield,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { formatPrecio, formatFechaCorta } from '@/lib/format'
import { COMISION_PLATAFORMA_HUESPED } from '@/lib/constants'
import { goGet } from '@/lib/go-api-client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BloqueHorario {
  hora: string
  estado: 'disponible' | 'ocupada' | 'pendiente'
}

interface CanchaBookingWidgetProps {
  propiedadId: string
  titulo: string
  ciudad: string
  estado: string
  precioPorHora: number
  moneda: 'USD' | 'VES'
  horaApertura: string
  horaCierre: string
  tasaEuro: number
  fechasOcupadas?: { inicio: string; fin: string; estado: string }[]
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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
      case 'PENDIENTE':
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

function CanchaCalendar({
  fechaSeleccionada,
  fechasOcupadas = [],
  onFechaChange,
}: {
  fechaSeleccionada?: Date
  fechasOcupadas: { inicio: Date; fin: Date; estado: string }[]
  onFechaChange: (fecha: Date) => void
}) {
  const [mesActual, setMesActual] = useState(new Date())

  const ano = mesActual.getFullYear()
  const mes = mesActual.getMonth()
  const primerDia = new Date(ano, mes, 1).getDay()
  const ajustePrimerDia = primerDia === 0 ? 6 : primerDia - 1
  const diasEnMes = new Date(ano, mes + 1, 0).getDate()

  const estadosPorDia = obtenerEstadosPorDia(fechasOcupadas)
  const hoyTs = soloFecha(new Date())
  const selTs = fechaSeleccionada ? soloFecha(fechaSeleccionada) : null

  const handleDiaClick = (dia: number) => {
    const fecha = new Date(ano, mes, dia)
    const ts = soloFecha(fecha)
    const est = estadosPorDia.get(ts) || 'disponible'
    if (ts <= hoyTs || est === 'ocupada' || est === 'pendiente' || est === 'bloqueada') return
    onFechaChange(fecha)
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMesActual(new Date(ano, mes - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-[#1A1A1A]">
          {MESES[mes]} {ano}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setMesActual(new Date(ano, mes + 1, 1))}>
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
          const estado = estadosPorDia.get(ts) || 'disponible'
          const hoy = ts === hoyTs
          const seleccionado = selTs !== null && ts === selTs
          const noSeleccionable = pasado || hoy || estado === 'ocupada' || estado === 'pendiente' || estado === 'bloqueada'

          return (
            <button
              key={dia}
              disabled={noSeleccionable}
              onClick={() => handleDiaClick(dia)}
              className={cn(
                'flex h-10 w-full items-center justify-center rounded-md text-sm transition-colors sm:h-8',
                estado === 'disponible' && !pasado && !seleccionado && 'text-[#1B4332] bg-[#D8F3DC]/40 hover:bg-[#D8F3DC] cursor-pointer',
                estado === 'pendiente' && 'bg-[#FEF3C7] text-[#92400E] cursor-not-allowed line-through',
                estado === 'ocupada' && 'bg-[#FEE2E2] text-[#B91C1C] cursor-not-allowed line-through',
                estado === 'bloqueada' && 'bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed line-through',
                pasado && 'bg-transparent text-[#D8D3CC] cursor-not-allowed',
                hoy && estado === 'disponible' && !seleccionado && 'bg-[#F3F4F6] text-[#9E9892] cursor-not-allowed line-through',
                seleccionado && estado === 'disponible' && 'bg-[#1B4332] !text-white rounded-md',
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

function VerticalTimeSlider({
  bloques,
  horaInicio,
  horaFin,
  onHoraClick,
}: {
  bloques: BloqueHorario[]
  horaInicio: string | null
  horaFin: string | null
  onHoraClick: (hora: string) => void
}) {
  if (bloques.length === 0) {
    return <p className="py-3 text-center text-xs text-[#9E9892]">No hay horarios disponibles</p>
  }

  const hInicio = horaInicio ? parseInt(horaInicio.split(':')[0]) : null
  const hFin = horaFin ? parseInt(horaFin.split(':')[0]) : null

  return (
    <div className="relative">
      <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-[#E8E4DF]" />

      <div className="max-h-[280px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
        {bloques.map((bloque) => {
          const h = parseInt(bloque.hora.split(':')[0])
          const enRango = hInicio !== null && hFin !== null && h >= hInicio && h < hFin
          const isStart = horaInicio === bloque.hora
          const isEnd = horaFin === bloque.hora
          const isEndpoint = isStart || isEnd
          const isClickable = bloque.estado === 'disponible'

          let dotColor: string
          let bgColor: string
          let textColor: string

          if (enRango || isEndpoint) {
            dotColor = 'bg-[#1B4332] ring-2 ring-[#1B4332]/30'
            bgColor = 'bg-[#D8F3DC] border-[#1B4332]/20'
            textColor = 'text-[#1B4332]'
          } else if (bloque.estado === 'disponible') {
            dotColor = 'bg-[#52B788]'
            bgColor = 'bg-[#F0FDF4] border-transparent hover:bg-[#D8F3DC] hover:border-[#1B4332]/20'
            textColor = 'text-[#1B4332]'
          } else if (bloque.estado === 'ocupada') {
            dotColor = 'bg-[#EF4444]'
            bgColor = 'bg-[#FEF2F2] border-transparent'
            textColor = 'text-[#B91C1C]'
          } else {
            dotColor = 'bg-[#F59E0B]'
            bgColor = 'bg-[#FFFBEB] border-transparent'
            textColor = 'text-[#92400E]'
          }

          return (
            <button
              key={bloque.hora}
              disabled={!isClickable}
              onClick={() => isClickable && onHoraClick(bloque.hora)}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
                bgColor,
              )}
            >
              <span
                className={cn(
                  'relative z-10 shrink-0 rounded-full border-2 border-white',
                  isEndpoint ? 'h-4 w-4' : 'h-3 w-3',
                  dotColor,
                )}
              />
              <span className={cn('text-sm font-semibold min-w-[50px]', textColor)}>
                {bloque.hora}
              </span>
              <span className={cn('text-[10px] font-medium', textColor)}>
                {bloque.estado === 'disponible'
                  ? enRango || isEndpoint
                    ? 'Seleccionado'
                    : 'Disponible'
                  : bloque.estado === 'ocupada'
                    ? 'Ocupada'
                    : 'Por confirmar'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[#6B6560]">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#52B788]" />
          Disponible
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
          Ocupada
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
          Por confirmar
        </div>
      </div>
    </div>
  )
}

export function CanchaBookingWidget({
  propiedadId,
  titulo,
  ciudad,
  estado: estadoProp,
  precioPorHora,
  moneda,
  horaApertura,
  horaCierre,
  tasaEuro,
  fechasOcupadas: fechasOcupadasISO,
}: CanchaBookingWidgetProps) {
  const router = useRouter()
  const [fecha, setFecha] = useState<Date | undefined>()
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [bloques, setBloques] = useState<BloqueHorario[]>([])
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const [horaFin, setHoraFin] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [monedaDisplay, setMonedaDisplay] = useState<'USD' | 'VES'>(moneda)

  const fechasOcupadas = (fechasOcupadasISO || []).map((r) => ({
    inicio: new Date(r.inicio),
    fin: new Date(r.fin),
    estado: r.estado,
  }))

  useEffect(() => {
    setMonedaDisplay(moneda)
  }, [moneda])

  useEffect(() => {
    if (!fecha) {
      setBloques([])
      setHoraInicio(null)
      setHoraFin(null)
      return
    }

    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

    const fetchDisponibilidad = async () => {
      setCargando(true)
      try {
        const data = await goGet<BloqueHorario[]>(
          `/api/v1/canchas/${propiedadId}/disponibilidad?fecha=${fechaStr}`,
        )
        setBloques(data || [])
      } catch {
        setBloques([])
      } finally {
        setCargando(false)
      }
    }
    fetchDisponibilidad()
  }, [fecha, propiedadId])

  const toggleHora = useCallback(
    (hora: string) => {
      if (!horaInicio || (horaInicio && horaFin)) {
        setHoraInicio(hora)
        setHoraFin(null)
        return
      }

      const h1 = parseInt(horaInicio.split(':')[0])
      const h2 = parseInt(hora.split(':')[0])

      if (h2 <= h1) {
        setHoraInicio(hora)
        setHoraFin(null)
        return
      }

      for (let h = h1; h < h2; h++) {
        const bloque = bloques.find((b) => parseInt(b.hora.split(':')[0]) === h)
        if (!bloque || bloque.estado !== 'disponible') {
          setHoraInicio(hora)
          setHoraFin(null)
          return
        }
      }

      setHoraInicio(`${String(h1).padStart(2, '0')}:00`)
      setHoraFin(`${String(h2).padStart(2, '0')}:00`)
    },
    [horaInicio, horaFin, bloques],
  )

  const horasSeleccionadas =
    horaInicio && horaFin
      ? parseInt(horaFin.split(':')[0]) - parseInt(horaInicio.split(':')[0])
      : 0

  const convertir = (monto: number, a: 'USD' | 'VES'): number => {
    if (moneda === 'USD' && a === 'VES') return monto * tasaEuro
    if (moneda === 'VES' && a === 'USD') return monto / tasaEuro
    return monto
  }

  const precioDisplay = convertir(precioPorHora, monedaDisplay)
  const subtotal = horasSeleccionadas * precioDisplay
  const comision = Math.round(subtotal * COMISION_PLATAFORMA_HUESPED * 100) / 100
  const total = subtotal + comision

  const handleReservar = () => {
    if (!fecha || !horaInicio || !horaFin) return
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    const params = new URLSearchParams({ fecha: fechaStr, horaInicio, horaFin })
    router.push(`/canchas/${propiedadId}/reservar?${params.toString()}`)
  }

  return (
    <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={monedaDisplay}
              initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-bold text-[#1B4332]"
            >
              {formatPrecio(precioDisplay, monedaDisplay)}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-[#9E9892]">/hora</span>
        </div>
        <motion.button
          onClick={() => setMonedaDisplay((prev) => (prev === 'USD' ? 'VES' : 'USD'))}
          animate={{
            backgroundColor: monedaDisplay === 'USD' ? '#D8F3DC' : 'transparent',
            borderColor: monedaDisplay === 'USD' ? '#52B788' : '#E8E4DF',
            color: monedaDisplay === 'USD' ? '#1B4332' : '#6B6560',
          }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
          title={`Cambiar a ${monedaDisplay === 'USD' ? 'Bolívares' : 'Dólares'}`}
        >
          <ArrowLeftRight className="h-3 w-3" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={monedaDisplay}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.15 }}
            >
              {monedaDisplay === 'USD' ? 'USD' : 'VES'}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="mb-4 flex items-center gap-1.5 text-xs text-[#6B6560]">
        <MapPin className="h-3 w-3 shrink-0 text-[#1B4332]" />
        <span>
          {ciudad}, {estadoProp}
        </span>
      </div>

      <div className="mb-3 overflow-hidden rounded-lg border border-[#E8E4DF]">
        <button
          className="flex w-full items-center justify-between p-3 text-left"
          onClick={() => setMostrarCalendario(!mostrarCalendario)}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#1B4332]" />
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#1A1A1A]">
                Fecha
              </span>
              <span className="text-sm text-[#6B6560]">
                {fecha ? formatFechaCorta(fecha) : 'Seleccionar fecha'}
              </span>
            </div>
          </div>
          <motion.div animate={{ rotate: mostrarCalendario ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="h-4 w-4 rotate-[-90deg] text-[#6B6560]" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {mostrarCalendario && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mb-3 overflow-hidden rounded-lg border border-[#E8E4DF] bg-white"
          >
            <div className="p-3">
              <CanchaCalendar
                fechaSeleccionada={fecha}
                fechasOcupadas={fechasOcupadas}
                onFechaChange={(f) => {
                  setFecha(f)
                  setHoraInicio(null)
                  setHoraFin(null)
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fecha && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mb-3 overflow-hidden rounded-lg border border-[#E8E4DF] bg-white"
          >
            <div className="p-3">
              <label className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">
                <Clock className="h-3 w-3" />
                Selecciona horario
              </label>

              {cargando ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#52B788]" />
                </div>
              ) : (
                <VerticalTimeSlider
                  bloques={bloques}
                  horaInicio={horaInicio}
                  horaFin={horaFin}
                  onHoraClick={toggleHora}
                />
              )}

              {horaInicio && !horaFin && (
                <p className="mt-2 text-[10px] font-medium text-[#52B788]">
                  Selecciona la hora de fin
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {horasSeleccionadas > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2 border-t border-[#E8E4DF] pt-3"
          >
            <div className="flex justify-between text-xs">
              <span className="text-[#6B6560]">
                {formatPrecio(precioDisplay, monedaDisplay)} x {horasSeleccionadas}h
              </span>
              <span className="font-medium text-[#1A1A1A]">{formatPrecio(subtotal, monedaDisplay)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6B6560]">Comisión ({(COMISION_PLATAFORMA_HUESPED * 100).toFixed(0)}%)</span>
              <span className="font-medium text-[#1A1A1A]">{formatPrecio(comision, monedaDisplay)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E8E4DF] pt-2">
              <span className="text-sm font-bold text-[#1A1A1A]">Total</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={monedaDisplay}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-bold text-[#1B4332]"
                >
                  {formatPrecio(total, monedaDisplay)}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleReservar}
        disabled={horasSeleccionadas === 0}
        className="h-12 w-full rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98] disabled:opacity-50"
      >
        {horasSeleccionadas > 0 ? `Reservar ${horasSeleccionadas}h` : 'Selecciona fecha y hora'}
      </Button>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-[#6B6560]">
        <Shield className="h-3.5 w-3.5 shrink-0" />
        <span>Pago seguro con verificación manual</span>
      </div>

      <p className="mt-2 text-center text-[10px] text-[#9E9892]">
        Horario: {horaApertura} — {horaCierre}
      </p>
    </div>
  )
}
