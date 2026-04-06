'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Camera, ChevronRight } from 'lucide-react'

interface ImagenPropiedad {
  id: string
  url: string
  alt: string | null
  orden: number
  esPrincipal: boolean
}

interface PropertyGalleryProps {
  imagenes: ImagenPropiedad[]
  onOpenLightbox: (index: number) => void
}

export function PropertyGallery({ imagenes, onOpenLightbox }: PropertyGalleryProps) {
  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
        <div className="flex h-full w-full items-center justify-center">
          <Camera className="h-12 w-12 text-[#1B4332]/20" />
        </div>
      </div>
    )
  }

  const sorted = [...imagenes].sort((a, b) => a.orden - b.orden)
  const principal = sorted.find((img) => img.esPrincipal) ?? sorted[0]
  const secundarias = sorted.filter((img) => img.id !== principal.id)
  const desktopCells = secundarias.slice(0, 4)
  const extraCount = imagenes.length - 5

  return (
    <div className="relative w-full">
      {/* Mobile: single hero image */}
      <div className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl md:hidden">
        <Image
          src={principal.url}
          alt={principal.alt ?? 'Imagen principal'}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-3 right-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-[#E8E4DF] bg-white/90 text-sm font-medium text-[#1A1A1A] shadow-sm backdrop-blur-sm hover:bg-white"
            onClick={() => onOpenLightbox(0)}
          >
            <Camera className="h-4 w-4" />
            Mostrar todas las fotos
          </Button>
        </div>
      </div>

      {/* Desktop: collage grid */}
      <div className="hidden w-full grid-cols-5 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid">
        {/* Main image - left column, spans both rows */}
        <button
          type="button"
          className="group relative col-span-3 row-span-2 cursor-pointer"
          onClick={() => onOpenLightbox(0)}
        >
          <Image
            src={principal.url}
            alt={principal.alt ?? 'Imagen principal'}
            fill
            sizes="(max-width: 1024px) 60vw, 60vw"
            className="rounded-l-xl object-cover transition-all group-hover:brightness-95"
            priority
          />
        </button>

        {/* Right column: up to 4 secondary images */}
        {desktopCells.map((img, i) => {
          const isTopRight = i === 1
          const isBottomRight = i === 3 || (desktopCells.length < 4 && i === desktopCells.length - 1)
          const isLastCell = i === desktopCells.length - 1 && extraCount > 0

          let rounded = ''
          if (isTopRight) rounded = 'rounded-tr-xl'
          if (isBottomRight) rounded = 'rounded-br-xl'

          return (
            <button
              key={img.id}
              type="button"
              className={`group relative col-span-2 cursor-pointer ${rounded}`}
              onClick={() => onOpenLightbox(i + 1)}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `Imagen ${i + 2}`}
                fill
                sizes="40vw"
                className={`${rounded} object-cover transition-all group-hover:brightness-95`}
              />
              {/* Overlay for extra photos count */}
              {isLastCell && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all group-hover:bg-black/50">
                  <span className="text-lg font-semibold text-white">
                    +{extraCount} fotos
                  </span>
                </div>
              )}
            </button>
          )
        })}

        {/* Fill empty cells with placeholder if fewer than 4 secondary images */}
        {Array.from({ length: Math.max(0, 4 - desktopCells.length) }).map((_, i) => (
          <div
            key={`placeholder-${i}`}
            className="relative col-span-2 bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]"
          />
        ))}
      </div>

      {/* Desktop floating button */}
      <div className="absolute bottom-3 right-3 hidden md:block">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-[#E8E4DF] bg-white/90 text-sm font-medium text-[#1A1A1A] shadow-sm backdrop-blur-sm hover:bg-white"
          onClick={() => onOpenLightbox(0)}
        >
          <Camera className="h-4 w-4" />
          Mostrar todas las fotos
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
