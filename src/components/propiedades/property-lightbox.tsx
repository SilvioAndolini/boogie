'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImagenPropiedad {
  id: string
  url: string
  alt: string | null
  orden: number
  es_principal: boolean
  categoria: string
}

const CATEGORIA_LABELS: Record<string, string> = {
  habitaciones: 'Habitaciones',
  banos: 'Baños',
  cocina: 'Cocina',
  areas_comunes: 'Áreas comunes',
  exterior: 'Exterior',
  piscina: 'Piscina / Deportes',
  vistas: 'Vistas',
  otro: 'Otras fotos',
}

const CATEGORIA_ORDER = ['habitaciones', 'banos', 'cocina', 'areas_comunes', 'exterior', 'piscina', 'vistas', 'otro']

interface PropertyLightboxProps {
  imagenes: ImagenPropiedad[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export function PropertyLightbox({
  imagenes,
  initialIndex,
  isOpen,
  onClose,
}: PropertyLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const sorted = useMemo(() => [...imagenes].sort((a, b) => a.orden - b.orden), [imagenes])

  const groupedImages = useMemo(() => {
    if (!activeCategory) return sorted
    return sorted.filter((img) => img.categoria === activeCategory)
  }, [sorted, activeCategory])

  const availableCategories = useMemo(() => {
    const cats = new Set(sorted.map((img) => img.categoria || 'otro'))
    return CATEGORIA_ORDER.filter((c) => cats.has(c))
  }, [sorted])

  useEffect(() => {
    if (isOpen) {
      setActiveCategory(null)
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && activeCategory) {
      setCurrentIndex(0)
    }
  }, [activeCategory, isOpen])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? groupedImages.length - 1 : prev - 1))
  }, [groupedImages.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === groupedImages.length - 1 ? 0 : prev + 1))
  }, [groupedImages.length])

  useEffect(() => {
    if (!isOpen || groupedImages.length <= 1) return

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrev()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, groupedImages.length, onClose, goToPrev, goToNext])

  if (!imagenes.length) return null

  const currentImage = groupedImages[currentIndex]
  const hasMultiple = groupedImages.length > 1

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Visor de imágenes"
        >
          <div className="absolute inset-0 bg-black/90" onClick={onClose} />

          <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              {currentIndex + 1} / {groupedImages.length}
              {activeCategory && (
                <span className="ml-2 text-white/60">· {CATEGORIA_LABELS[activeCategory] || activeCategory}</span>
              )}
            </div>

            <div className="w-10" />
          </div>

          {availableCategories.length > 1 && (
            <div className="relative z-10 flex justify-center pb-2">
              <div className="flex gap-1.5 overflow-x-auto px-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                    !activeCategory
                      ? 'bg-white text-[#1A1A1A]'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  Todas ({sorted.length})
                </button>
                {availableCategories.map((cat) => {
                  const count = sorted.filter((img) => img.categoria === cat).length
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                        activeCategory === cat
                          ? 'bg-white text-[#1A1A1A]'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {CATEGORIA_LABELS[cat] || cat} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {hasMultiple && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <div className="relative z-10 flex flex-1 items-center justify-center p-4">
            {currentImage && (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || 'Imagen de propiedad'}
                className="max-h-[calc(100vh-200px)] w-auto rounded-lg object-contain"
                width={1200}
                height={800}
                sizes="100vw"
                priority
              />
            )}
          </div>

          {hasMultiple && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {hasMultiple && (
            <div className="relative z-10 flex justify-center pb-4">
              <div className="flex gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                {groupedImages.map((imagen, index) => (
                  <button
                    key={imagen.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-white opacity-100 scale-105'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <Image
                      src={imagen.url}
                      alt={imagen.alt || `Miniatura ${index + 1}`}
                      className="h-[52px] w-[72px] object-cover"
                      width={72}
                      height={52}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
