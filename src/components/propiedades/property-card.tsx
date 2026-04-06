// Tarjeta de propiedad para el listado
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TipoPropiedad, Moneda } from '@/types'

// Interfaz de la propiedad que recibe la tarjeta
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

// Traducciones de tipos de propiedad
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

// Formatear precio según moneda
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
    <Link href={`/propiedades/${id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-[#E8E4DF] bg-white transition-shadow duration-300 hover:shadow-lg">
        {/* Área de imagen con aspect ratio 4:3 */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-[#F8F6F3]">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt={titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            /* Placeholder cuando no hay imagen */
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
              <span className="text-4xl font-bold text-[#1B4332]/20">B</span>
            </div>
          )}

          {/* Botón de favoritos */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2 z-10 rounded-full bg-white/80 text-[#6B6560] backdrop-blur-sm hover:bg-white hover:text-[#E76F51]"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            aria-label="Agregar a favoritos"
          >
            <Heart className="h-4 w-4" />
          </Button>

          {/* Badge de tipo de propiedad */}
          <div className="absolute bottom-2 left-2 z-10">
            <Badge variant="secondary" className="bg-white/90 text-xs font-medium text-[#1A1A1A] backdrop-blur-sm">
              {TIPO_LABELS[tipoPropiedad] ?? tipoPropiedad}
            </Badge>
          </div>
        </div>

        {/* Información de la propiedad */}
        <div className="p-3">
          {/* Calificación */}
          <div className="mb-1 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#F4A261] text-[#F4A261]" />
            <span className="text-sm font-semibold text-[#1A1A1A]">
              {ratingPromedio > 0 ? ratingPromedio.toFixed(1) : 'Sin calificación'}
            </span>
            {totalResenas > 0 && (
              <span className="text-sm text-[#6B6560]">({totalResenas})</span>
            )}
          </div>

          {/* Título */}
          <h3 className="line-clamp-1 text-sm font-semibold text-[#1A1A1A]">
            {titulo}
          </h3>

          {/* Ubicación */}
          <div className="mt-0.5 flex items-center gap-1 text-[#6B6560]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1 text-xs">
              {ciudad}, {estado}
            </span>
          </div>

          {/* Precio */}
          <div className="mt-2">
            <span className="text-sm font-bold text-[#1B4332]">
              {formatearPrecio(precioPorNoche, moneda)}
            </span>
            <span className="text-xs text-[#6B6560]"> / noche</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
