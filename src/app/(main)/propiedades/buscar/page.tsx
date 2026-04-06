// Página de resultados de búsqueda
import { SearchBar } from '@/components/busqueda/search-bar'
import { PropertyGrid } from '@/components/propiedades/property-grid'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar propiedades',
  description: 'Resultados de búsqueda de alojamientos en Venezuela.',
}

// Interfaz de parámetros de búsqueda
interface BuscarPageProps {
  searchParams: Promise<{
    ubicacion?: string
    fechaEntrada?: string
    fechaSalida?: string
    huespedes?: string
    tipoPropiedad?: string
    precioMin?: string
    precioMax?: string
  }>
}

export default async function BuscarPage({ searchParams }: BuscarPageProps) {
  const filtros = await searchParams

  // Datos placeholder — en producción se conectaría con la BD
  const propiedades: never[] = []

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
        {/* Resumen de búsqueda */}
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
            {propiedades.length} resultado{propiedades.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Cuadrícula de resultados */}
        <PropertyGrid propiedades={propiedades} />
      </section>
    </div>
  )
}
