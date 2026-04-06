// Página de resultados de búsqueda
import { SearchBar } from '@/components/busqueda/search-bar'
import { PropertyGrid } from '@/components/propiedades/property-grid'
import { getPropiedadesPublicas } from '@/actions/propiedad.actions'
import type { Metadata } from 'next'
import type { PropiedadCard } from '@/components/propiedades/property-card'

export const metadata: Metadata = {
  title: 'Buscar propiedades',
  description: 'Resultados de búsqueda de alojamientos en Venezuela.',
}

export const dynamic = 'force-dynamic'

interface BuscarPageProps {
  searchParams: Promise<{
    ubicacion?: string
    huespedes?: string
    tipoPropiedad?: string
    precioMin?: string
    precioMax?: string
  }>
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const filtros = await searchParams

  const resultado = await getPropiedadesPublicas({
    ubicacion: filtros.ubicacion,
    precioMin: filtros.precioMin ? Number(filtros.precioMin) : undefined,
    precioMax: filtros.precioMax ? Number(filtros.precioMax) : undefined,
    huespedes: filtros.huespedes ? Number(filtros.huespedes) : undefined,
    tipoPropiedad: filtros.tipoPropiedad,
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

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Barra de búsqueda */}
      <section className="border-b border-[#E8E4DF] bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>

      {/* Resultados */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#1A1A1A]">
            {filtros.ubicacion
              ? `Resultados para "${filtros.ubicacion}"`
              : 'Buscar alojamientos'}
          </h1>
          {filtros.huespedes && (
            <p className="mt-1 text-sm text-[#6B6560]">
              {filtros.huespedes} huéspede{parseInt(filtros.huespedes) !== 1 ? 's' : ''}
            </p>
          )}
          <p className="mt-1 text-sm text-[#6B6560]">
            {resultado.total} resultado{resultado.total !== 1 ? 's' : ''}
          </p>
        </div>

        <PropertyGrid propiedades={propiedades} />
      </section>
    </div>
  )
}
