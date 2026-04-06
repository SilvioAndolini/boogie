// Página de Zonas - Listado de estados/regiones de Venezuela
import Link from 'next/link'
import { MapPin, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ESTADOS_VENEZUELA } from '@/lib/constants'

// Función para generar un slug a partir del nombre del estado
function generarSlug(estado: string): string {
  return estado
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

// Mapa de conteos de propiedades (placeholder)
const CONTEOS_PROPIEDADES: Record<string, number> = {}
ESTADOS_VENEZUELA.forEach((estado) => {
  CONTEOS_PROPIEDADES[estado] = 0
})

// Colores para los gradientes de cada zona
const COLORES_ZONA = [
  'from-[#1B4332] to-[#2D6A4F]',
  'from-[#E76F51] to-[#F4A261]',
  'from-[#2D6A4F] to-[#52B788]',
  'from-[#52B788] to-[#D8F3DC]',
  'from-[#F4A261] to-[#E76F51]',
  'from-[#1B4332] to-[#52B788]',
]

export default function ZonasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <div className="mb-12 text-center">
        <h1 className="mb-3 text-3xl font-bold text-[#1A1A1A] sm:text-4xl">
          Explora Venezuela
        </h1>
        <p className="mx-auto max-w-xl text-[#6B6560]">
          Descubre alojamientos en los destinos más impresionantes del país.
        </p>
      </div>

      {/* Grid de estados/zonas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ESTADOS_VENEZUELA.map((estado, indice) => {
          const slug = generarSlug(estado)
          const cantidad = CONTEOS_PROPIEDADES[estado] ?? 0

          return (
            <Link
              key={estado}
              href={`/zonas/${slug}`}
              className="group relative overflow-hidden rounded-xl"
            >
              {/* Gradiente decorativo */}
              <div
                className={`aspect-[4/3] bg-gradient-to-br ${COLORES_ZONA[indice % COLORES_ZONA.length]} transition-transform duration-300 group-hover:scale-105`}
              />
              {/* Overlay con información */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4">
                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs">Explorar</span>
                </div>
                <h3 className="mt-0.5 text-base font-bold text-white">{estado}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-white/70">
                  <Home className="h-3 w-3" />
                  <span>
                    {cantidad} {cantidad === 1 ? 'propiedad' : 'propiedades'}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
