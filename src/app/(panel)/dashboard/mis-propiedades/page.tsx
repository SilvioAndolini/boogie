import Link from 'next/link'
import { Plus, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMisPropiedades } from '@/actions/propiedad.actions'
import BoogieCard from './boogie-card'

export default async function MisPropiedadesPage() {
  const propiedades = await getMisPropiedades()
  const hayPropiedades = propiedades.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis boogies</h1>
          <p className="text-sm text-[#6B6560]">
            Administra y publica tus boogies
          </p>
        </div>
        <Link href="/dashboard/mis-propiedades/nueva">
          <Button className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            <Plus className="mr-1 h-4 w-4" />
            Nuevo boogie
          </Button>
        </Link>
      </div>

      {!hayPropiedades && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Home className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Aún no tienes boogies
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Publica tu primer boogie y comienza a recibir reservas de
              huéspedes en Venezuela.
            </p>
            <Link href="/dashboard/mis-propiedades/nueva">
              <Button className="mt-6 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                <Plus className="mr-1 h-4 w-4" />
                Publica tu primer boogie
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {hayPropiedades && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {propiedades.map((propiedad: Record<string, unknown>) => (
            <BoogieCard key={propiedad.id as string} boogie={propiedad} />
          ))}
        </div>
      )}
    </div>
  )
}
