// Cuadrícula de propiedades con estado vacío
'use client'

import { Home } from 'lucide-react'
import { PropertyCard, type PropiedadCard } from './property-card'
import { EmptyState } from '@/components/shared/empty-state'

interface PropertyGridProps {
  propiedades: PropiedadCard[]
}

export function PropertyGrid({ propiedades }: PropertyGridProps) {
  if (propiedades.length === 0) {
    return (
      <EmptyState
        icono={Home}
        titulo="No se encontraron propiedades"
        descripcion="Prueba ajustando los filtros de búsqueda o explora otras zonas de Venezuela."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {propiedades.map((propiedad) => (
        <PropertyCard key={propiedad.id} propiedad={propiedad} />
      ))}
    </div>
  )
}
