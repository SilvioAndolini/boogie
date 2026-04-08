'use client'

import dynamic from 'next/dynamic'

const LocationPickerCanvas = dynamic(() => import('@/components/propiedades/location-picker-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] w-full items-center justify-center rounded-xl bg-[#F8F6F3]">
      <span className="text-sm text-[#6B6560]">Cargando mapa...</span>
    </div>
  ),
})

export interface AddressData {
  direccion: string
  ciudad: string
  estado: string
  zona: string
}

export function LocationPickerMap({ latitud, longitud, onLocationSelect, onAddressChange }: {
  latitud: number | null
  longitud: number | null
  onLocationSelect: (lat: number, lng: number) => void
  onAddressChange?: (data: AddressData) => void
}) {
  return <LocationPickerCanvas latitud={latitud} longitud={longitud} onLocationSelect={onLocationSelect} onAddressChange={onAddressChange} />
}
