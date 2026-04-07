'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TipoPropiedad, Moneda } from '@/types'

export interface PropiedadCard {
  id: string
  titulo: string
  tipoPropiedad: TipoPropiedad
  precioPorNoche: number
  moneda: Moneda
  ciudad: string
  estado: string
  ratingPromedio: number
  totalResenas: number
  imagenes: string[]
}

const TIPO_LABELS: Record<TipoPropiedad, string> = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  VILLA: 'Villa',
  CABANA: 'Cabaña',
  ESTUDIO: 'Estudio',
  HABITACION: 'Habitación',
  LOFT: 'Loft',
  PENTHOUSE: 'Penthouse',
  FINCA: 'Finca',
  OTRO: 'Otro',
}

function formatearPrecio(precio: number, moneda: Moneda): string {
  if (moneda === 'USD') {
    return `$${precio.toLocaleString('en-US')}`
  }
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export function PropertyCard({ propiedad }: { propiedad: PropiedadCard }) {
  const {
    id,
    titulo,
    tipoPropiedad,
    precioPorNoche,
    moneda,
    ciudad,
    estado,
    ratingPromedio,
    totalResenas,
    imagenes,
  } = propiedad

  const imagenUrl = imagenes?.[0]

  return (
    <Link 
      href={`/propiedades/${id}`} 
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className="rounded-2xl border border-[#E8E4DF] bg-white p-2.5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#D0CBC4] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-[#F0EDE8] to-[#F8F6F3]">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt={titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D8F3DC]/60">
                <span className="text-xl font-light text-[#1B4332]/30">B</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute top-2.5 left-2.5 z-10">
            {ratingPromedio > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 backdrop-blur-md">
                <Star className="h-2.5 w-2.5 fill-[#F4A261] text-[#F4A261]" />
                <span className="text-[10px] font-semibold text-[#1A1A1A]">
                  {ratingPromedio.toFixed(1)}
                </span>
                {totalResenas > 0 && (
                  <span className="text-[9px] text-[#6B6560]">({totalResenas})</span>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/80 text-[#6B6560] backdrop-blur-md shadow-sm transition-all hover:bg-white hover:text-[#1B4332] hover:shadow-md"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            aria-label="Agregar a favoritos"
          >
            <Heart className="h-3.5 w-3.5" />
          </Button>

          <div className="absolute bottom-2.5 left-2.5 z-10">
            <Badge
              variant="secondary"
              className="border-0 bg-white/85 px-2.5 py-0.5 text-[10px] font-medium text-[#1A1A1A] shadow-sm backdrop-blur-md"
            >
              {TIPO_LABELS[tipoPropiedad] ?? tipoPropiedad}
            </Badge>
          </div>
        </div>

        <div className="pt-2.5 pb-1">
          <h3 className="line-clamp-1 text-[13px] font-semibold leading-tight text-[#1A1A1A] transition-colors duration-300 group-hover:text-[#1B4332]">
            {titulo}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-[#6B6560]">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-[#52B788]" />
            <span className="line-clamp-1 text-[11px]">
              {ciudad}, {estado}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-0.5">
            <span className="text-[13px] font-bold tracking-tight text-[#1B4332]">
              {formatearPrecio(precioPorNoche, moneda)}
            </span>
            <span className="text-[10px] font-normal text-[#6B6560]">/ noche</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
