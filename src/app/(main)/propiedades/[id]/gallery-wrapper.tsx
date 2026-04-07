'use client'

import { useState } from 'react'
import { PropertyGallery } from '@/components/propiedades/property-gallery'
import { PropertyLightbox } from '@/components/propiedades/property-lightbox'

interface ImagenPropiedad {
  id: string
  url: string
  alt: string | null
  orden: number
  es_principal: boolean
}

export function PropertyGalleryWrapper({ imagenes }: { imagenes: ImagenPropiedad[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  return (
    <>
      <PropertyGallery
        imagenes={imagenes}
        onOpenLightbox={(index) => {
          setLightboxIndex(index)
          setLightboxOpen(true)
        }}
      />
      <PropertyLightbox
        imagenes={imagenes}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
