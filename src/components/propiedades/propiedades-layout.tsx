'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  totalPaginas: number
  paginaActual: number
  centerLat?: number
  centerLng?: number
  locationName?: string
}

export function PropiedadesLayout({
  propiedades,
  propiedadesMapa,
  total,
  totalPaginas,
  paginaActual,
  centerLat,
  centerLng,
}: PropiedadesLayoutProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', String(page))
    router.push(`/propiedades?${params.toString()}`)
  }

  const PaginationBar = () => {
    if (totalPaginas <= 1) return null
    return (
      <div className="flex items-center justify-center gap-2 border-t border-[#E8E4DF] bg-white py-3 shrink-0">
        <button
          onClick={() => goToPage(paginaActual - 1)}
          disabled={paginaActual <= 1}
          className="h-9 rounded-lg border border-[#E8E4DF] px-3 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] disabled:opacity-30"
        >
          Anterior
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
              p === paginaActual ? 'bg-[#1B4332] text-white' : 'border border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => goToPage(paginaActual + 1)}
          disabled={paginaActual >= totalPaginas}
          className="h-9 rounded-lg border border-[#E8E4DF] px-3 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3] disabled:opacity-30"
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
          <h1 className="text-base font-bold text-[#1A1A1A]">Boogies disponibles</h1>
          <span className="ml-2 text-sm text-[#6B6560]">{total} Boogie{total !== 1 ? 's' : ''}</span>
          {totalPaginas > 1 && (
            <span className="ml-auto text-xs text-[#9E9892]">Página {paginaActual} de {totalPaginas}</span>
          )}
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col" style={{ width: '55%' }}>
            <div className="flex-1 overflow-y-auto bg-[#FEFCF9]">
              <div className="px-6 py-6">
                <PropertyGrid propiedades={propiedades} />
              </div>
            </div>
            <PaginationBar />
          </div>

          {propiedadesMapa.length > 0 && (
            <div className="shrink-0 px-[35px] py-5" style={{ width: '45%' }}>
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
          <h1 className="text-base font-bold text-[#1A1A1A]">Boogies disponibles</h1>
          <span className="ml-2 text-sm text-[#6B6560]">{total} Boogie{total !== 1 ? 's' : ''}</span>
        </div>

        <section className="px-4 py-6 sm:px-6">
          <PropertyGrid propiedades={propiedades} />
          <PaginationBar />
        </section>
      </div>

      <FilterModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  )
}