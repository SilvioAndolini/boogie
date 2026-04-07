'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import type { ReservaConPropiedad } from '@/types/reserva'
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_COLORS } from '@/types/reserva'
import { formatFechaCorta, formatPrecio } from '@/lib/format'
import { sePuedeCancelar } from '@/lib/reservas/estados'
import { cancelarReservaAction } from '@/actions/reserva.actions'
import { calcularReembolsoCompleto } from '@/lib/reservas/calculos'
import { POLITICAS_CANCELACION } from '@/lib/constants'
import type { PoliticaCancelacion } from '@/types'
import { useFormStatus } from 'react-dom'

function CancelSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      size="sm"
      className="bg-[#C1121F] text-white hover:bg-[#A0001A]"
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
      Sí, cancelar
    </Button>
  )
}

function CancelarDialog({
  reserva,
  open,
  onOpenChange,
}: {
  reserva: ReservaConPropiedad
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const esConfirmada = reserva.estado === 'CONFIRMADA'
  const politica = reserva.propiedad.politicaCancelacion ?? 'MODERADA'

  let reembolsoInfo = ''
  if (esConfirmada) {
    const calc = calcularReembolsoCompleto(
      Number(reserva.total),
      Number(reserva.comisionPlataforma),
      politica,
      new Date(reserva.fechaEntrada)
    )
    reembolsoInfo = calc.mensaje
  }

  const politicaLabel = POLITICAS_CANCELACION[politica]?.nombre ?? politica

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar reserva</DialogTitle>
          <DialogDescription>
            Estás cancelando tu reserva para &quot;{reserva.propiedad.titulo}&quot; del{' '}
            {formatFechaCorta(reserva.fechaEntrada)} al {formatFechaCorta(reserva.fechaSalida)}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-[#E8E4DF] bg-[#F8F6F3] p-3">
            <p className="text-xs font-medium text-[#1A1A1A]">
              Política de cancelación: {politicaLabel}
            </p>
            <p className="text-xs text-[#6B6560]">
              {POLITICAS_CANCELACION[politica]?.descripcion}
            </p>
          </div>

          {esConfirmada && reembolsoInfo && (
            <div className="rounded-lg border border-[#D8F3DC] bg-[#F0FFF4] p-3">
              <p className="text-xs font-medium text-[#1B4332]">{reembolsoInfo}</p>
            </div>
          )}

          <p className="text-xs text-[#9E9892]">
            Se notificará al anfitrión sobre la cancelación.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="border-[#E8E4DF] text-[#6B6560]">
              Mantener reserva
            </Button>
          </DialogClose>
          <form action={cancelarReservaAction}>
            <input type="hidden" name="reservaId" value={reserva.id} />
            <CancelSubmitButton />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Pestana = 'proximas' | 'en_curso' | 'completadas' | 'canceladas'

const PESTANAS: { key: Pestana; etiqueta: string; icono: React.ElementType }[] = [
  { key: 'proximas', etiqueta: 'Próximas', icono: Clock },
  { key: 'en_curso', etiqueta: 'En curso', icono: AlertCircle },
  { key: 'completadas', etiqueta: 'Completadas', icono: CheckCircle2 },
  { key: 'canceladas', etiqueta: 'Canceladas', icono: XCircle },
]

function ReservaCard({ reserva }: { reserva: ReservaConPropiedad }) {
  const esCancelable = sePuedeCancelar(reserva.estado)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Card className="border-[#E8E4DF] transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
            <Home className="h-6 w-6 text-[#1B4332]/30" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold text-[#1A1A1A]">
              {reserva.propiedad.titulo}
            </h4>
            <p className="text-xs text-[#6B6560]">
              {formatFechaCorta(reserva.fechaEntrada)} — {formatFechaCorta(reserva.fechaSalida)}
            </p>
            <p className="text-xs text-[#9E9892]">
              {reserva.noches} noche{reserva.noches !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge className={ESTADO_RESERVA_COLORS[reserva.estado] ?? 'bg-[#F8F6F3] text-[#6B6560]'}>
              {ESTADO_RESERVA_LABELS[reserva.estado] ?? reserva.estado}
            </Badge>
            <span className="text-sm font-bold text-[#1B4332]">
              {formatPrecio(Number(reserva.total), reserva.moneda)}
            </span>
            {esCancelable && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2]"
                onClick={() => setDialogOpen(true)}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {esCancelable && (
        <CancelarDialog
          reserva={reserva}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  )
}

export interface MisReservasClientProps {
  reservas: {
    proximas: ReservaConPropiedad[]
    en_curso: ReservaConPropiedad[]
    completadas: ReservaConPropiedad[]
    canceladas: ReservaConPropiedad[]
  }
}

export function MisReservasClient({ reservas }: MisReservasClientProps) {
  const [activa, setActiva] = useState<Pestana>('proximas')
  const pestanaActual = PESTANAS.find((p) => p.key === activa)
  const reservasActuales = reservas[activa]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis reservas</h1>
        <p className="text-sm text-[#6B6560]">Consulta y gestiona todas tus reservas</p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#E8E4DF] pb-0">
        {PESTANAS.map((p) => {
          const cantidad = reservas[p.key].length
          const Icono = p.icono
          const esActiva = activa === p.key
          return (
            <button
              key={p.key}
              onClick={() => setActiva(p.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                esActiva
                  ? 'border-[#1B4332] text-[#1B4332]'
                  : 'border-transparent text-[#6B6560] hover:text-[#1B4332]'
              }`}
            >
              <Icono className="h-4 w-4" />
              {p.etiqueta}
              {cantidad > 0 && (
                <span className="rounded-full bg-[#F8F6F3] px-2 py-0.5 text-xs text-[#6B6560]">
                  {cantidad}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {reservasActuales.length === 0 ? (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F3]">
              <CalendarDays className="h-6 w-6 text-[#9E9892]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              No hay reservas {pestanaActual?.etiqueta.toLowerCase()}
            </h3>
            <p className="mt-1 text-xs text-[#9E9892]">
              Las reservas {pestanaActual?.etiqueta.toLowerCase()} aparecerán aquí
            </p>
            {activa === 'proximas' && (
              <Link href="/propiedades">
                <Button variant="outline" className="mt-4 border-[#E8E4DF] text-[#1B4332] hover:bg-[#D8F3DC]">
                  <Home className="mr-1 h-4 w-4" />
                  Explorar Boogies
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reservasActuales.map((reserva) => (
            <ReservaCard key={reserva.id} reserva={reserva} />
          ))}
        </div>
      )}
    </div>
  )
}
