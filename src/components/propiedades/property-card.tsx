'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, BedDouble, Bath, DoorOpen, Zap, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GoldStar, GoldStarSmall } from '@/components/ui/gold-star'
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
  habitaciones: number
  camas: number
  banos: number
  propietario?: { reputacion: number | null; plan_suscripcion: string } | null
  esExpress?: boolean
  categoria?: string
  tipoCancha?: string | null
  precioPorHora?: number | null
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

function formatearPrecio(precio: number | undefined | null, moneda: Moneda): string {
  const p = precio ?? 0
  if (moneda === 'USD') {
    return `$${p.toLocaleString('en-US')}`
  }
  return `Bs. ${p.toLocaleString('es-VE')}`
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
    habitaciones,
    camas,
    banos,
  } = propiedad

  const isUltra = propiedad.propietario?.plan_suscripcion === 'ULTRA'
  const isCancha = propiedad.categoria === 'DEPORTE'
  const isExpress = propiedad.esExpress
  const imagenUrl = imagenes?.[0]
  const linkBase = isCancha ? '/canchas' : '/propiedades'

  return (
    <Link 
      href={`${linkBase}/${id}`} 
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <article className={`
        relative overflow-hidden rounded-2xl border p-3.5 transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)]
        ${isUltra
          ? 'border-[#D4A843]/40 bg-gradient-to-br from-[#FFFDF5] via-[#FFF9E6] to-[#FFF3CC] hover:border-[#D4A843]/70'
          : 'border-[#E8E4DF] bg-white hover:border-[#D0CBC4]'
        }
        ${isUltra ? 'ultra-shine-card' : ''}
      `}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-b from-[#F0EDE8] to-[#F8F6F3]">
          {imagenUrl ? (
            <Image
              src={imagenUrl}
              alt={titulo}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]/60">
                <span className="text-2xl font-light text-[#1B4332]/30">B</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute top-3 left-3 z-10">
            {ratingPromedio > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-md">
                <GoldStarSmall size={12} />
                <span className="text-[11px] font-semibold text-[#1A1A1A]">
                  {ratingPromedio.toFixed(1)}
                </span>
                {totalResenas > 0 && (
                  <span className="text-[10px] text-[#6B6560]">({totalResenas})</span>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 text-[#6B6560] backdrop-blur-md shadow-sm transition-all hover:bg-white hover:text-[#1B4332] hover:shadow-md"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            aria-label="Agregar a favoritos"
          >
            <Heart className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            <Badge
              variant="secondary"
              className="border-0 bg-white/85 px-3 py-0.5 text-[11px] font-medium text-[#1A1A1A] shadow-sm backdrop-blur-md"
            >
              {TIPO_LABELS[tipoPropiedad] ?? tipoPropiedad}
            </Badge>
            {isCancha && (
              <Badge className="border-0 bg-[#1B4332] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Trophy className="mr-0.5 h-2.5 w-2.5" />
                Cancha
              </Badge>
            )}
          </div>

          {isExpress && !isCancha && (
            <div className="absolute bottom-3 right-3 z-10">
              <span className="flex items-center gap-1 rounded-full bg-[#F4A261] px-2.5 py-1 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
                <Zap className="h-3 w-3" />
                Express
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 pb-1">
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight text-[#1A1A1A] transition-colors duration-300 group-hover:text-[#1B4332]">
            {titulo}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[#6B6560]">
            <MapPin className="h-3 w-3 shrink-0 text-[#52B788]" />
            <span className="line-clamp-1 text-xs">
              {ciudad}, {estado}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[#6B6560]">
            <div className="flex items-center gap-1">
              <DoorOpen className="h-3.5 w-3.5 text-[#9E9892]" />
              <span className="text-xs">{habitaciones} hab.</span>
            </div>
            <div className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-[#9E9892]" />
              <span className="text-xs">{camas} cama{camas !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-[#9E9892]" />
              <span className="text-xs">{banos} baño{banos !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tracking-tight text-[#1B4332]">
                {isCancha && propiedad.precioPorHora != null
                  ? formatearPrecio(propiedad.precioPorHora, moneda)
                  : formatearPrecio(precioPorNoche, moneda)
                }
              </span>
              <span className="text-xs font-normal text-[#6B6560]">
                {isCancha ? '/ hora' : '/ noche'}
              </span>
            </div>
            {propiedad.propietario && (propiedad.propietario.reputacion ?? 0) > 0 && (
              <div className="ml-auto flex items-center gap-1.5 rounded-full bg-[#FDF8E8] px-2.5 py-1">
                <GoldStarSmall size={12} />
                <span className="text-xs font-bold text-[#1A1A1A] tabular-nums">
                  {propiedad.propietario.reputacion!.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
