// Página principal (landing) de Boogie
import Link from 'next/link'
import { Search, CalendarCheck, PartyPopper, MapPin, ArrowRight } from 'lucide-react'
import { PropertyCard, type PropiedadCard } from '@/components/propiedades/property-card'

// Datos de las zonas populares de Venezuela
const ZONAS_POPULARES = [
  {
    nombre: 'Caracas',
    descripcion: 'La capital vibrante',
    gradient: 'from-[#1B4332] to-[#2D6A4F]',
    propiedades: 120,
  },
  {
    nombre: 'Isla de Margarita',
    descripcion: 'Playas paradisíacas',
    gradient: 'from-[#E76F51] to-[#F4A261]',
    propiedades: 85,
  },
  {
    nombre: 'Mérida',
    descripcion: 'Aventura en los Andes',
    gradient: 'from-[#2D6A4F] to-[#52B788]',
    propiedades: 64,
  },
  {
    nombre: 'Valencia',
    descripcion: 'Ciudad jardín',
    gradient: 'from-[#52B788] to-[#D8F3DC]',
    propiedades: 45,
  },
  {
    nombre: 'Maracaibo',
    descripcion: 'Tierra del sol amada',
    gradient: 'from-[#F4A261] to-[#E76F51]',
    propiedades: 38,
  },
  {
    nombre: 'Canaima',
    descripcion: 'Naturaleza salvaje',
    gradient: 'from-[#1B4332] to-[#52B788]',
    propiedades: 22,
  },
]

// Propiedades destacadas de ejemplo
const PROPIEDADES_DESTACADAS: PropiedadCard[] = [
  {
    id: '1',
    titulo: 'Apartamento moderno en Chacao',
    tipoPropiedad: 'APARTAMENTO',
    precioPorNoche: 45,
    moneda: 'USD',
    ciudad: 'Caracas',
    estado: 'Distrito Capital',
    ratingPromedio: 4.8,
    totalResenas: 120,
    imagenes: [],
  },
  {
    id: '2',
    titulo: 'Villa frente al mar en Porlamar',
    tipoPropiedad: 'VILLA',
    precioPorNoche: 120,
    moneda: 'USD',
    ciudad: 'Porlamar',
    estado: 'Nueva Esparta',
    ratingPromedio: 4.9,
    totalResenas: 87,
    imagenes: [],
  },
  {
    id: '3',
    titulo: 'Cabaña con vista al Pico Bolívar',
    tipoPropiedad: 'CABANA',
    precioPorNoche: 35,
    moneda: 'USD',
    ciudad: 'Mérida',
    estado: 'Mérida',
    ratingPromedio: 4.7,
    totalResenas: 64,
    imagenes: [],
  },
]

// Pasos del "Cómo funciona"
const PASOS = [
  {
    icono: Search,
    titulo: 'Busca',
    descripcion: 'Explora cientos de alojamientos en toda Venezuela. Filtra por ubicación, precio y comodidades.',
  },
  {
    icono: CalendarCheck,
    titulo: 'Reserva',
    descripcion: 'Elige tus fechas y confirma tu reserva con métodos de pago locales y seguros.',
  },
  {
    icono: PartyPopper,
    titulo: 'Disfruta',
    descripcion: 'Llega a tu alojamiento y vive una experiencia inolvidable como un lugareño.',
  },
]

// Página principal de Boogie (componente de servidor)
export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        {/* Fondo con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332]" />
        {/* Patrón decorativo sutil */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.3),transparent_60%)]" />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.4),transparent_50%)]" />

        {/* Contenido */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          {/* Badge */}
          <span className="mb-6 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
            Mas de 500 alojamientos en toda Venezuela
          </span>

          {/* Título */}
          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Descubre Venezuela{' '}
            <span className="text-[#F4A261]">como nunca antes</span>
          </h1>

          {/* Subtítulo */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Encuentra el alojamiento perfecto para tu próxima aventura.
            Apartamentos, casas y villas en los destinos mas emocionantes del país.
          </p>

          {/* Barra de búsqueda */}
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-black/10">
              <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
                <Search className="h-5 w-5 shrink-0 text-[#9E9892]" />
                <input
                  type="text"
                  placeholder="Busca por ciudad, estado o tipo de alojamiento..."
                  className="w-full bg-transparent text-sm text-[#1A1A1A] placeholder-[#9E9892] outline-none"
                />
              </div>
              <Link
                href="/propiedades"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#E76F51] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#D45D3E]"
              >
                Explorar alojamientos
              </Link>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-12 flex items-center justify-center gap-8 text-white/70 sm:gap-12">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-sm">Alojamientos</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">15+</p>
              <p className="text-sm">Destinos</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">2,000+</p>
              <p className="text-sm">Huéspedes felices</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ZONAS POPULARES ===== */}
      <section className="bg-[#FEFCF9] py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Encabezado */}
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
              Zonas populares
            </h2>
            <p className="mx-auto max-w-xl text-[#6B6560]">
              Explora los destinos mas buscados por nuestros huéspedes y encuentra tu lugar ideal.
            </p>
          </div>

          {/* Grid de zonas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ZONAS_POPULARES.map((zona) => (
              <Link
                key={zona.nombre}
                href={`/propiedades?ubicacion=${encodeURIComponent(zona.nombre)}`}
                className="group relative overflow-hidden rounded-2xl"
              >
                {/* Fondo con gradiente como placeholder de imagen */}
                <div className={`aspect-[4/3] bg-gradient-to-br ${zona.gradient} transition-transform duration-300 group-hover:scale-105`} />

                {/* Overlay con información */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6">
                  <div className="flex items-center gap-1.5 text-white/80">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{zona.propiedades} alojamientos</span>
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-white">{zona.nombre}</h3>
                  <p className="text-sm text-white/80">{zona.descripcion}</p>
                </div>

                {/* Flecha de hover */}
                <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROPIEDADES DESTACADAS ===== */}
      <section className="bg-[#F8F6F3] py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Encabezado */}
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-3 text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
                Propiedades destacadas
              </h2>
              <p className="max-w-xl text-[#6B6560]">
                Los alojamientos mejor calificados por nuestra comunidad de viajeros.
              </p>
            </div>
            <Link
              href="/propiedades"
              className="hidden h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E8E4DF] bg-white px-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3] sm:inline-flex"
            >
              Ver todas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {/* Grid de propiedades */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROPIEDADES_DESTACADAS.map((propiedad) => (
              <PropertyCard key={propiedad.id} propiedad={propiedad} />
            ))}
          </div>

          {/* Botón móvil */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/propiedades"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E8E4DF] bg-white px-2.5 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F8F6F3]"
            >
              Ver todas las propiedades
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="bg-[#FEFCF9] py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Encabezado */}
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
              Cómo funciona
            </h2>
            <p className="mx-auto max-w-xl text-[#6B6560]">
              Reservar tu alojamiento ideal es facilísimo. Solo sigue estos tres pasos.
            </p>
          </div>

          {/* Pasos */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {PASOS.map((paso, indice) => {
              const Icono = paso.icono
              return (
                <div key={paso.titulo} className="relative text-center">
                  {/* Número del paso */}
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D8F3DC]">
                    <Icono className="h-8 w-8 text-[#1B4332]" />
                  </div>

                  {/* Indicador de paso */}
                  <span className="mb-3 inline-block rounded-full bg-[#1B4332] px-3 py-1 text-xs font-semibold text-white">
                    Paso {indice + 1}
                  </span>

                  {/* Contenido */}
                  <h3 className="mb-3 text-xl font-bold text-[#1A1A1A]">
                    {paso.titulo}
                  </h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-[#6B6560]">
                    {paso.descripcion}
                  </p>

                  {/* Línea conectora (solo en desktop) */}
                  {indice < PASOS.length - 1 && (
                    <div className="absolute right-0 top-8 hidden h-px w-[calc(50%-4rem)] translate-x-1/2 bg-[#E8E4DF] md:block" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Comienza tu aventura en Venezuela
          </h2>
          <p className="mb-8 text-lg text-white/80">
            Miles de alojamientos te esperan. Encuentra el tuyo y reserva en minutos.
          </p>
          <Link
            href="/propiedades"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#E76F51] px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-[#D45D3E]"
          >
            Explorar alojamientos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
