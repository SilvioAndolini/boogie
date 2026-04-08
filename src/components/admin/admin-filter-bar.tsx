'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FilterOption {
  key: string
  label: string
}

interface AdminFilterBarProps {
  busqueda: string
  onBusquedaChange: (value: string) => void
  placeholder?: string
  filtros?: FilterOption[]
  filtroActivo?: string
  onFiltroChange?: (key: string) => void
  extraActions?: React.ReactNode
}

export function AdminFilterBar({
  busqueda,
  onBusquedaChange,
  placeholder = 'Buscar...',
  filtros,
  filtroActivo,
  onFiltroChange,
  extraActions,
}: AdminFilterBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
        <Input
          placeholder={placeholder}
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="border-[#E8E4DF] pl-10"
        />
      </div>
      {filtros && onFiltroChange && (
        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <Button
              key={f.key}
              variant={filtroActivo === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFiltroChange(f.key)}
              className={filtroActivo === f.key ? 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]' : 'border-[#E8E4DF] text-[#6B6560]'}
            >
              {f.label}
            </Button>
          ))}
        </div>
      )}
      {extraActions && <div className="flex gap-2">{extraActions}</div>}
    </div>
  )
}
