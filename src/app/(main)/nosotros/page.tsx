import { Target, Eye, Heart, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Conoce la visión y misión de Boogie. Conectamos anfitriones y huéspedes en Venezuela.',
}

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Encabezado */}
      <section className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
            Nosotros
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#6B6560]">
            Conectando personas y espacios en Venezuela
          </p>
        </div>
      </section>

      {/* Visión */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
            Visión
          </span>
        </div>
        
        <div className="mx-auto max-w-3xl rounded-xl border border-[#E8E4DF] bg-white p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-[#D8F3DC]">
            <Eye className="h-8 w-8 text-[#1B4332]" />
          </div>
          <h2 className="mb-4 text-xl font-bold text-[#1A1A1A]">
            Un Venezuela donde todos pueden encontrar su lugar
          </h2>
          <p className="text-base leading-relaxed text-[#6B6560]">
            Queremos ser la plataforma líder de alojamientos en Venezuela, donde cada persona 
            pueda encontrar el espacio perfecto para su viaje, y cada propietario pueda 
            generar ingresos de forma segura y transparente. Creemos en el poder de la 
            hospitalidad para crear conexiones genuinas entre personas de todo el mundo.
          </p>
        </div>
      </section>

      {/* Separador */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-[#E8E4DF]" />
      </div>

      {/* Misión */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
            Misión
          </span>
        </div>

        <div className="mx-auto max-w-3xl rounded-xl border border-[#E8E4DF] bg-white p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-[#D8F3DC]">
            <Target className="h-8 w-8 text-[#1B4332]" />
          </div>
          <h2 className="mb-4 text-xl font-bold text-[#1A1A1A]">
            Facilitar el alojamiento en Venezuela
          </h2>
          <p className="text-base leading-relaxed text-[#6B6560]">
            Boogie nació con el objetivo de simplificar el proceso de reserva y publicación 
            de alojamientos en Venezuela. Ofrecemos una plataforma segura con múltiples métodos 
            de pago locales e internacionales, pensada para las necesidades únicas del 
            mercado venezolano. Nuestra misión es que cualquier persona pueda hospedarse 
            o publicar su espacio sin complicaciones.
          </p>
        </div>
      </section>

      {/* Separador */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-[#E8E4DF]" />
      </div>

      {/* CEO */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-[#D8F3DC] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#1B4332]">
            Nuestro equipo
          </span>
          <h2 className="mt-3 text-2xl font-bold text-[#1A1A1A]">
            El corazón de Boogie
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-[#E8E4DF] bg-white p-8 text-center">
            {/* Espacio para foto del CEO */}
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#D8F3DC] to-[#1B4332]/20">
              <div className="flex h-full w-full items-center justify-center bg-[#D8F3DC]">
                <span className="text-4xl font-bold text-[#1B4332]">SC</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#1A1A1A]">Sebastián Chacón</h3>
            <p className="mt-1 text-sm font-medium text-[#1B4332]">Fundador & CEO</p>
            
            <p className="mt-4 text-base leading-relaxed text-[#6B6560]">
              Apasionado por crear soluciones que conectan personas. Sebastián fundó Boogie 
              con la visión de transformar la forma en que venezolanos y visitantes 
              experimentan el alojamiento en el país.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6B6560]">
              <Heart className="h-4 w-4 text-[#C1121F]" />
              <span>Construyendo comunidad a través del alojamiento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Separador */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-[#E8E4DF]" />
      </div>

      {/* Valores */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Nuestros valores</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Heart className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h3 className="mb-2 font-semibold text-[#1A1A1A]">Confianza</h3>
            <p className="text-sm text-[#6B6560]">
              Construimos relaciones basadas en la transparencia y la seguridad para 
              anfitriones y huéspedes.
            </p>
          </div>

          <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Users className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h3 className="mb-2 font-semibold text-[#1A1A1A]">Comunidad</h3>
            <p className="text-sm text-[#6B6560]">
              Fomentamos conexiones genuinas entre personas de diferentes culturas y orígenes.
            </p>
          </div>

          <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Target className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h3 className="mb-2 font-semibold text-[#1A1A1A]">Accesibilidad</h3>
            <p className="text-sm text-[#6B6560]">
              Diseñamos una plataforma accesible para todos, con múltiples opciones de pago.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}