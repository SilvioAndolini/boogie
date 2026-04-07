import { SearchBar } from '@/components/busqueda/search-bar'
import { PropiedadesLayout } from '@/components/propiedades/propiedades-layout'
import { getPropiedadesPublicas } from '@/actions/propiedad.actions'
import type { Metadata } from 'next'
import type { PropiedadCard } from '@/components/propiedades/property-card'
import type { PropiedadMapa } from '@/components/propiedades/property-map'

export const metadata: Metadata = {
  title: 'Explorar propiedades',
  description: 'Encuentra el alojamiento perfecto en Venezuela.',
}

export const dynamic = 'force-dynamic'

interface PropiedadesPageProps {
  searchParams: Promise<{
    ubicacion?: string
    lat?: string
    lng?: string
    radio?: string
    tipoPropiedad?: string
    precioMin?: string
    precioMax?: string
    huespedes?: string
    habitaciones?: string
    banos?: string
    ordenarPor?: string
  }>
}

export default async function PropiedadesPage({ searchParams }: PropiedadesPageProps) {
  const params = await searchParams

  const lat = params.lat ? Number(params.lat) : undefined
  const lng = params.lng ? Number(params.lng) : undefined
  const radio = params.radio ? Number(params.radio) : undefined

  const resultado = await getPropiedadesPublicas({
    ubicacion: params.ubicacion,
    lat,
    lng,
    radio,
    precioMin: params.precioMin ? Number(params.precioMin) : undefined,
    precioMax: params.precioMax ? Number(params.precioMax) : undefined,
    huespedes: params.huespedes ? Number(params.huespedes) : undefined,
    tipoPropiedad: params.tipoPropiedad,
    habitaciones: params.habitaciones ? Number(params.habitaciones) : undefined,
    banos: params.banos ? Number(params.banos) : undefined,
    ordenarPor: params.ordenarPor,
  })

  const propiedades: PropiedadCard[] = resultado.datos.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    tipoPropiedad: p.tipoPropiedad as PropiedadCard['tipoPropiedad'],
    precioPorNoche: Number(p.precioPorNoche),
    moneda: p.moneda as PropiedadCard['moneda'],
    ciudad: p.ciudad,
    estado: p.estado,
    ratingPromedio: p.ratingPromedio ?? 0,
    totalResenas: p.totalResenas,
    imagenes: p.imagenes.map((img) => img.url),
  }))

  const propiedadesMapa: PropiedadMapa[] = resultado.datos
    .filter((p) => p.latitud != null && p.longitud != null)
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      latitud: p.latitud!,
      longitud: p.longitud!,
      precioPorNoche: Number(p.precioPorNoche),
      moneda: p.moneda,
      imagenUrl: p.imagenes[0]?.url ?? null,
      tipoPropiedad: p.tipoPropiedad,
      capacidadMaxima: p.capacidadMaxima,
      habitaciones: p.habitaciones,
      camas: p.camas,
      banos: p.banos,
      ratingPromedio: p.ratingPromedio,
      totalResenas: p.totalResenas,
    }))

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <section className="border-b border-[#E8E4DF] bg-white py-6">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>

      <PropiedadesLayout
        propiedades={propiedades}
        propiedadesMapa={propiedadesMapa}
        total={resultado.total}
        centerLat={lat}
        centerLng={lng}
        locationName={params.ubicacion ?? ''}
      />
    </div>
  )
}
