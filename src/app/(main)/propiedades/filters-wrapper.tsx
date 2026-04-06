// Contenedor cliente para los filtros de propiedades (gestiona el estado)
'use client'

import { useState } from 'react'
import { PropertyFilters, type FiltrosActuales } from '@/components/propiedades/property-filters'

export function PropertyFiltersWrapper() {
  const [filtros, setFiltros] = useState<FiltrosActuales>({
    ubicacion: '',
    precioMin: '',
    precioMax: '',
    tipoPropiedad: '',
    huespedes: '',
    ordenarPor: 'recientes',
  })

  const handleFiltroChange = (campo: keyof FiltrosActuales, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  return <PropertyFilters filtros={filtros} onFiltroChange={handleFiltroChange} />
}
