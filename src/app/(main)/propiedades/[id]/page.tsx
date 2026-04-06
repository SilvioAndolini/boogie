// Página de detalle de propiedad
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  DoorOpen,
  Wifi,
  Car,
  AirVent,
  Waves,
  Tv,
  UtensilsCrossed,
  ShieldCheck,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Detalle de propiedad',
  description: 'Información detallada del alojamiento en Boogie.',
}

// Datos de ejemplo para renderizar sin conexión a BD
const PROPIEDAD_EJEMPLO = {
  id: '1',
  titulo: 'Apartamento moderno con vista al mar',
  tipoPropiedad: 'APARTAMENTO',
  descripcion:
    'Disfruta de este hermoso apartamento frente al mar en la costa caribeña de Venezuela. Cuenta con todas las comodidades para una estadía inolvidable: cocina equipada, aire acondicionado, wifi de alta velocidad y una terraza privada con vista panorámica al mar Caribe. Ubicado en una zona segura y cercana a restaurantes, playas y sitios de interés turístico.',
  ciudad: 'Caracas',
  estado: 'Distrito Capital',
  precioPorNoche: 45,
  moneda: 'USD' as const,
  capacidad: 4,
  habitaciones: 2,
  camas: 2,
  banos: 1,
  ratingPromedio: 4.8,
  totalResenas: 24,
  imagenes: [] as string[],
  amenidades: [
    'Wifi de alta velocidad',
    'Aire acondicionado',
    'Estacionamiento gratuito',
    'Piscina compartida',
    'Cocina equipada',
    'Televisión Smart TV',
    'Acceso a la playa',
    'Seguridad 24/7',
  ],
  reglas: [
    'No se permiten fiestas ni eventos',
    'No fumar dentro del alojamiento',
    'No se permiten mascotas',
    'Horario de silencio: 10:00 PM - 8:00 AM',
    'Máximo 4 huéspedes',
  ],
  politicaCancelacion: 'FLEXIBLE' as const,
}

// Iconos para amenidades
const ICONOS_AMENIDADES: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  aire: <AirVent className="h-4 w-4" />,
  estacionamiento: <Car className="h-4 w-4" />,
  piscina: <Waves className="h-4 w-4" />,
  cocina: <UtensilsCrossed className="h-4 w-4" />,
  televisión: <Tv className="h-4 w-4" />,
}

// Tipo de propiedad en español
const TIPO_LABELS: Record<string, string> = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  VILLA: 'Villa',
  CABANA: 'Cabaña',
  ESTUDIO: 'Estudio',
  HABITACION: 'Habitación',
  LOFT: 'Loft',
  PENTHOUSE: 'Penthouse',
  FINCA: 'Finca',
  OTRO: 'Otro',
}

export default function PropiedadDetallePage({ params }: { params: Promise<{ id: string }> }) {
  // Por ahora usamos datos de ejemplo; en producción se obtendrían de la BD
  const propiedad = PROPIEDAD_EJEMPLO

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Navegación superior */}
      <div className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/propiedades"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a propiedades
          </Link>
        </div>
      </div>

      {/* Galería de imágenes placeholder */}
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="text-6xl font-bold text-[#1B4332]/10">B</span>
              <p className="mt-2 text-sm text-[#6B6560]">Galería de imágenes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Detalles (60%) */}
          <div className="flex-1 lg:max-w-[60%]">
            {/* Encabezado */}
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-[#D8F3DC] text-xs font-medium text-[#1B4332]">
                  {TIPO_LABELS[propiedad.tipoPropiedad] ?? propiedad.tipoPropiedad}
                </Badge>
                {propiedad.politicaCancelacion && (
                  <Badge variant="outline" className="text-xs text-[#6B6560]">
                    Cancelación {propiedad.politicaCancelacion.toLowerCase()}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] sm:text-3xl">
                {propiedad.titulo}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#6B6560]">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {propiedad.ciudad}, {propiedad.estado}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#F4A261] text-[#F4A261]" />
                  <span className="font-semibold text-[#1A1A1A]">{propiedad.ratingPromedio}</span>
                  <span>({propiedad.totalResenas} reseñas)</span>
                </div>
              </div>
            </div>

            {/* Capacidad */}
            <div className="mb-6 flex flex-wrap gap-4 border-y border-[#E8E4DF] py-4">
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <Users className="h-5 w-5 text-[#1B4332]" />
                <span>{propiedad.capacidad} huéspedes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <DoorOpen className="h-5 w-5 text-[#1B4332]" />
                <span>{propiedad.habitaciones} habitaciones</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <BedDouble className="h-5 w-5 text-[#1B4332]" />
                <span>{propiedad.camas} camas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <Bath className="h-5 w-5 text-[#1B4332]" />
                <span>{propiedad.banos} baños</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Descripción</h2>
              <p className="leading-relaxed text-[#1A1A1A]">{propiedad.descripcion}</p>
            </div>

            {/* Amenidades */}
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Amenidades</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {propiedad.amenidades.map((amenidad) => (
                  <div
                    key={amenidad}
                    className="flex items-center gap-2 rounded-lg border border-[#E8E4DF] px-3 py-2.5 text-sm text-[#1A1A1A]"
                  >
                    <span className="text-[#1B4332]">
                      {ICONOS_AMENIDADES[amenidad.toLowerCase()] ?? <ShieldCheck className="h-4 w-4" />}
                    </span>
                    {amenidad}
                  </div>
                ))}
              </div>
            </div>

            {/* Reglas */}
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Reglas del alojamiento</h2>
              <ul className="space-y-2">
                {propiedad.reglas.map((regla) => (
                  <li key={regla} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E76F51]" />
                    {regla}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reseñas placeholder */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Reseñas</h2>
              <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-center">
                <Star className="mx-auto mb-2 h-10 w-10 text-[#E8E4DF]" />
                <p className="text-sm text-[#6B6560]">
                  Las reseñas se mostrarán aquí cuando el alojamiento reciba calificaciones.
                </p>
              </div>
            </div>
          </div>

          {/* Widget de reserva (40%) */}
          <div className="lg:w-[40%]">
            <div className="sticky top-20 rounded-xl border border-[#E8E4DF] bg-white p-5 shadow-sm">
              {/* Precio */}
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#1B4332]">
                  ${propiedad.precioPorNoche.toLocaleString('en-US')}
                </span>
                <span className="text-sm text-[#6B6560]">/ noche</span>
              </div>

              {/* Selector de fechas placeholder */}
              <div className="mb-3 space-y-2">
                <div className="rounded-lg border border-[#E8E4DF] p-3">
                  <div className="flex items-center gap-2 text-sm text-[#6B6560]">
                    <Calendar className="h-4 w-4" />
                    <span>Selecciona las fechas de tu viaje</span>
                  </div>
                </div>
              </div>

              {/* Selector de huéspedes placeholder */}
              <div className="mb-4">
                <div className="rounded-lg border border-[#E8E4DF] p-3">
                  <div className="flex items-center gap-2 text-sm text-[#6B6560]">
                    <Users className="h-4 w-4" />
                    <span>1 huésped</span>
                  </div>
                </div>
              </div>

              {/* Desglose de precio */}
              <div className="mb-4 space-y-2 border-t border-[#E8E4DF] pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">
                    ${propiedad.precioPorNoche} x 5 noches
                  </span>
                  <span className="text-[#1A1A1A]">
                    ${(propiedad.precioPorNoche * 5).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6560]">Tarifa de servicio</span>
                  <span className="text-[#1A1A1A]">$25</span>
                </div>
                <div className="flex justify-between border-t border-[#E8E4DF] pt-2 font-semibold">
                  <span className="text-[#1A1A1A]">Total</span>
                  <span className="text-[#1B4332]">
                    ${(propiedad.precioPorNoche * 5 + 25).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Botón de reserva */}
              <Button className="w-full bg-[#E76F51] text-base font-semibold hover:bg-[#D45D3E]">
                <CreditCard className="mr-2 h-4 w-4" />
                Reservar ahora
              </Button>

              <p className="mt-3 text-center text-xs text-[#6B6560]">
                No se te cobrará nada por ahora
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
