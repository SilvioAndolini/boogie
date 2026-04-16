'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Clock, Loader2, MapPin, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { formatPrecio } from '@/lib/format'
import { COMISION_PLATAFORMA_HUESPED } from '@/lib/constants'
import { goGet } from '@/lib/go-api-client'
import { useRouter } from 'next/navigation'

interface BloqueHorario {
  hora: string
  disponible: boolean
}

interface CanchaBookingWidgetProps {
  propiedadId: string
  titulo: string
  ciudad: string
  estado: string
  imagenes: { url: string; es_principal: boolean }[]
  precioPorHora: number
  moneda: 'USD' | 'VES'
  horaApertura: string
  horaCierre: string
  tasaEuro: number
}

export function CanchaBookingWidget({
  propiedadId,
  titulo,
  ciudad,
  estado,
  precioPorHora,
  moneda,
  horaApertura,
  horaCierre,
  tasaEuro,
}: CanchaBookingWidgetProps) {
  const router = useRouter()
  const [fecha, setFecha] = useState('')
  const [bloques, setBloques] = useState<BloqueHorario[]>([])
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const [horaFin, setHoraFin] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [monedaDisplay, setMonedaDisplay] = useState<'USD' | 'VES'>(moneda)

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

    const fetchDisponibilidad = async () => {
      setCargando(true)
      try {
        const data = await goGet<BloqueHorario[]>(`/api/v1/canchas/${propiedadId}/disponibilidad?fecha=${fecha}`)
        setBloques(data || [])
      } catch {
        setBloques([])
      } finally {
        setCargando(false)
      }
    }
    fetchDisponibilidad()
  }, [fecha, propiedadId])

  const toggleHora = useCallback((hora: string) => {
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

    const minH = Math.min(h1, h2)
    const maxH = Math.max(h1, h2)

    for (let h = minH; h < maxH; h++) {
      const bloque = bloques.find(b => parseInt(b.hora.split(':')[0]) === h)
      if (!bloque || !bloque.disponible) {
        setHoraInicio(hora)
        setHoraFin(null)
        return
      }
    }

    setHoraInicio(`${String(minH).padStart(2, '0')}:00`)
    setHoraFin(`${String(maxH).padStart(2, '0')}:00`)
  }, [horaInicio, horaFin, bloques])

  const horasSeleccionadas = horaInicio && horaFin
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

  const hoy = new Date().toISOString().split('T')[0]

  const handleReservar = () => {
    if (!fecha || !horaInicio || !horaFin) return
    const params = new URLSearchParams({ fecha, horaInicio, horaFin })
    router.push(`/canchas/${propiedadId}/reservar?${params.toString()}`)
  }

  return (
    <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5 shadow-sm">
      {/* Precio */}
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-[#1A1A1A]">
            {formatPrecio(precioDisplay, monedaDisplay)}
          </span>
          <span className="text-sm text-[#9E9892]">/hora</span>
        </div>
        <button
          onClick={() => setMonedaDisplay(prev => prev === 'USD' ? 'VES' : 'USD')}
          className="rounded-lg border border-[#E8E4DF] px-2 py-1 text-[10px] font-medium text-[#6B6560] hover:bg-[#F4F1EC]"
        >
          {monedaDisplay}
        </button>
      </div>

      {/* Info */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-[#6B6560]">
        <MapPin className="h-3 w-3 shrink-0 text-[#1B4332]" />
        <span>{ciudad}, {estado}</span>
      </div>

      {/* Fecha */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">
          <CalendarDays className="mr-1 inline h-3 w-3" />
          Fecha
        </label>
        <input
          type="date"
          min={hoy}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full rounded-xl border border-[#E8E4DF] px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]/20"
        />
      </div>

      {/* Horarios */}
      {fecha && (
        <div className="mb-4">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">
            <Clock className="mr-1 inline h-3 w-3" />
            Selecciona horarios
          </label>

          {cargando ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#52B788]" />
            </div>
          ) : bloques.length === 0 ? (
            <p className="py-3 text-center text-xs text-[#9E9892]">No hay horarios disponibles</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {bloques.map((bloque) => {
                const h = parseInt(bloque.hora.split(':')[0])
                const isSelected = horaInicio && horaFin && h >= parseInt(horaInicio.split(':')[0]) && h < parseInt(horaFin.split(':')[0])
                const isStart = horaInicio === bloque.hora
                const isEnd = horaFin === bloque.hora

                return (
                  <button
                    key={bloque.hora}
                    disabled={!bloque.disponible}
                    onClick={() => bloque.disponible && toggleHora(bloque.hora)}
                    className={`rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                      isSelected || isStart || isEnd
                        ? 'bg-[#1B4332] text-white shadow-sm'
                        : bloque.disponible
                          ? 'border border-[#E8E4DF] bg-[#F8F6F3] text-[#1A1A1A] hover:border-[#1B4332]/30 hover:bg-[#D8F3DC]/50'
                          : 'cursor-not-allowed border border-[#E8E4DF] bg-[#E8E4DF]/50 text-[#9E9892] line-through'
                    }`}
                  >
                    {bloque.hora}
                  </button>
                )
              })}
            </div>
          )}

          {horaInicio && !horaFin && (
            <p className="mt-2 text-[10px] text-[#52B788]">
              Selecciona la hora de fin
            </p>
          )}
        </div>
      )}

      {/* Resumen */}
      {horasSeleccionadas > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
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
            <span className="text-sm font-bold text-[#1B4332]">{formatPrecio(total, monedaDisplay)}</span>
          </div>
        </motion.div>
      )}

      {/* Botón */}
      <Button
        onClick={handleReservar}
        disabled={horasSeleccionadas === 0}
        className="h-12 w-full rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98] disabled:opacity-50"
      >
        {horasSeleccionadas > 0 ? `Reservar ${horasSeleccionadas}h` : 'Selecciona fecha y hora'}
      </Button>

      {/* Horario atención */}
      <p className="mt-3 text-center text-[10px] text-[#9E9892]">
        Horario: {horaApertura} — {horaCierre}
      </p>
    </div>
  )
}
