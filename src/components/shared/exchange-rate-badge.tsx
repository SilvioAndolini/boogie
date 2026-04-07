'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface CotizacionEuro {
  tasa: number
  fuente: string
}

export function ExchangeRateBadge() {
  const [cotizacion, setCotizacion] = useState<CotizacionEuro | null>(null)

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then((res) => res.json())
      .then((data) => {
        if (data.tasa) setCotizacion({ tasa: data.tasa, fuente: data.fuente })
      })
      .catch(() => {})
  }, [])

  return (
    <div className="hidden items-center gap-1 rounded-full border border-[#D8F3DC] bg-[#D8F3DC]/40 px-2.5 py-1 text-[11px] text-[#1B4332] sm:flex">
      <TrendingUp className="h-3 w-3 text-[#2D6A4F]" />
      <span className="font-medium">1 EUR</span>
      <span className="text-[#6B6560]">=</span>
      {cotizacion ? (
        <>
          <span className="font-semibold">
            Bs.{' '}
            {cotizacion.tasa.toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[#6B6560]">({cotizacion.fuente})</span>
        </>
      ) : (
        <span className="animate-pulse text-[#6B6560]">cargando...</span>
      )}
    </div>
  )
}
