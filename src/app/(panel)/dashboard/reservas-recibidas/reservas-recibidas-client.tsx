'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  Inbox,
  Home,
  CalendarDays,
  Check,
  X,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { confirmarReservaAction, rechazarReservaAction } from '@/actions/reserva.actions'
import type { ReservaConPropiedad } from '@/types/reserva'
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_COLORS } from '@/types/reserva'
import { formatFechaCorta, formatPrecio } from '@/lib/format'

type Pestana = 'pendientes' | 'confirmadas' | 'completadas' | 'canceladas'

const PESTANAS: { key: Pestana; etiqueta: string; icono: React.ElementType }[] = [
  { key: 'pendientes', etiqueta: 'Pendientes', icono: Clock },
  { key: 'confirmadas', etiqueta: 'Confirmadas', icono: CheckCircle2 },
  { key: 'completadas', etiqueta: 'Completadas', icono: CheckCircle2 },
  { key: 'canceladas', etiqueta: 'Canceladas', icono: XCircle },
]

function SubmitButton({ variant }: { variant: 'confirmar' | 'rechazar' }) {
  const { pending } = useFormStatus()
  if (variant === 'confirmar') {
    return (
      <Button
        size="sm"
        className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
        disabled={pending}
      >
        {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
        Confirmar
      </Button>
    )
  }
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2]"
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <X className="mr-1 h-3.5 w-3.5" />}
      Rechazar
    </Button>
  )
}

function ReservaRecibidaCard({ reserva }: { reserva: ReservaConPropiedad }) {
  const esPendiente = reserva.estado === 'PENDIENTE' || reserva.estado === 'PENDIENTE_CONFIRMACION'
  const puedeConfirmar = reserva.estado === 'PENDIENTE_CONFIRMACION'

  return (
    <Card className="border-[#E8E4DF] transition-all hover:border-[#52B788]/50 hover:shadow-md">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]">
            <Home className="h-5 w-5 text-[#1B4332]" />
          </div>

          <div className="min-w-0 flex-1">
            {reserva.huesped && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D8F3DC] text-[10px] font-bold text-[#1B4332]">
                  {reserva.huesped.nombre.charAt(0)}{reserva.huesped.apellido.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  {reserva.huesped.nombre} {reserva.huesped.apellido}
                </span>
              </div>
            )}
            <p className="mt-0.5 text-sm text-[#1A1A1A]">{reserva.propiedad.titulo}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#6B6560]">
              <CalendarDays className="h-3 w-3" />
              {formatFechaCorta(reserva.fechaEntrada)} — {formatFechaCorta(reserva.fechaSalida)}
            </div>
            <p className="text-[10px] text-[#9E9892]">
              {reserva.cantidadHuespedes} huésped{reserva.cantidadHuespedes > 1 ? 's' : ''} · {reserva.noches} noche{reserva.noches > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge className={ESTADO_RESERVA_COLORS[reserva.estado] ?? 'bg-[#F8F6F3] text-[#6B6560]'}>
              {ESTADO_RESERVA_LABELS[reserva.estado] ?? reserva.estado}
            </Badge>
            <span className="text-sm font-bold text-[#1B4332]">
              {formatPrecio(Number(reserva.total), reserva.moneda)}
            </span>
            {esPendiente && (
              <div className="flex flex-col items-end gap-2">
                {reserva.estado === 'PENDIENTE_PAGO' && (
                  <span className="text-[10px] font-medium text-[#C2410C]">Esperando pago del huesped</span>
                )}
                {reserva.estado === 'PENDIENTE' && (
                  <span className="text-[10px] font-medium text-[#92400E]">Esperando pago del huesped</span>
                )}
                {puedeConfirmar && (
                  <div className="flex gap-2">
                    <form action={confirmarReservaAction}>
                      <input type="hidden" name="reservaId" value={reserva.id} />
                      <SubmitButton variant="confirmar" />
                    </form>
                    <form action={rechazarReservaAction}>
                      <input type="hidden" name="reservaId" value={reserva.id} />
                      <SubmitButton variant="rechazar" />
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReservasRecibidasClient({ reservas }: { reservas: ReservaConPropiedad[] }) {
  const [activa, setActiva] = useState<Pestana>('pendientes')

  const pendientes = reservas.filter(r => r.estado === 'PENDIENTE' || r.estado === 'PENDIENTE_CONFIRMACION')
  const confirmadas = reservas.filter(r => r.estado === 'CONFIRMADA' || r.estado === 'EN_CURSO')
  const completadas = reservas.filter(r => r.estado === 'COMPLETADA')
  const canceladas = reservas.filter(r => ['CANCELADA_HUESPED', 'CANCELADA_ANFITRION', 'RECHAZADA'].includes(r.estado))

  const grupos: Record<Pestana, ReservaConPropiedad[]> = { pendientes, confirmadas, completadas, canceladas }
  const reservasActuales = grupos[activa]
  const pestanaActual = PESTANAS.find(p => p.key === activa)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-20 h-20 w-20 rounded-full bg-white/[0.03]" />
        <div className="relative flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Inbox className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Reservas recibidas</h1>
            <p className="text-sm text-white/70">Gestiona las reservas que reciben tus propiedades</p>
          </div>
        </div>
      </div>

      {reservas.length === 0 ? (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#F8F6F3]">
              <Inbox className="h-8 w-8 text-[#9E9892]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">No tienes reservas recibidas</h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Cuando tus Boogies reciban solicitudes de reserva, aparecerán aquí para que puedas confirmarlas o rechazarlas.
            </p>
            <Link href="/dashboard/mis-propiedades/nueva">
              <Button className="mt-6 gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                Publicar boogie
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto border-b border-[#E8E4DF] pb-0">
            {PESTANAS.map((p) => {
              const cantidad = grupos[p.key].length
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
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      esActiva ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-[#F8F6F3] text-[#6B6560]'
                    }`}>
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
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F6F3]">
                  <Inbox className="h-6 w-6 text-[#9E9892]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">
                  No hay reservas {pestanaActual?.etiqueta.toLowerCase()}
                </h3>
                <p className="mt-1 text-xs text-[#9E9892]">
                  Las reservas {pestanaActual?.etiqueta.toLowerCase()} aparecerán aquí
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reservasActuales.map((reserva) => (
                <ReservaRecibidaCard key={reserva.id} reserva={reserva} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
