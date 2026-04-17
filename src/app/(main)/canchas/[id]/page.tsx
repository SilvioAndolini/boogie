import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GoldStar } from '@/components/ui/gold-star'
import { getPropiedadPorId } from '@/actions/propiedad.actions'
import { PropertyGalleryWrapper } from './gallery-wrapper'
import { CanchaBookingWidget } from '@/components/canchas/cancha-booking-widget'
import { HostCard } from '@/components/propiedades/host-card'
import { AmenidadIcon } from '@/components/propiedades/amenidad-icon'
import { LocationViewMap } from '@/components/propiedades/location-view'
import { TIPOS_CANCHA } from '@/lib/constants'
import { getCotizacionEuro } from '@/lib/services/exchange-rate'
import { obtenerFechasOcupadas } from '@/lib/reservas/disponibilidad'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const propiedad = await getPropiedadPorId(id)
  if (!propiedad) return { title: 'Cancha no encontrada' }
  return {
    title: propiedad.titulo,
    description: propiedad.descripcion.slice(0, 160),
  }
}

export default async function CanchaDetallePage({ params }: Props) {
  const { id } = await params
  const propiedad = await getPropiedadPorId(id)

  if (!propiedad) notFound()

  const cotizacion = await getCotizacionEuro()

  const fechasOcupadasRaw = await obtenerFechasOcupadas(id)
  const fechasOcupadas = fechasOcupadasRaw.map((r) => ({
    inicio: r.inicio.toISOString(),
    fin: r.fin.toISOString(),
    estado: r.estado,
  }))

  const tipoCanchaKey = propiedad.tipoCancha
  const tipoCanchaLabel = tipoCanchaKey ? TIPOS_CANCHA[tipoCanchaKey as keyof typeof TIPOS_CANCHA] ?? tipoCanchaKey : null
  const precioPorHora = propiedad.precioPorHora
  const horaApertura = propiedad.horaApertura
  const horaCierre = propiedad.horaCierre

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      <div className="border-b border-[#E8E4DF] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/canchas"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F4F1EC] hover:text-[#1B4332]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a canchas
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <PropertyGalleryWrapper imagenes={propiedad.imagenes} />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 lg:max-w-[60%]">

            {/* ====== TITULO + BADGES ====== */}
            <div className="mb-6">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {tipoCanchaLabel && (
                  <Badge className="rounded-lg bg-[#D8F3DC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1B4332] ring-1 ring-inset ring-[#1B4332]/10 hover:bg-[#D8F3DC]">
                    <Trophy className="mr-1 h-3 w-3" />
                    {tipoCanchaLabel}
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-lg border-[#E8E4DF] px-2.5 py-1 text-[10px] font-medium text-[#6B6560]">
                  Cancha deportiva
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A] sm:text-3xl">
                {propiedad.titulo}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm text-[#6B6560]">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#1B4332]" />
                  <span className="font-medium">{propiedad.ciudad}, {propiedad.estado}</span>
                </div>
                {propiedad.ratingPromedio && (
                  <div className="flex items-center gap-1">
                    <GoldStar size={16} rating={propiedad.ratingPromedio} showValue />
                    <span className="text-[#9E9892]">({propiedad.totalResenas})</span>
                  </div>
                )}
              </div>
            </div>

            {/* ====== STATS CANCHA ====== */}
            <div className="mb-8 grid grid-cols-2 gap-2 rounded-xl border border-[#E8E4DF] bg-white px-3 py-2.5 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 shrink-0 text-[#1B4332]" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1A1A1A]">{tipoCanchaLabel ?? 'Cancha'}</p>
                  <p className="text-[9px] text-[#9E9892]">Tipo</p>
                </div>
              </div>
              {precioPorHora != null && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-[#1B4332]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A1A]">${precioPorHora.toFixed(2)}</p>
                    <p className="text-[9px] text-[#9E9892]">Por hora</p>
                  </div>
                </div>
              )}
              {horaApertura && horaCierre && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-[#1B4332]" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A1A]">{horaApertura} - {horaCierre}</p>
                    <p className="text-[9px] text-[#9E9892]">Horario</p>
                  </div>
                </div>
              )}
            </div>

            {/* ====== DESCRIPCION ====== */}
            <div className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1B4332]" />
                </div>
                Descripción
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#3D3832]">{propiedad.descripcion}</p>
            </div>

            {/* ====== AMENIDADES ====== */}
            {propiedad.amenidades.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
                    <Star className="h-3.5 w-3.5 text-[#1B4332]" />
                  </div>
                  Instalaciones
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {propiedad.amenidades.map((pa) => (
                    <div
                      key={pa.amenidadId}
                      className="flex items-center gap-2.5 rounded-xl border border-[#E8E4DF] bg-white px-3 py-2.5"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0FDF4]">
                        <AmenidadIcon icono={pa.amenidad.icono} className="h-3.5 w-3.5 text-[#1B4332]" />
                      </span>
                      <span className="text-xs font-medium text-[#1A1A1A]">{pa.amenidad.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ====== UBICACION ====== */}
            {propiedad.latitud != null && propiedad.longitud != null && (
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
                    <MapPin className="h-3.5 w-3.5 text-[#1B4332]" />
                  </div>
                  Ubicación
                </h2>
                <div className="overflow-hidden rounded-xl border border-[#E8E4DF]">
                  <LocationViewMap
                    latitud={propiedad.latitud}
                    longitud={propiedad.longitud}
                    titulo={propiedad.titulo}
                  />
                </div>
                <p className="mt-2 text-sm text-[#6B6560]">
                  {propiedad.direccion}{propiedad.direccion ? ', ' : ''}{propiedad.ciudad}, {propiedad.estado}
                </p>
              </div>
            )}

            {/* ====== REGLAS ====== */}
            {propiedad.reglas && (
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#1B4332]" />
                  </div>
                  Reglas de uso
                </h2>
                <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
                  <ul className="space-y-2">
                    {propiedad.reglas.split('\n').filter(Boolean).map((regla, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#3D3832]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B4332]" />
                        {regla}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ====== RESENAS ====== */}
            <div className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
                  <Star className="h-3.5 w-3.5 text-[#1B4332]" />
                </div>
                Reseñas
                {propiedad.totalResenas > 0 && (
                  <span className="ml-1 rounded-full bg-[#F4F1EC] px-2 py-0.5 text-[10px] font-semibold text-[#6B6560]">
                    {propiedad.totalResenas}
                  </span>
                )}
              </h2>
              {propiedad.resenas.length > 0 ? (
                <div className="space-y-3">
                  {propiedad.resenas.map((resena) => (
                    <div key={resena.id} className="rounded-xl border border-[#E8E4DF] bg-white p-4">
                      <div className="mb-2.5 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C] text-xs font-bold text-white">
                          {resena.autor.nombre[0]}{resena.autor.apellido[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1A1A1A]">
                            {resena.autor.nombre} {resena.autor.apellido}
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star
                                key={si}
                                className={`h-3 w-3 ${si < resena.calificacion ? 'fill-[#F4A261] text-[#F4A261]' : 'text-[#E8E4DF]'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#9E9892]">
                          {new Date(resena.fechaCreacion).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-[#3D3832]">{resena.comentario}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[#E8E4DF] bg-white p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F1EC]">
                    <Star className="h-6 w-6 text-[#D4CFC9]" />
                  </div>
                  <p className="text-sm font-medium text-[#6B6560]">
                    Aún no hay reseñas
                  </p>
                  <p className="mt-1 text-xs text-[#9E9892]">
                    Las reseñas aparecerán cuando la cancha reciba calificaciones
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ====== SIDEBAR ====== */}
          <div className="lg:w-[40%]">
            <div className="lg:sticky lg:top-4 space-y-4">
              <CanchaBookingWidget
                propiedadId={propiedad.id}
                titulo={propiedad.titulo}
                ciudad={propiedad.ciudad}
                estado={propiedad.estado}
                precioPorHora={precioPorHora ?? Number(propiedad.precioPorNoche)}
                moneda={propiedad.moneda as 'USD' | 'VES'}
                horaApertura={horaApertura ?? '08:00'}
                horaCierre={horaCierre ?? '22:00'}
                tasaEuro={cotizacion.tasa}
                fechasOcupadas={fechasOcupadas}
              />

              {propiedad.propietario && (
                <HostCard
                  nombre={propiedad.propietario.nombre}
                  apellido={propiedad.propietario.apellido}
                  avatar_url={propiedad.propietario.avatar_url}
                  verificado={propiedad.propietario.verificado}
                  plan_suscripcion={propiedad.propietario.plan_suscripcion}
                  bio={propiedad.propietario.bio}
                  reputacion={propiedad.propietario.reputacion}
                  reputacionManual={propiedad.propietario.reputacionManual}
                  propietarioId={propiedad.propietario.id}
                  propiedadId={propiedad.id}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
