// Barra de búsqueda principal para la página de inicio y propiedades
'use client'

import { Search, MapPin, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SearchBar() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-1 rounded-full border border-[#E8E4DF] bg-white px-2 py-1.5 shadow-md sm:gap-2 sm:px-3 sm:py-2">
        {/* Sección: ¿A dónde vas? */}
        <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F8F6F3]">
          <MapPin className="h-4 w-4 shrink-0 text-[#E76F51]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
              ¿A dónde vas?
            </span>
            <span className="text-sm text-[#1A1A1A]">
              Busca un destino
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="hidden h-8 w-px bg-[#E8E4DF] sm:block" />

        {/* Sección: Fechas */}
        <div className="hidden flex-1 items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F8F6F3] sm:flex">
          <Calendar className="h-4 w-4 shrink-0 text-[#E76F51]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
              Fechas
            </span>
            <span className="text-sm text-[#1A1A1A]">
              Cuándo viajas
            </span>
          </div>
        </div>

        {/* Separador */}
        <div className="hidden h-8 w-px bg-[#E8E4DF] sm:block" />

        {/* Sección: Huéspedes */}
        <div className="hidden flex-1 items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#F8F6F3] sm:flex">
          <Users className="h-4 w-4 shrink-0 text-[#E76F51]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6560]">
              Huéspedes
            </span>
            <span className="text-sm text-[#1A1A1A]">
              Cuántos
            </span>
          </div>
        </div>

        {/* Botón de búsqueda */}
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-[#E76F51] hover:bg-[#D45D3E]"
          aria-label="Buscar propiedades"
        >
          <Search className="h-4 w-4 text-white" />
        </Button>
      </div>
    </div>
  )
}
