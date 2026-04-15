import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Home } from 'lucide-react'
import { ZONAS } from '@/lib/zonas'

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
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ZONAS.map((zona) => {
          const ZIcon = zona.Icon
          return (
            <Link
              key={zona.slug}
              href={`/zonas/${zona.slug}`}
              className="group relative aspect-[16/9] overflow-hidden rounded-xl"
            >
              <Image
                src={zona.imagen}
                alt={zona.nombre}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5">
                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs">Explorar</span>
                </div>
                <h3 className="mt-1 text-xl font-bold text-white">{zona.nombre}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-white/70">
                  <Home className="h-3 w-3" />
                  <span>{zona.estado}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
