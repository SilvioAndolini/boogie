'use client'

import dynamic from 'next/dynamic'

export interface PropiedadMapa {
  id: string
  titulo: string
  latitud: number
  longitud: number
  precioPorNoche: number
  moneda: string
  imagenUrl: string | null
  tipoPropiedad: string
  capacidadMaxima: number
  habitaciones: number
  camas: number
  banos: number
  ratingPromedio: number | null
  totalResenas: number
}

const MapCanvas = dynamic(() => import('@/components/propiedades/map-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F8F6F3]">
      <span className="text-sm text-[#6B6560]">Cargando mapa...</span>
    </div>
  ),
})

export function PropertyMap({ propiedades, centerLat, centerLng }: { 
  propiedades: PropiedadMapa[]
  centerLat?: number
  centerLng?: number
}) {
  return <MapCanvas propiedades={propiedades} centerLat={centerLat} centerLng={centerLng} />
}
