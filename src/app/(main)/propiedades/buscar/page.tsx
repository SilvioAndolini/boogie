// Página de resultados de búsqueda
import { SearchBar } from '@/components/busqueda/search-bar'
import { PropertyGrid } from '@/components/propiedades/property-grid'
import { PropertyMap } from '@/components/propiedades/property-map'
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
    habitaciones: p.habitaciones ?? 0,
    camas: p.camas ?? 0,
    banos: p.banos ?? 0,
  }))

  const propiedadesMapa = resultado.datos
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
      {/* Barra de búsqueda (solo mobile, en desktop está en navbar) */}
      <section className="border-b border-[#E8E4DF] bg-white py-4 sm:hidden">
        <div className="mx-auto max-w-[1600px] px-4">
          <SearchBar />
        </div>
      </section>

      {/* Layout: grid izquierdo + mapa derecho sticky */}
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Columna izquierda: filtros + resultados */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
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
                {resultado.total} Boogie{resultado.total !== 1 ? 's' : ''}
              </p>
            </div>
            <PropertyGrid propiedades={propiedades} />
          </div>

          {/* Columna derecha: mapa sticky */}
          {propiedadesMapa.length > 0 && (
            <div className="hidden w-[480px] shrink-0 xl:block">
              <div className="sticky top-6">
                <PropertyMap propiedades={propiedadesMapa} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
