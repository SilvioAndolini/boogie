'use client'

import dynamic from 'next/dynamic'

const LocationViewCanvas = dynamic(() => import('@/components/propiedades/location-view-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] w-full items-center justify-center rounded-xl bg-[#F8F6F3]">
      <span className="text-sm text-[#6B6560]">Cargando mapa...</span>
    </div>
  ),
})

export function LocationViewMap({ latitud, longitud, titulo }: {
  latitud: number
  longitud: number
  titulo?: string
}) {
  return <LocationViewCanvas latitud={latitud} longitud={longitud} titulo={titulo} />
}
