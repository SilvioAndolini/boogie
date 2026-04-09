import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  DoorOpen,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPropiedadPorId } from '@/actions/propiedad.actions'
import { PropertyGalleryWrapper } from './gallery-wrapper'
import { BookingWidget } from '@/components/reservas/booking-widget'
import { HostCard } from '@/components/propiedades/host-card'
import { TIPOS_PROPIEDAD, POLITICAS_CANCELACION } from '@/lib/constants'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'
import { LocationViewMap } from '@/components/propiedades/location-view'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const propiedad = await getPropiedadPorId(id)
  if (!propiedad) return { title: 'Boogie no encontrado' }
  return {
    title: propiedad.titulo,
    description: propiedad.descripcion.slice(0, 160),
  }
}

export default async function PropiedadDetallePage({ params }: Props) {
  const { id } = await params
  const propiedad = await getPropiedadPorId(id)

  if (!propiedad) notFound()

  const cotizacion = await getCotizacionEuro()

  const reglas = propiedad.reglas
    ? propiedad.reglas.split('\n').filter(Boolean)
    : []

  const politicaKey = propiedad.politicaCancelacion as keyof typeof POLITICAS_CANCELACION
  const politica = POLITICAS_CANCELACION[politicaKey]

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <div className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/propiedades"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B6560] transition-colors hover:text-[#1B4332]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a boogies
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <PropertyGalleryWrapper imagenes={propiedad.imagenes} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 lg:max-w-[60%]">
            <div className="mb-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-[#D8F3DC] text-xs font-medium text-[#1B4332]">
                  {TIPOS_PROPIEDAD[propiedad.tipoPropiedad as keyof typeof TIPOS_PROPIEDAD] ?? propiedad.tipoPropiedad}
                </Badge>
                {politica && (
                  <Badge variant="outline" className="text-xs text-[#6B6560]">
                    Cancelación {politica.nombre.toLowerCase()}
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
                {propiedad.ratingPromedio && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#F4A261] text-[#F4A261]" />
                    <span className="font-semibold text-[#1A1A1A]">{propiedad.ratingPromedio.toFixed(1)}</span>
                    <span>({propiedad.totalResenas} reseñas)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4 border-y border-[#E8E4DF] py-4">
              <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <Users className="h-5 w-5 text-[#1B4332]" />
                <span>{propiedad.capacidadMaxima} huéspedes</span>
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

            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Descripción</h2>
              <p className="whitespace-pre-line leading-relaxed text-[#1A1A1A]">{propiedad.descripcion}</p>
            </div>

            {propiedad.amenidades.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Amenidades</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {propiedad.amenidades.map((pa) => (
                    <div
                      key={pa.amenidadId}
                      className="flex items-center gap-2 rounded-lg border border-[#E8E4DF] px-3 py-2.5 text-sm text-[#1A1A1A]"
                    >
                      <span className="text-[#1B4332]">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      {pa.amenidad.nombre}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {propiedad.latitud != null && propiedad.longitud != null && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Ubicación</h2>
                <LocationViewMap
                  latitud={propiedad.latitud}
                  longitud={propiedad.longitud}
                  titulo={propiedad.titulo}
                />
                <p className="mt-2 text-sm text-[#6B6560]">
                  {propiedad.direccion}{propiedad.direccion ? ', ' : ''}{propiedad.ciudad}, {propiedad.estado}
                </p>
              </div>
            )}

            {reglas.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Reglas del alojamiento</h2>
                <ul className="space-y-2">
                  {reglas.map((regla, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4332]" />
                      {regla}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="mb-3 text-lg font-semibold text-[#1A1A1A]">Reseñas</h2>
              {propiedad.resenas.length > 0 ? (
                <div className="space-y-4">
                  {propiedad.resenas.map((resena) => (
                    <div key={resena.id} className="rounded-xl border border-[#E8E4DF] bg-white p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F3DC] text-xs font-semibold text-[#1B4332]">
                          {resena.autor.nombre[0]}{resena.autor.apellido[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            {resena.autor.nombre} {resena.autor.apellido}
                          </p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-[#F4A261] text-[#F4A261]" />
                            <span className="text-xs text-[#6B6560]">{resena.calificacion}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-[#1A1A1A]">{resena.comentario}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-center">
                  <Star className="mx-auto mb-2 h-10 w-10 text-[#E8E4DF]" />
                  <p className="text-sm text-[#6B6560]">
                    Las reseñas se mostrarán aquí cuando el alojamiento reciba calificaciones.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-[40%]">
            <BookingWidget
              precioPorNoche={Number(propiedad.precioPorNoche)}
              moneda={propiedad.moneda as 'USD' | 'VES'}
              capacidadMaxima={propiedad.capacidadMaxima}
              estanciaMinima={propiedad.estanciaMinima}
              propiedadId={propiedad.id}
              tasaEuro={cotizacion.tasa}
            />

            {propiedad.propietario && (
              <div className="mt-4">
                <HostCard
                  nombre={propiedad.propietario.nombre}
                  apellido={propiedad.propietario.apellido}
                  avatar_url={propiedad.propietario.avatar_url}
                  verificado={propiedad.propietario.verificado}
                  plan_suscripcion={propiedad.propietario.plan_suscripcion}
                  bio={propiedad.propietario.bio}
                  ratingPromedio={propiedad.propietario.ratingPromedio}
                  totalResenas={propiedad.propietario.totalResenas}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
