'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Handshake, CheckCircle2, XCircle, Clock, Loader2, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { getOfertasRecibidas, responderOferta } from '@/actions/oferta.actions'

interface OfertaRecibida {
  id: string
  codigo: string
  estado: string
  precio_ofertado: number
  precio_original: number
  moneda: string
  fecha_entrada: string
  fecha_salida: string
  noches: number
  cantidad_huespedes: number
  mensaje: string | null
  fecha_creacion: string
  fecha_expiracion: string | null
  propiedad: {
    id: string
    titulo: string
    imagenes: { url: string; es_principal: boolean }[]
  }
  huesped: {
    id: string
    nombre: string
    apellido: string
    email: string
    avatar_url: string | null
    verificado: boolean
  }
}

export default function OfertasRecibidasPage() {
  const [ofertas, setOfertas] = useState<OfertaRecibida[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    getOfertasRecibidas().then((res) => {
      if (cancelled) return
      if (res.error) toast.error(res.error)
      else if (res.ofertas) setOfertas(res.ofertas as unknown as OfertaRecibida[])
      setCargando(false)
    })
    return () => { cancelled = true }
  }, [])

  const handleResponder = async (ofertaId: string, accion: 'ACEPTADA' | 'RECHAZADA') => {
    setProcesando(ofertaId)
    const fd = new FormData()
    fd.append('ofertaId', ofertaId)
    fd.append('accion', accion)
    if (accion === 'RECHAZADA') {
      fd.append('motivoRechazo', motivoRechazo[ofertaId] || 'No aceptamos esta oferta')
    }

    const res = await responderOferta(fd)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(accion === 'ACEPTADA' ? 'Oferta aceptada. El huesped tiene 2 horas para pagar.' : 'Oferta rechazada')
      const updated = await getOfertasRecibidas()
      if (updated.ofertas) setOfertas(updated.ofertas as unknown as OfertaRecibida[])
    }
    setProcesando(null)
  }

  const monedaSymbol = (m: string) => m === 'USD' ? '$' : 'Bs.'

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Handshake className="h-5 w-5 text-[#B8860B]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Negocia tu Boogie</h1>
          <p className="text-sm text-[#6B6560]">
            {ofertas.length} oferta{ofertas.length !== 1 ? 's' : ''} pendiente{ofertas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {ofertas.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Handshake className="mb-3 h-10 w-10 text-[#9E9892]" />
          <p className="text-sm text-[#6B6560]">No hay ofertas pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ofertas.map((oferta) => {
            const img = oferta.propiedad?.imagenes?.find((i: { es_principal: boolean }) => i.es_principal)?.url || oferta.propiedad?.imagenes?.[0]?.url
            const descuento = oferta.precio_original > 0
              ? ((1 - oferta.precio_ofertado / oferta.precio_original) * 100).toFixed(0)
              : '0'
            const expiracion = oferta.fecha_expiracion ? new Date(oferta.fecha_expiracion) : null
            const expirada = expiracion ? expiracion < new Date() : false

            return (
              <motion.div
                key={oferta.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#E8E4DF] bg-white overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F8F6F3]">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#9E9892]">B</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1A1A1A]">{oferta.propiedad?.titulo}</p>
                    <p className="text-xs text-[#6B6560]">
                      {oferta.huesped?.nombre} {oferta.huesped?.apellido}
                      {oferta.huesped?.verificado && <CheckCircle2 className="ml-1 inline h-3 w-3 text-[#1B4332]" />}
                    </p>
                    <p className="text-xs text-[#9E9892]">
                      {new Date(oferta.fecha_entrada).toLocaleDateString('es-VE')} → {new Date(oferta.fecha_salida).toLocaleDateString('es-VE')}
                      {' · '}{oferta.noches} noche{oferta.noches !== 1 ? 's' : ''}
                      {' · '}{oferta.cantidad_huespedes} huesped{oferta.cantidad_huespedes !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#9E9892] line-through">
                      {monedaSymbol(oferta.moneda)}{oferta.precio_original?.toFixed(2)}
                    </p>
                    <p className="text-lg font-bold text-[#D4A017]">
                      {monedaSymbol(oferta.moneda)}{oferta.precio_ofertado?.toFixed(2)}
                    </p>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      -{descuento}%
                    </span>
                  </div>
                </div>

                {oferta.mensaje && (
                  <div className="border-t border-[#E8E4DF] px-4 py-2 text-xs text-[#6B6560] bg-[#FDFCFA]">
                    &ldquo;{oferta.mensaje}&rdquo;
                  </div>
                )}

                {oferta.estado === 'ACEPTADA' && !expirada && (
                  <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
                    <Clock className="h-3 w-3" />
                    Aceptada. El huesped debe pagar antes del {expiracion?.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}

                {oferta.estado === 'ACEPTADA' && expirada && (
                  <div className="border-t border-[#C1121F]/20 bg-[#FEE2E2] px-4 py-2 text-xs text-[#C1121F]">
                    La oferta expiro sin pago
                  </div>
                )}

                {oferta.estado === 'PENDIENTE' && (
                  <div className="flex items-center gap-2 border-t border-[#E8E4DF] px-4 py-3">
                    <Textarea
                      placeholder="Motivo de rechazo (opcional)..."
                      value={motivoRechazo[oferta.id] || ''}
                      onChange={(e) => setMotivoRechazo((prev) => ({ ...prev, [oferta.id]: e.target.value }))}
                      rows={1}
                      className="flex-1 border-[#E8E4DF] text-xs"
                    />
                    <Button
                      onClick={() => handleResponder(oferta.id, 'ACEPTADA')}
                      disabled={procesando === oferta.id}
                      className="bg-[#1B4332] text-white hover:bg-[#2D6A4F] text-xs"
                    >
                      {procesando === oferta.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="mr-1 h-3 w-3" /> Aceptar</>}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleResponder(oferta.id, 'RECHAZADA')}
                      disabled={procesando === oferta.id}
                      className="border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2] text-xs"
                    >
                      <XCircle className="mr-1 h-3 w-3" /> Rechazar
                    </Button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
