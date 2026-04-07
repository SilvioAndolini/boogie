// Página de Zonas - Listado de estados/regiones de Venezuela
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Home, Clock } from 'lucide-react'

interface ZonaActiva {
  estado: string
  slug: string
  imagen: string
}

const ZONAS_ACTIVAS: ZonaActiva[] = [
  { 
    estado: 'Distrito Capital', 
    slug: 'distrito-capital', 
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031165.jpg'
  },
  { 
    estado: 'Vargas', 
    slug: 'vargas', 
    imagen: 'https://images.freejpg.com.ar/400/2804/city-of-caracas-in-venezuela-F100031541.jpg'
  },
]

const PROXIMAMENTE = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Falcón',
  'Guárico',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Yaracuy',
  'Zulia',
]

const COLORES_ZONA = [
  'from-[#1B4332] to-[#2D6A4F]',
  'from-[#52B788] to-[#D8F3DC]',
]

export default function ZonasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
          Explora Venezuela
        </h1>
        <p className="mx-auto max-w-xl text-[#6B6560]">
          Descubre alojamientos en los destinos más impresionantes del país.
        </p>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-[#1A1A1A]">Zonas disponibles</h2>
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ZONAS_ACTIVAS.map((zona, indice) => (
          <Link
            key={zona.estado}
            href={`/zonas/${zona.slug}`}
            className="group relative aspect-[16/9] overflow-hidden rounded-xl"
          >
            <Image
              src={zona.imagen}
              alt={zona.estado}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5">
              <div className="flex items-center gap-1.5 text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs">Explorar</span>
              </div>
              <h3 className="mt-1 text-xl font-bold text-white">{zona.estado}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-white/70">
                <Home className="h-3 w-3" />
                <span>Ver propiedades</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-[#1B4332]" />
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Próximamente disponible</h2>
      </div>
      <p className="mb-8 text-center text-[#6B6560]">
        Estamos trabajando para traerte más destinos en Venezuela
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {PROXIMAMENTE.map((estado) => (
          <div
            key={estado}
            className="flex items-center justify-center rounded-lg border border-dashed border-[#D0CBC4] bg-[#F8F6F3]/50 px-3 py-3 text-center"
          >
            <span className="text-sm text-[#6B6560]">{estado}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
