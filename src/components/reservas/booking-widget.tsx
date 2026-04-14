'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, ArrowLeftRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { formatPrecio, formatFechaCorta } from '@/lib/format'
import { BookingCalendar } from '@/components/reservas/booking-calendar'
import { COMISION_PLATAFORMA_HUESPED } from '@/lib/constants'
import { NegociaTuBoogie } from '@/components/propiedades/negocia-tu-boogie'
import { verificarDisponibilidad } from '@/lib/reservas/disponibilidad'

interface BookingWidgetProps {
  precioPorNoche: number
  moneda: 'USD' | 'VES'
  capacidadMaxima: number
  estanciaMinima: number
  propiedadId: string
  tasaEuro: number
  fechasOcupadas?: { inicio: string; fin: string; estado: string }[]
}

export function BookingWidget({
  precioPorNoche,
  moneda,
  capacidadMaxima,
  estanciaMinima,
  propiedadId,
  tasaEuro,
  fechasOcupadas: fechasOcupadasISO,
}: BookingWidgetProps) {
  const [fechaEntrada, setFechaEntrada] = useState<Date | undefined>()
  const [fechaSalida, setFechaSalida] = useState<Date | undefined>()
  const [huespedes, setHuespedes] = useState(1)
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
  const [mostrarHuespedes, setMostrarHuespedes] = useState(false)
  const [monedaDisplay, setMonedaDisplay] = useState<'USD' | 'VES'>(moneda)
  const [reservando, setReservando] = useState(false)

  const fechasOcupadas = (fechasOcupadasISO || []).map((r) => ({
    inicio: new Date(r.inicio),
    fin: new Date(r.fin),
    estado: r.estado,
  }))

  useEffect(() => {
    setMonedaDisplay(moneda)
  }, [moneda])

  const noches = fechaEntrada && fechaSalida
    ? Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const convertir = (monto: number, a: 'USD' | 'VES'): number => {
    if (moneda === 'USD' && a === 'VES') return monto * tasaEuro
    if (moneda === 'VES' && a === 'USD') return monto / tasaEuro
    return monto
  }

  const precioDisplay = convertir(precioPorNoche, monedaDisplay)
  const subtotal = noches * precioDisplay
  const comision = Math.round(subtotal * COMISION_PLATAFORMA_HUESPED * 100) / 100
  const total = subtotal + comision

  const toggleMoneda = () => {
    setMonedaDisplay((prev) => prev === 'USD' ? 'VES' : 'USD')
  }

  const handleReservar = async () => {
    if (!fechaEntrada || !fechaSalida) return
    setReservando(true)
    try {
      const verif = await verificarDisponibilidad(propiedadId, fechaEntrada, fechaSalida)
      if (!verif.disponible) {
        alert('Las fechas seleccionadas ya no estan disponibles. Por favor selecciona otras fechas.')
        setReservando(false)
        return
      }
      const params = new URLSearchParams({
        entrada: fechaEntrada.toISOString(),
        salida: fechaSalida.toISOString(),
        huespedes: huespedes.toString(),
      })
      window.location.href = `/propiedades/${propiedadId}/reservar?${params.toString()}`
    } catch {
      alert('Error al verificar disponibilidad. Intenta de nuevo.')
    } finally {
      setReservando(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E8E4DF] bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-20">
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
          <span className="text-sm text-[#6B6560]">/ noche</span>
        </div>
        <motion.button
          onClick={toggleMoneda}
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

      <div className="mb-3 overflow-hidden rounded-lg border border-[#E8E4DF]">
        <button
          className="grid w-full grid-cols-2"
          onClick={() => { setMostrarCalendario(!mostrarCalendario); setMostrarHuespedes(false) }}
        >
          <div className="border-r border-[#E8E4DF] p-3 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#1A1A1A]">Check-in</span>
            <span className="text-sm text-[#6B6560]">
              {fechaEntrada ? formatFechaCorta(fechaEntrada) : 'Agregar fecha'}
            </span>
          </div>
          <div className="p-3 text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#1A1A1A]">Check-out</span>
            <span className="text-sm text-[#6B6560]">
              {fechaSalida ? formatFechaCorta(fechaSalida) : 'Agregar fecha'}
            </span>
          </div>
        </button>

        <button
          className="flex w-full items-center justify-between border-t border-[#E8E4DF] p-3 text-left"
          onClick={() => { setMostrarHuespedes(!mostrarHuespedes); setMostrarCalendario(false) }}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#6B6560]" />
            <span className="text-sm text-[#1A1A1A]">
              {huespedes} huésped{huespedes > 1 ? 'es' : ''}
            </span>
          </div>
          {mostrarHuespedes ? <ChevronUp className="h-4 w-4 text-[#6B6560]" /> : <ChevronDown className="h-4 w-4 text-[#6B6560]" />}
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
              <BookingCalendar
                fechaEntrada={fechaEntrada}
                fechaSalida={fechaSalida}
                fechasOcupadas={fechasOcupadas}
                onFechaEntradaChange={setFechaEntrada}
                onFechaSalidaChange={setFechaSalida}
                propiedadId={propiedadId}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mostrarHuespedes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mb-3 overflow-hidden rounded-lg border border-[#E8E4DF] bg-white"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1A1A]">Huéspedes</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setHuespedes(Math.max(1, huespedes - 1))}
                    disabled={huespedes <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DF] text-[#1A1A1A] transition-colors hover:border-[#1B4332] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-[#1A1A1A]">{huespedes}</span>
                  <button
                    onClick={() => setHuespedes(Math.min(capacidadMaxima, huespedes + 1))}
                    disabled={huespedes >= capacidadMaxima}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DF] text-[#1A1A1A] transition-colors hover:border-[#1B4332] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-[#9E9892]">Máximo {capacidadMaxima} huéspedes</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleReservar}
        className="w-full bg-[#1B4332] py-6 text-base font-semibold text-white hover:bg-[#2D6A4F]"
        disabled={!fechaEntrada || !fechaSalida || (noches > 0 && noches < estanciaMinima) || reservando}
      >
        {reservando ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : noches > 0 && noches < estanciaMinima
          ? `Estancia minima: ${estanciaMinima} noches`
          : fechaEntrada && fechaSalida
            ? 'Reservar ahora'
            : 'Selecciona las fechas'}
      </Button>

      <AnimatePresence>
        {noches >= estanciaMinima && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mt-4 overflow-hidden"
          >
            <div className="space-y-2 border-t border-[#E8E4DF] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6560]">
                  {formatPrecio(precioDisplay, monedaDisplay)} x {noches} noche{noches > 1 ? 's' : ''}
                </span>
                <span className="text-[#1A1A1A]">{formatPrecio(subtotal, monedaDisplay)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6560]">Comisión de servicio ({(COMISION_PLATAFORMA_HUESPED * 100).toFixed(0)}%)</span>
                <span className="text-[#1A1A1A]">{formatPrecio(comision, monedaDisplay)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E4DF] pt-2 font-semibold">
                <span className="text-[#1A1A1A]">Total</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={monedaDisplay}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#1B4332]"
                  >
                    {formatPrecio(total, monedaDisplay)}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <NegociaTuBoogie
          propiedadId={propiedadId}
          precioPorNoche={precioDisplay}
          moneda={monedaDisplay}
          fechaEntrada={fechaEntrada ?? null}
          fechaSalida={fechaSalida ?? null}
          noches={noches}
          cantidadHuespedes={huespedes}
          precioTotal={total}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-[#6B6560]">
        <Shield className="h-4 w-4 shrink-0" />
        <span>Pago seguro con verificación manual</span>
      </div>
    </div>
  )
}
