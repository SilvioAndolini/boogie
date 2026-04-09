'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'
import { PropertyGrid } from './property-grid'
import { PropertyMap } from './property-map'
import { FilterModal } from './filter-modal'
import type { PropiedadCard } from './property-card'
import type { PropiedadMapa } from './property-map'

interface PropiedadesLayoutProps {
  propiedades: PropiedadCard[]
  propiedadesMapa: PropiedadMapa[]
  total: number
  centerLat?: number
  centerLng?: number
  locationName?: string
}

export function PropiedadesLayout({
  propiedades,
  propiedadesMapa,
  total,
  centerLat,
  centerLng,
  locationName,
}: PropiedadesLayoutProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <div className="hidden xl:flex xl:flex-col">
        <div className="flex items-center border-b border-[#E8E4DF] bg-white px-6 py-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="mr-3 flex items-center gap-1.5 rounded-full border border-[#E8E4DF] px-3 py-1.5 text-[11px] font-medium text-[#6B6560] transition-colors hover:border-[#1B4332] hover:text-[#1B4332]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </button>
          <h1 className="text-base font-bold text-[#1A1A1A]">
            Boogies disponibles
          </h1>
          <span className="ml-2 text-sm text-[#6B6560]">
            {total} Boogie{total !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 overflow-y-auto bg-[#FEFCF9]" style={{ width: '55%' }}>
            <section className="px-6 py-6">
              <PropertyGrid propiedades={propiedades} />
            </section>
          </div>

          {propiedadesMapa.length > 0 && (
            <div className="h-[calc(100vh-105px-45px)] shrink-0 px-[35px] py-5 ml-auto" style={{ width: '40%' }}>
              <div className="h-full overflow-hidden rounded-2xl border border-[#E8E4DF]">
                <PropertyMap propiedades={propiedadesMapa} centerLat={centerLat} centerLng={centerLng} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile / Tablet */}
      <div className="block xl:hidden">
        <div className="flex items-center border-b border-[#E8E4DF] bg-white px-4 py-3 sm:px-6">
          <button
            onClick={() => setFiltersOpen(true)}
            className="mr-3 flex items-center gap-1.5 rounded-full border border-[#E8E4DF] px-3 py-1.5 text-[11px] font-medium text-[#6B6560] transition-colors hover:border-[#1B4332] hover:text-[#1B4332]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </button>
          <h1 className="text-base font-bold text-[#1A1A1A]">
            Boogies disponibles
          </h1>
          <span className="ml-2 text-sm text-[#6B6560]">
            {total} Boogie{total !== 1 ? 's' : ''}
          </span>
        </div>

        <section className="px-4 py-6 sm:px-6">
          <PropertyGrid propiedades={propiedades} />
        </section>
      </div>

      {/* Modal de filtros */}
      <FilterModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  )
}