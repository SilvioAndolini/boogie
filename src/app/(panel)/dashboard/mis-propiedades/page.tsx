// Página de Mis Propiedades - Listado de propiedades del usuario
import Link from 'next/link'
import { Plus, Home, MapPin, MoreVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Datos de ejemplo para ilustrar la interfaz
const propiedadesEjemplo: Array<{
  id: string
  titulo: string
  ciudad: string
  estado: string
  estadoPublicacion: 'BORRADOR' | 'PUBLICADA' | 'PAUSADA'
  precioPorNoche: number
  moneda: 'USD' | 'VES'
}> = []

// Mapa de colores y etiquetas para los estados de publicación
const ESTADO_PUBLICACION_CONFIG: Record<string, { etiqueta: string; className: string }> = {
  BORRADOR: {
    etiqueta: 'Borrador',
    className: 'bg-[#F8F6F3] text-[#6B6560]',
  },
  PUBLICADA: {
    etiqueta: 'Publicada',
    className: 'bg-[#D8F3DC] text-[#1B4332]',
  },
  PAUSADA: {
    etiqueta: 'Pausada',
    className: 'bg-[#FEF3C7] text-[#92400E]',
  },
}

// Formatear precio según moneda
function formatearPrecio(precio: number, moneda: 'USD' | 'VES'): string {
  if (moneda === 'USD') {
    return `$${precio.toLocaleString('en-US')}`
  }
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export default function MisPropiedadesPage() {
  const hayPropiedades = propiedadesEjemplo.length > 0

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis propiedades</h1>
          <p className="text-sm text-[#6B6560]">
            Administra y publica tus propiedades
          </p>
        </div>
        <Link href="/dashboard/mis-propiedades/nueva">
          <Button className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            <Plus className="mr-1 h-4 w-4" />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {/* Estado vacío */}
      {!hayPropiedades && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Home className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Aún no tienes propiedades
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Publica tu primera propiedad y comienza a recibir reservas de
              huéspedes en Venezuela.
            </p>
            <Link href="/dashboard/mis-propiedades/nueva">
              <Button className="mt-6 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                <Plus className="mr-1 h-4 w-4" />
                Publica tu primera propiedad
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid de propiedades */}
      {hayPropiedades && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {propiedadesEjemplo.map((propiedad) => {
            const config = ESTADO_PUBLICACION_CONFIG[propiedad.estadoPublicacion]
            return (
              <Card key={propiedad.id} className="border-[#E8E4DF] transition-shadow hover:shadow-md">
                {/* Imagen placeholder */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-5xl font-bold text-[#1B4332]/20">B</span>
                  </div>
                  {/* Badge de estado */}
                  <div className="absolute left-3 top-3">
                    <Badge className={config.className}>
                      {config.etiqueta}
                    </Badge>
                  </div>
                  {/* Menú contextual */}
                  <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B6560] backdrop-blur-sm hover:bg-white">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                {/* Información */}
                <CardContent className="space-y-2 pt-3">
                  <h3 className="line-clamp-1 font-semibold text-[#1A1A1A]">
                    {propiedad.titulo}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-[#6B6560]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">
                      {propiedad.ciudad}, {propiedad.estado}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-bold text-[#1B4332]">
                      {formatearPrecio(propiedad.precioPorNoche, propiedad.moneda)}
                    </span>
                    <span className="text-xs text-[#9E9892]">por noche</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
