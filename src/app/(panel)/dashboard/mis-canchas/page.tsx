import Link from 'next/link'
import { Plus, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getMisPropiedades } from '@/actions/propiedad.actions'
import { CanchaListClient } from './cancha-list-client'

export default async function MisCanchasPage() {
  const todas = await getMisPropiedades()
  const canchas = todas.filter((p) => (p as unknown as Record<string, unknown>).categoria === 'DEPORTE')
  const hayCanchas = canchas.length > 0

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mis canchas</h1>
            <p className="text-sm text-white/70">Administra y publica tus canchas deportivas</p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <Link href="/dashboard/mis-canchas/nueva">
              <Button className="gap-2 bg-white text-[#1B4332] hover:bg-[#D8F3DC]">
                <Plus className="h-4 w-4" />
                Nueva cancha
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="block sm:hidden">
        <Link href="/dashboard/mis-canchas/nueva">
          <Button className="w-full gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
            <Plus className="h-4 w-4" />
            Nueva cancha
          </Button>
        </Link>
      </div>

      {!hayCanchas && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Trophy className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              Aún no tienes canchas
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Publica tu primera cancha deportiva y comienza a recibir reservas por hora.
            </p>
            <Link href="/dashboard/mis-canchas/nueva">
              <Button className="mt-6 gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                <Plus className="h-4 w-4" />
                Publica tu primera cancha
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {hayCanchas && (
        <CanchaListClient canchas={canchas as unknown as Record<string, unknown>[]} />
      )}
    </div>
  )
}
