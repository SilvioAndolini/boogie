'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { PropertyGrid } from './property-grid'
import { PropertyMap } from './property-map'
import { FilterModal } from './filter-modal'
import type { PropiedadCard } from './property-card'
import type { PropiedadMapa } from './property-map'

const PAGE_SIZE = 18

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
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(propiedades.length / PAGE_SIZE)
  const paged = propiedades.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const PaginationControls = () => {
    if (totalPages <= 1) return null
    return (
      <div className="flex items-center justify-center gap-2 pb-6 pt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="h-9 rounded-lg border border-[#E8E4DF] px-3 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? 'bg-[#1B4332] text-white'
                : 'border border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="h-9 rounded-lg border border-[#E8E4DF] px-3 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden xl:flex xl:flex-col xl:h-[calc(100vh-105px)]">
        <div className="flex items-center border-b border-[#E8E4DF] bg-white px-6 py-3 shrink-0">
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
          <span className="ml-auto text-xs text-[#9E9892]">
            Página {page} de {totalPages || 1}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-w-0 overflow-y-auto bg-[#FEFCF9]" style={{ width: '55%' }}>
            <section className="px-6 py-6">
              <PropertyGrid propiedades={paged} />
              <PaginationControls />
            </section>
          </div>

          {propiedadesMapa.length > 0 && (
            <div className="sticky top-0 shrink-0 px-[35px] py-5 ml-auto" style={{ width: '40%', height: 'calc(100vh - 105px - 45px)' }}>
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
          <PropertyGrid propiedades={paged} />
          <PaginationControls />
        </section>
      </div>

      {/* Modal de filtros */}
      <FilterModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  )
}