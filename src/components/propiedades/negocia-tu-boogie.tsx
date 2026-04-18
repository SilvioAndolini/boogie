'use client'

import { useState, useEffect, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Handshake, X, Loader2, Info, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { crearOferta } from '@/actions/oferta.actions'

interface NegociaTuBoogieProps {
  propiedadId: string
  precioPorNoche: number
  moneda: string
  fechaEntrada: Date | null
  fechaSalida: Date | null
  noches: number
  cantidadHuespedes: number
  precioTotal: number
}

export function NegociaTuBoogie({
  propiedadId,
  precioPorNoche,
  moneda,
  fechaEntrada,
  fechaSalida,
  noches,
  cantidadHuespedes,
  precioTotal,
}: NegociaTuBoogieProps) {
  const [abierto, setAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [precioOfertado, setPrecioOfertado] = useState('')
  const [mensaje, setMensaje] = useState('')

  const monedaSymbol = moneda === 'USD' ? '$' : 'Bs.'
  const minOferta = Math.round(precioTotal * 0.3 * 100) / 100
  const ofertaNum = parseFloat(precioOfertado) || 0
  const descuento = precioTotal > 0 ? ((1 - ofertaNum / precioTotal) * 100).toFixed(0) : '0'
  const puedeEnviar = ofertaNum >= minOferta && ofertaNum <= precioTotal * 1.1

  const handleSubmit = async () => {
    if (!fechaEntrada || !fechaSalida || !puedeEnviar) return
    setEnviando(true)

    const fd = new FormData()
    fd.append('propiedadId', propiedadId)
    fd.append('fechaEntrada', fechaEntrada.toISOString())
    fd.append('fechaSalida', fechaSalida.toISOString())
    fd.append('cantidadHuespedes', String(cantidadHuespedes))
    fd.append('precioOfertado', precioOfertado)
    fd.append('moneda', moneda)
    if (mensaje) fd.append('mensaje', mensaje)

    const res = await crearOferta(fd)
    setEnviando(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Oferta enviada. El anfitrión tiene que aceptarla.')
      setAbierto(false)
      setPrecioOfertado('')
      setMensaje('')
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const modal = (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setAbierto(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <button
              onClick={() => setAbierto(false)}
              className="absolute right-4 top-4 text-[#9E9892] hover:text-[#1A1A1A]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D8F3DC]">
                <Handshake className="h-4 w-4 text-[#1B4332]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">Negocia tu Boogie</h3>
            </div>

            {!fechaEntrada || !fechaSalida ? (
              <div className="flex items-center gap-2 rounded-lg bg-[#F8F6F3] p-4 text-sm text-[#6B6560]">
                <Info className="h-4 w-4 shrink-0" />
                Selecciona las fechas de tu estadia primero
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-[#F8F6F3] p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B6560]">Precio original</span>
                    <span className="font-semibold text-[#1A1A1A]">{monedaSymbol}{precioTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[#6B6560]">{noches} noche{noches !== 1 ? 's' : ''} x {cantidadHuespedes} huesped{cantidadHuespedes !== 1 ? 'es' : ''}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B6560]">
                    Tu oferta ({monedaSymbol})
                  </label>
                  <input
                    type="number"
                    min={minOferta}
                    max={precioTotal * 1.1}
                    step="0.01"
                    value={precioOfertado}
                    onChange={(e) => setPrecioOfertado(e.target.value)}
                    placeholder={minOferta.toFixed(2)}
                    className="h-10 w-full rounded-lg border border-[#E8E4DF] bg-white px-3 text-sm font-semibold text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]/30"
                  />
                  {ofertaNum > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {puedeEnviar ? (
                        <CheckCircle2 className="h-3 w-3 text-[#1B4332]" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-[#C1121F]" />
                      )}
                      <span className={puedeEnviar ? 'text-[#1B4332]' : 'text-[#C1121F]'}>
                        {puedeEnviar
                          ? `${descuento}% de descuento sobre el precio original`
                          : `Min. ${monedaSymbol}${minOferta.toFixed(2)} - Max. ${monedaSymbol}${(precioTotal * 1.1).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#6B6560]">
                    Mensaje para el anfitrion (opcional)
                  </label>
                  <Textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Explica por que tu oferta es justa..."
                    maxLength={500}
                    rows={2}
                    className="border-[#E8E4DF] text-sm"
                  />
                </div>

                <div className="rounded-lg border border-[#1B4332]/20 bg-[#D8F3DC] p-3 text-xs text-[#1B4332]">
                  Si el anfitrion acepta, tendras <strong>2 horas</strong> para completar el pago.
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!puedeEnviar || enviando}
                  className="w-full bg-[#1B4332] text-white hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  {enviando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Handshake className="mr-2 h-4 w-4" />
                  )}
                  Enviar oferta
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1B4332]/30 bg-[#D8F3DC] px-4 py-3 text-sm font-semibold text-[#1B4332] transition-all hover:border-[#1B4332] hover:shadow-md"
      >
        <Handshake className="h-4 w-4 transition-transform group-hover:scale-110" />
        Negocia tu Boogie
      </button>
      {mounted && createPortal(modal, document.body)}
    </>
  )
}
