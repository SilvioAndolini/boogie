'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ChevronLeft, ChevronRight, BedDouble, Bath, CookingPot,
  Sofa, TreePine, Waves, Mountain, HelpCircle, Camera,
} from 'lucide-react'

interface ImagenPropiedad {
  id: string
  url: string
  alt: string | null
  orden: number
  es_principal: boolean
  categoria: string
}

const CATEGORIA_META: Record<string, { label: string; icon: typeof BedDouble; accent: string }> = {
  habitaciones: { label: 'Habitaciones', icon: BedDouble, accent: 'from-blue-500/20 to-blue-600/5' },
  banos: { label: 'Baños', icon: Bath, accent: 'from-cyan-500/20 to-cyan-600/5' },
  cocina: { label: 'Cocina', icon: CookingPot, accent: 'from-amber-500/20 to-amber-600/5' },
  areas_comunes: { label: 'Áreas comunes', icon: Sofa, accent: 'from-purple-500/20 to-purple-600/5' },
  exterior: { label: 'Exterior', icon: TreePine, accent: 'from-green-500/20 to-green-600/5' },
  piscina: { label: 'Piscina / Deportes', icon: Waves, accent: 'from-sky-500/20 to-sky-600/5' },
  vistas: { label: 'Vistas', icon: Mountain, accent: 'from-rose-500/20 to-rose-600/5' },
  otro: { label: 'Otras fotos', icon: HelpCircle, accent: 'from-gray-400/20 to-gray-500/5' },
}

const BASE_ORDER = ['habitaciones', 'banos', 'cocina', 'areas_comunes', 'exterior', 'piscina', 'vistas']

function getMeta(cat: string) {
  if (cat.startsWith('personalizada:')) {
    return { label: cat.slice(14), icon: HelpCircle, accent: 'from-orange-500/20 to-orange-600/5' }
  }
  return CATEGORIA_META[cat] || { label: cat, icon: HelpCircle, accent: 'from-gray-400/20 to-gray-500/5' }
}

interface PropertyLightboxProps {
  imagenes: ImagenPropiedad[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

type View = 'gallery' | 'viewer'

export function PropertyLightbox({
  imagenes,
  initialIndex,
  isOpen,
  onClose,
}: PropertyLightboxProps) {
  const [view, setView] = useState<View>('gallery')
  const [viewerCategory, setViewerCategory] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)

  const sorted = useMemo(() => [...imagenes].sort((a, b) => a.orden - b.orden), [imagenes])

  const groups = useMemo(() => {
    const map = new Map<string, ImagenPropiedad[]>()
    for (const img of sorted) {
      const cat = img.categoria || 'otro'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(img)
    }
    const ordered: [string, ImagenPropiedad[]][] = []
    for (const c of BASE_ORDER) {
      if (map.has(c)) ordered.push([c, map.get(c)!])
    }
    if (map.has('otro')) ordered.push(['otro', map.get('otro')!])
    const customKeys = Array.from(map.keys()).filter((k) => k.startsWith('personalizada:')).sort()
    for (const k of customKeys) ordered.push([k, map.get(k)!])
    return ordered
  }, [sorted])

  const viewerImages = useMemo(() => {
    if (!viewerCategory) return sorted
    return sorted.filter((img) => (img.categoria || 'otro') === viewerCategory)
  }, [sorted, viewerCategory])

  useEffect(() => {
    if (isOpen) {
      const targetImg = sorted[initialIndex]
      if (targetImg && groups.length === 1) {
        setView('viewer')
        setViewerCategory(null)
        setViewerIndex(initialIndex)
      } else {
        setView('gallery')
        setViewerCategory(null)
        setViewerIndex(0)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const openViewer = useCallback((category: string, imgIndex: number) => {
    setViewerCategory(category)
    setViewerIndex(imgIndex)
    setView('viewer')
  }, [])

  const goToPrev = useCallback(() => {
    setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))
  }, [viewerImages.length])

  const goToNext = useCallback(() => {
    setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))
  }, [viewerImages.length])

  useEffect(() => {
    if (!isOpen || view !== 'viewer') return

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          if (groups.length > 1) { setView('gallery') } else { onClose() }
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
  }, [isOpen, view, groups.length, onClose, goToPrev, goToNext])

  if (!imagenes.length) return null

  const currentImage = viewerImages[viewerIndex]
  const hasMultiple = viewerImages.length > 1
  const totalPhotos = sorted.length

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
        >
          <div className="absolute inset-0 bg-[#0F1A14]/95 backdrop-blur-md" onClick={onClose} />

          {/* ===== HEADER ===== */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-6">
            <button
              onClick={view === 'viewer' && groups.length > 1 ? () => setView('gallery') : onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label={view === 'viewer' ? 'Volver a galería' : 'Cerrar'}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-white/40" />
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                {view === 'viewer' ? `${viewerIndex + 1} / ${viewerImages.length}` : `${totalPhotos} fotos`}
              </span>
            </div>

            <div className="w-10" />
          </div>

          {/* ===== GALLERY VIEW ===== */}
          {view === 'gallery' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="relative z-10 flex-1 overflow-y-auto px-4 pb-6 sm:px-6"
            >
              <div className="mx-auto max-w-4xl space-y-5">
                {groups.map(([catKey, imgs]) => {
                  const meta = getMeta(catKey)
                  const CatIcon = meta.icon
                  return (
                    <div key={catKey}>
                      <div className="mb-2.5 flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent} ring-1 ring-white/10`}>
                          <CatIcon className="h-4 w-4 text-white/80" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white/90">{meta.label}</h3>
                          <p className="text-[10px] text-white/40">{imgs.length} {imgs.length === 1 ? 'foto' : 'fotos'}</p>
                        </div>
                      </div>
                      <div className={`grid gap-2 ${
                        imgs.length === 1 ? 'grid-cols-1' :
                        imgs.length === 2 ? 'grid-cols-2' :
                        imgs.length === 3 ? 'grid-cols-3' :
                        'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      }`}>
                        {imgs.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => openViewer(catKey, idx)}
                            className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/10 transition-all hover:ring-white/25"
                          >
                            <Image
                              src={img.url}
                              alt={img.alt || meta.label}
                              fill
                              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ===== VIEWER (single image) ===== */}
          {view === 'viewer' && (
            <>
              {hasMultiple && (
                <button
                  onClick={goToPrev}
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <motion.div
                key={currentImage?.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex flex-1 items-center justify-center p-4"
              >
                {currentImage && (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || 'Imagen de propiedad'}
                    className="max-h-[calc(100vh-180px)] w-auto rounded-xl object-contain shadow-2xl"
                    width={1200}
                    height={800}
                    sizes="100vw"
                    priority
                  />
                )}
              </motion.div>

              {hasMultiple && (
                <button
                  onClick={goToNext}
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {hasMultiple && (
                <div className="relative z-10 flex justify-center pb-4">
                  <div className="flex gap-1.5 overflow-x-auto px-4 py-2" style={{ scrollbarWidth: 'none' }}>
                    {viewerImages.map((imagen, index) => (
                      <button
                        key={imagen.id}
                        onClick={() => setViewerIndex(index)}
                        className={`flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                          index === viewerIndex
                            ? 'ring-2 ring-white opacity-100 scale-110'
                            : 'opacity-30 hover:opacity-60'
                        }`}
                        aria-label={`Ver imagen ${index + 1}`}
                      >
                        <Image
                          src={imagen.url}
                          alt={imagen.alt || `Miniatura ${index + 1}`}
                          className="h-[48px] w-[64px] object-cover"
                          width={64}
                          height={48}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {viewerCategory && groups.length > 1 && (
                <div className="relative z-10 flex justify-center pb-3">
                  <button
                    onClick={() => setView('gallery')}
                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/60 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white/80"
                  >
                    ← Ver todas las secciones
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
