// Página de Detalle de Zona - Propiedades en una zona específica
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Home, ArrowLeft, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ESTADOS_VENEZUELA } from '@/lib/constants'

// Interfaz para los parámetros de la página
interface ZonaPageProps {
  params: Promise<{ slug: string }>
}

// Mapa inverso de slug a nombre de estado
function resolverEstadoDesdeSlug(slug: string): string | undefined {
  return ESTADOS_VENEZUELA.find(
    (estado) =>
      estado
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-') === slug
  )
}

// Descripciones placeholder para cada estado
const DESCRIPCIONES_ZONA: Record<string, string> = {
  Amazonas: 'Explora la selva amazónica venezolana con sus ríos y biodiversidad única.',
  'Anzoátegui': 'Disfruta de las playas del Caribe en la costa oriental de Venezuela.',
  Apure: 'Descubre la vasta llanura venezolana y su rica fauna silvestre.',
  Aragua: 'Playas, montañas y el Lago de Valencia en el corazón del país.',
  Barinas: 'La puerta de entrada a Los Llanos y sus increíbles atardeceres.',
  'Bolívar': 'La Gran Sabana, el Salto Ángel y el Parque Nacional Canaima te esperan.',
  Carabobo: 'Historia, playas y la vibrante ciudad de Valencia.',
  Cojedes: 'Tranquilidad llanera con paisajes naturales privilegiados.',
  'Delta Amacuro': 'El majestuoso Delta del Orinoco y sus comunidades indígenas.',
  'Distrito Capital': 'Caracas, la cosmopolita capital venezolana entre montañas.',
  'Falcón': 'Península de Paraguaná, dunas de Coro y playas paradisíacas.',
  'Guárico': 'Corazón llanero con extensas sabanas y tradiciones gauchas.',
  Lara: 'Barquisimeto, la ciudad crepuscular, y el Parque Nacional Terepaima.',
  'Mérida': 'Los Andes venezolanos, teleférico, nieve y aventura sin límites.',
  Miranda: 'Playas de Barlovento, El Ávila y ciudades satélites de Caracas.',
  Monagas: 'El Puente Angostura, el río Orinoco y la cálida Ciudad Bolívar.',
  'Nueva Esparta': 'Isla de Margarita, el Caribe venezolano con playas y comercio.',
  Portuguesa: 'Tierra de agricultura y tradiciones en el occidente llanero.',
  Sucre: 'Península de Araya, Cumaná y las playas del oriente venezolano.',
  'Táchira': 'Frontera andina con Colombia, montañas verdes y clima agradable.',
  Trujillo: 'Paisajes andinos, la paz de Boconó y el monumento a la Paz.',
  Vargas: 'La costa central con playas, el aeropuerto internacional y El Ávila.',
  Yaracuy: 'El jardín de Venezuela con vegetación exuberante y montañas.',
  Zulia: 'El Lago de Maracaibo, el calor caribeño y la cultura wayuu.',
}

// Datos de ejemplo vacíos para propiedades
interface PropiedadZona {
  id: string
  titulo: string
  precioPorNoche: number
  moneda: 'USD' | 'VES'
  ciudad: string
}

const propiedadesZona: PropiedadZona[] = []

export default async function ZonaDetallePage({ params }: ZonaPageProps) {
  const { slug } = await params
  const nombreEstado = resolverEstadoDesdeSlug(slug)

  // Si el slug no corresponde a ningún estado, devolver 404
  if (!nombreEstado) {
    notFound()
  }

  const descripcion = DESCRIPCIONES_ZONA[nombreEstado] ?? `Descubre propiedades en ${nombreEstado}, Venezuela.`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navegación de regreso */}
      <Link
        href="/zonas"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B6560] transition-colors hover:text-[#1B4332]"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas las zonas
      </Link>

      {/* Encabezado de la zona */}
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D8F3DC]">
            <MapPin className="h-6 w-6 text-[#1B4332]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
              {nombreEstado}
            </h1>
            <p className="text-sm text-[#6B6560]">Venezuela</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-[#6B6560]">{descripcion}</p>
      </div>

      {/* Propiedades en la zona */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          Propiedades en {nombreEstado}
        </h2>
        <span className="text-sm text-[#9E9892]">
          {propiedadesZona.length} {propiedadesZona.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {/* Estado vacío */}
      {propiedadesZona.length === 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Search className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Próximamente
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Aún no hay alojamientos disponibles en {nombreEstado}. Sé el primero en publicar.
            </p>
            <Link href="/dashboard/mis-propiedades/nueva">
              <Button className="mt-6 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                <Home className="mr-1 h-4 w-4" />
                Publicar propiedad en {nombreEstado}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid de propiedades */}
      {propiedadesZona.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {propiedadesZona.map((propiedad) => (
            <Card key={propiedad.id} className="border-[#E8E4DF] transition-shadow hover:shadow-md">
              {/* Imagen placeholder */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-5xl font-bold text-[#1B4332]/20">B</span>
                </div>
              </div>
              <CardContent className="pt-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-[#1A1A1A]">
                  {propiedad.titulo}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-[#6B6560]">
                  <MapPin className="h-3 w-3" />
                  {propiedad.ciudad}
                </div>
                <div className="mt-2">
                  <span className="text-sm font-bold text-[#1B4332]">
                    {propiedad.moneda === 'USD'
                      ? `$${propiedad.precioPorNoche.toLocaleString('en-US')}`
                      : `Bs. ${propiedad.precioPorNoche.toLocaleString('es-VE')}`}
                  </span>
                  <span className="text-xs text-[#6B6560]"> / noche</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
