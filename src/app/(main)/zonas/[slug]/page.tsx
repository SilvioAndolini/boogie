import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Home, ArrowLeft, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PropertyCard, type PropiedadCard } from '@/components/propiedades/property-card'
import { getPropiedadesPublicas } from '@/actions/propiedad.actions'
import { ZONAS_POR_SLUG, ZONAS_SLUGS } from '@/lib/zonas'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return ZONAS_SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const zona = ZONAS_POR_SLUG.get(slug)
  if (!zona) return {}
  return {
    title: `Boogies en ${zona.nombre}, ${zona.estado}`,
    description: zona.descripcion,
  }
}

export const dynamic = 'force-dynamic'

interface ZonaPageProps {
  params: Promise<{ slug: string }>
}

export default async function ZonaDetallePage({ params }: ZonaPageProps) {
  const { slug } = await params
  const zona = ZONAS_POR_SLUG.get(slug)
  if (!zona) notFound()

  const resultado = await getPropiedadesPublicas({ ubicacion: zona.estado })

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
    propietario: (p as unknown as Record<string, unknown>).propietario as { reputacion: number | null; plan_suscripcion: string } | null,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/zonas"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas las zonas
      </Link>

      <div className="mb-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D8F3DC]">
            <MapPin className="h-6 w-6 text-[#1B4332]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
              {zona.nombre}
            </h1>
            <p className="text-sm text-[#6B6560]">{zona.estado}, Venezuela</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-[#6B6560]">{zona.descripcion}</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          Boogies en {zona.nombre}
        </h2>
        <span className="text-sm text-[#9E9892]">
          {resultado.total} Boogie{resultado.total !== 1 ? 's' : ''}
        </span>
      </div>

      {propiedades.length === 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Search className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Próximamente
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Aún no hay Boogies disponibles en {zona.nombre}. Sé el primero en publicar uno.
            </p>
            <Link href="/dashboard/mis-propiedades/nueva">
              <Button className="mt-6 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                <Home className="mr-1 h-4 w-4" />
                Publicar boogie en {zona.nombre}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {propiedades.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {propiedades.map((propiedad) => (
            <PropertyCard key={propiedad.id} propiedad={propiedad} />
          ))}
        </div>
      )}
    </div>
  )
}
