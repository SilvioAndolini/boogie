import { Target, Eye, Heart, Users, Globe, Shield, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Conoce la visión y misión de Boogie. Conectamos anfitriones y huéspedes en Venezuela.',
}

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E8E4DF] bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#D8F3DC]/30 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-[#1B4332]/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
              Sobre nosotros
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#1A1A1A] sm:text-5xl">
              Conectando personas y{' '}
              <span className="text-[#1B4332]">espacios</span>{' '}
              en Venezuela
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[#6B6560]">
              Boogie es la plataforma que transforma la manera de hospedarse y compartir espacios en el país. Nacimos para que cada viaje sea una experiencia segura y memorable.
            </p>
          </div>
        </div>
      </section>

      {/* Visión + Misión */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Eye className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-[#1A1A1A]">Visión</h2>
            <p className="leading-relaxed text-[#6B6560]">
              Ser la plataforma líder de alojamientos en Venezuela, donde cada persona 
              pueda encontrar el espacio perfecto para su viaje, y cada propietario pueda 
              generar ingresos de forma segura y transparente. Creemos en el poder de la 
              hospitalidad para crear conexiones genuinas entre personas de todo el mundo.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Target className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-[#1A1A1A]">Misión</h2>
            <p className="leading-relaxed text-[#6B6560]">
              Simplificar el proceso de reserva y publicación de alojamientos en Venezuela. 
              Ofrecemos una plataforma segura con múltiples métodos de pago locales e internacionales, 
              pensada para las necesidades únicas del mercado venezolano. Queremos que cualquier 
              persona pueda hospedarse o publicar su espacio sin complicaciones.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
              Valores
            </span>
            <h2 className="mt-4 text-2xl font-bold text-[#1A1A1A] sm:text-3xl">Lo que nos guía</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E8E4DF] bg-[#FEFCF9] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B4332]">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 font-semibold text-[#1A1A1A]">Confianza</h3>
              <p className="text-sm leading-relaxed text-[#6B6560]">
                Relaciones basadas en transparencia y seguridad para anfitriones y huéspedes.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E4DF] bg-[#FEFCF9] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B4332]">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 font-semibold text-[#1A1A1A]">Comunidad</h3>
              <p className="text-sm leading-relaxed text-[#6B6560]">
                Conexiones genuinas entre personas de diferentes culturas y orígenes.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E4DF] bg-[#FEFCF9] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B4332]">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 font-semibold text-[#1A1A1A]">Accesibilidad</h3>
              <p className="text-sm leading-relaxed text-[#6B6560]">
                Plataforma diseñada para todos, con múltiples opciones de pago locales.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8E4DF] bg-[#FEFCF9] p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B4332]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-2 font-semibold text-[#1A1A1A]">Innovación</h3>
              <p className="text-sm leading-relaxed text-[#6B6560]">
                Soluciones creativas adaptadas a las necesidades del mercado venezolano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Staff */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
            Staff
          </span>
          <h2 className="mt-4 text-2xl font-bold text-[#1A1A1A] sm:text-3xl">Conoce al equipo</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#6B6560]">
            Las personas detrás de Boogie que hacen posible cada experiencia.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl justify-center gap-8">
          <div className="group overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white transition-shadow hover:shadow-lg">
            <div className="grid sm:grid-cols-[280px_1fr]">
              {/* Foto */}
              <div className="flex items-center justify-center bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-8 sm:p-10">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/20">
                  <span className="text-4xl font-bold text-white">SC</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 sm:p-8">
                <div className="mb-1">
                  <span className="inline-block rounded-full bg-[#D8F3DC] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#1B4332]">
                    CEO & Fundador
                  </span>
                </div>
                <h3 className="mt-2 text-2xl font-bold text-[#1A1A1A]">Sebastián Chacón</h3>
                <p className="mt-3 leading-relaxed text-[#6B6560]">
                  Apasionado por crear soluciones que conectan personas. Sebastián fundó Boogie 
                  con la visión de transformar la forma en que venezolanos y visitantes 
                  experimentan el alojamiento en el país. Con experiencia en tecnología y negocios, 
                  lidera la estrategia y el crecimiento de la plataforma.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-[#1B4332]">
                  <Heart className="h-4 w-4" />
                  <span>Construyendo comunidad a través del alojamiento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
