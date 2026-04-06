// Página de listado de propiedades
import { SearchBar } from '@/components/busqueda/search-bar'
import { PropertyFiltersWrapper } from './filters-wrapper'
import { PropertyGrid } from '@/components/propiedades/property-grid'
import { getPropiedadesPublicas } from '@/actions/propiedad.actions'
import type { Metadata } from 'next'
import type { PropiedadCard } from '@/components/propiedades/property-card'

export const metadata: Metadata = {
  title: 'Explorar propiedades',
  description: 'Encuentra el alojamiento perfecto en Venezuela. Filtra por ubicación, precio, tipo de propiedad y más.',
}

export const dynamic = 'force-dynamic'

export default async function PropiedadesPage() {
  const resultado = await getPropiedadesPublicas()

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

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Barra de búsqueda */}
      <section className="border-b border-[#E8E4DF] bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>

      {/* Contenido principal */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filtros laterales */}
          <div className="w-full shrink-0 lg:w-64 xl:w-72">
            <div className="sticky top-20 rounded-xl border border-[#E8E4DF] bg-white p-4">
              <PropertyFiltersWrapper />
            </div>
          </div>

          {/* Cuadrícula de propiedades */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-bold text-[#1A1A1A]">
                Propiedades disponibles
              </h1>
              <span className="text-sm text-[#6B6560]">
                {resultado.total} resultado{resultado.total !== 1 ? 's' : ''}
              </span>
            </div>
            <PropertyGrid propiedades={propiedades} />
          </div>
        </div>
      </section>
    </div>
  )
}
