// Filtros de búsqueda para propiedades
'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TipoPropiedad } from '@/types'

// Opciones de tipo de propiedad
const TIPOS_PROPIEDAD: { valor: string; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos los tipos' },
  { valor: 'APARTAMENTO', etiqueta: 'Apartamento' },
  { valor: 'CASA', etiqueta: 'Casa' },
  { valor: 'VILLA', etiqueta: 'Villa' },
  { valor: 'CABANA', etiqueta: 'Cabaña' },
  { valor: 'ESTUDIO', etiqueta: 'Estudio' },
  { valor: 'HABITACION', etiqueta: 'Habitación' },
  { valor: 'LOFT', etiqueta: 'Loft' },
  { valor: 'PENTHOUSE', etiqueta: 'Penthouse' },
  { valor: 'FINCA', etiqueta: 'Finca' },
  { valor: 'OTRO', etiqueta: 'Otro' },
]

// Opciones de ordenamiento
const ORDENAR_OPCIONES: { valor: string; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'precio_asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio_desc', etiqueta: 'Precio: mayor a menor' },
  { valor: 'rating', etiqueta: 'Mejor calificados' },
]

export interface FiltrosActuales {
  ubicacion: string
  precioMin: string
  precioMax: string
  tipoPropiedad: string
  huespedes: string
  ordenarPor: string
}

interface PropertyFiltersProps {
  filtros: FiltrosActuales
  onFiltroChange: (campo: keyof FiltrosActuales, valor: string) => void
}

export function PropertyFilters({ filtros, onFiltroChange }: PropertyFiltersProps) {
  return (
    <aside className="space-y-5">
      {/* Título */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-[#1B4332]" />
        <h2 className="text-sm font-semibold text-[#1A1A1A]">Filtros</h2>
      </div>

      {/* Búsqueda por ubicación */}
      <div className="space-y-1.5">
        <label htmlFor="filtro-ubicacion" className="text-xs font-medium text-[#6B6560]">
          Ubicación
        </label>
        <Input
          id="filtro-ubicacion"
          placeholder="Ciudad, estado o zona..."
          value={filtros.ubicacion}
          onChange={(e) => onFiltroChange('ubicacion', e.target.value)}
          className="w-full border-[#E8E4DF] bg-white"
        />
      </div>

      {/* Rango de precio */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#6B6560]">Precio por noche</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Mín"
            value={filtros.precioMin}
            onChange={(e) => onFiltroChange('precioMin', e.target.value)}
            className="w-full border-[#E8E4DF] bg-white"
            min={0}
          />
          <span className="text-xs text-[#6B6560]">-</span>
          <Input
            type="number"
            placeholder="Máx"
            value={filtros.precioMax}
            onChange={(e) => onFiltroChange('precioMax', e.target.value)}
            className="w-full border-[#E8E4DF] bg-white"
            min={0}
          />
        </div>
      </div>

      {/* Tipo de propiedad */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#6B6560]">Tipo de propiedad</label>
        <Select
          value={filtros.tipoPropiedad || undefined}
          onValueChange={(valor) => onFiltroChange('tipoPropiedad', valor ?? '')}
        >
          <SelectTrigger className="w-full border-[#E8E4DF] bg-white">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_PROPIEDAD.map((tipo) => (
              <SelectItem key={tipo.valor || 'todos'} value={tipo.valor || 'todos'}>
                {tipo.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Huéspedes */}
      <div className="space-y-1.5">
        <label htmlFor="filtro-huespedes" className="text-xs font-medium text-[#6B6560]">
          Huéspedes
        </label>
        <Input
          id="filtro-huespedes"
          type="number"
          placeholder="Cantidad de huéspedes"
          value={filtros.huespedes}
          onChange={(e) => onFiltroChange('huespedes', e.target.value)}
          className="w-full border-[#E8E4DF] bg-white"
          min={1}
        />
      </div>

      {/* Ordenar por */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#6B6560]">Ordenar por</label>
        <Select
          value={filtros.ordenarPor || 'recientes'}
          onValueChange={(valor) => onFiltroChange('ordenarPor', valor ?? '')}
        >
          <SelectTrigger className="w-full border-[#E8E4DF] bg-white">
            <SelectValue placeholder="Más recientes" />
          </SelectTrigger>
          <SelectContent>
            {ORDENAR_OPCIONES.map((opcion) => (
              <SelectItem key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  )
}
