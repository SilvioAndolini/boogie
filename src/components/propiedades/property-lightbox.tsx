'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImagenPropiedad {
  id: string
  url: string
  alt: string | null
  orden: number
  es_principal: boolean
}

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

  // Sync with initialIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Lock body scroll when open
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

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1))
  }, [imagenes.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1))
  }, [imagenes.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || imagenes.length <= 1) return

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
  }, [isOpen, imagenes.length, onClose, goToPrev, goToNext])

  // Don't render if no images or not open
  if (!imagenes.length) return null

  const currentImage = imagenes[currentIndex]
  const hasMultiple = imagenes.length > 1

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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90" onClick={onClose} />

          {/* Close button - top left */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image counter - top center */}
          <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            {currentIndex + 1} / {imagenes.length}
          </div>

          {/* Previous button */}
          {hasMultiple && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Main image */}
          <div className="relative flex flex-1 items-center justify-center p-4">
            <Image
              src={currentImage.url}
              alt={currentImage.alt || 'Imagen de propiedad'}
              className="max-h-[calc(100vh-160px)] w-auto object-contain"
              width={1200}
              height={800}
              sizes="100vw"
              priority
            />
          </div>

          {/* Next button */}
          {hasMultiple && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Thumbnail strip */}
          {hasMultiple && (
            <div className="relative z-10 flex justify-center pb-4">
              <div className="flex gap-2 overflow-x-auto px-4 py-2">
                {imagenes.map((imagen, index) => (
                  <button
                    key={imagen.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 overflow-hidden rounded-md transition-opacity ${
                      index === currentIndex
                        ? 'ring-2 ring-white opacity-100'
                        : 'opacity-60 hover:opacity-80'
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={imagen.url}
                      alt={imagen.alt || `Miniatura ${index + 1}`}
                      className="h-[60px] w-[80px] object-cover"
                      width={80}
                      height={60}
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
