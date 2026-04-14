'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, MapPin, BedDouble, Bath, DoorOpen, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const TIPO_LABELS: Record<string, string> = {
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

function formatearPrecio(precio: number | undefined | null, moneda: string): string {
  const p = precio ?? 0
  if (moneda === 'USD') return `$${p.toLocaleString('en-US')}`
  return `Bs. ${p.toLocaleString('es-VE')}`
}

interface PropiedadPreview {
  id: string
  titulo: string
  tipoPropiedad: string
  precioPorNoche: number
  moneda: string
  ciudad: string
  estado: string
  slug: string
  habitaciones: number
  camas: number
  banos: number
  imagenes: string[]
  ratingPromedio: number
  totalResenas: number
  planPropietario?: string
}

function PropertyPreviewCard({ propiedad }: { propiedad: PropiedadPreview }) {
  const imagenUrl = propiedad.imagenes?.[0]
  const isUltra = propiedad.planPropietario === 'ULTRA'

  return (
    <Link href={`/propiedades/${propiedad.id}`} className="group block shrink-0 w-[260px] sm:w-[280px] lg:w-[300px]">
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
              alt={propiedad.titulo}
              fill
              sizes="300px"
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
            {propiedad.ratingPromedio > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-md">
                <Star className="h-3 w-3 fill-[#F4A261] text-[#F4A261]" />
                <span className="text-[11px] font-semibold text-[#1A1A1A]">{propiedad.ratingPromedio.toFixed(1)}</span>
                {propiedad.totalResenas > 0 && (
                  <span className="text-[10px] text-[#6B6560]">({propiedad.totalResenas})</span>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/80 text-[#6B6560] backdrop-blur-md shadow-sm transition-all hover:bg-white hover:text-[#1B4332] hover:shadow-md"
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            aria-label="Agregar a favoritos"
          >
            <Heart className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="border-0 bg-white/85 px-3 py-0.5 text-[11px] font-medium text-[#1A1A1A] shadow-sm backdrop-blur-md"
            >
              {TIPO_LABELS[propiedad.tipoPropiedad] || propiedad.tipoPropiedad}
            </Badge>
          </div>
        </div>

        <div className="pt-3 pb-1">
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight text-[#1A1A1A] transition-colors duration-300 group-hover:text-[#1B4332]">
            {propiedad.titulo}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[#6B6560]">
            <MapPin className="h-3 w-3 shrink-0 text-[#52B788]" />
            <span className="line-clamp-1 text-xs">{propiedad.ciudad}, {propiedad.estado}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[#6B6560]">
            <div className="flex items-center gap-1">
              <DoorOpen className="h-3.5 w-3.5 text-[#9E9892]" />
              <span className="text-xs">{propiedad.habitaciones} hab.</span>
            </div>
            <div className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-[#9E9892]" />
              <span className="text-xs">{propiedad.camas} cama{propiedad.camas !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-[#9E9892]" />
              <span className="text-xs">{propiedad.banos} baño{propiedad.banos !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-0.5">
            <span className="text-lg font-bold tracking-tight text-[#1B4332]">
              {formatearPrecio(propiedad.precioPorNoche, propiedad.moneda)}
            </span>
            <span className="text-xs font-normal text-[#6B6560]">/ noche</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

function PlaceholderCard() {
  return (
    <div className="shrink-0 w-[260px] sm:w-[280px] lg:w-[300px]">
      <div className="rounded-2xl border border-dashed border-[#D0CBC4] bg-white p-3.5">
        <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-b from-[#F0EDE8]/50 to-[#F8F6F3]/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]/30">
            <span className="text-2xl font-light text-[#1B4332]/20">B</span>
          </div>
        </div>
        <div className="pt-3 pb-1 space-y-2.5">
          <div className="h-3.5 w-3/4 rounded-full bg-[#E8E4DF]" />
          <div className="h-3 w-1/2 rounded-full bg-[#E8E4DF]/60" />
          <div className="flex gap-3">
            <div className="h-2.5 w-12 rounded-full bg-[#E8E4DF]/40" />
            <div className="h-2.5 w-12 rounded-full bg-[#E8E4DF]/40" />
            <div className="h-2.5 w-12 rounded-full bg-[#E8E4DF]/40" />
          </div>
          <div className="h-4 w-1/3 rounded-full bg-[#D8F3DC]/40" />
        </div>
      </div>
    </div>
  )
}

export interface PreviewRowProps {
  titulo: string
  subtitulo?: string | null
  propiedades: PropiedadPreview[]
  maxItems?: number
}

export function PreviewRow({ titulo, subtitulo, propiedades, maxItems = 10 }: PreviewRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
      return () => {
        el.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
      }
    }
  }, [propiedades])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector('a, div.shrink-0')?.clientWidth || 300
    el.scrollBy({ left: direction === 'right' ? cardWidth * 2 : -cardWidth * 2, behavior: 'smooth' })
  }

  const items = propiedades.slice(0, maxItems)
  const placeholders = Math.max(0, maxItems - items.length)

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4 }}
        className="mb-4"
      >
        <h3 className="text-xl font-bold text-[#1A1A1A]">{titulo}</h3>
        {subtitulo && <p className="mt-0.5 text-sm text-[#6B6560]">{subtitulo}</p>}
      </motion.div>

      <div className="group/row relative">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute -left-1 top-0 bottom-2 z-10 w-20 bg-gradient-to-r from-[#ffffff] via-[#ffffff] to-transparent"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {canScrollRight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute -right-1 top-0 bottom-2 z-10 w-20 bg-gradient-to-l from-[#ffffff] via-[#ffffff] to-transparent"
            />
          )}
        </AnimatePresence>
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth scrollbar-none pb-2 -mx-1 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((p) => (
            <div key={p.id} className="snap-start">
              <PropertyPreviewCard propiedad={p} />
            </div>
          ))}
          {Array.from({ length: placeholders }).map((_, i) => (
            <PlaceholderCard key={`ph-${i}`} />
          ))}
        </div>

        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DF] bg-white/90 text-[#6B6560] shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-[#1B4332] hover:border-[#1B4332] opacity-0 group-hover/row:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E4DF] bg-white/90 text-[#6B6560] shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-[#1B4332] hover:border-[#1B4332] opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
