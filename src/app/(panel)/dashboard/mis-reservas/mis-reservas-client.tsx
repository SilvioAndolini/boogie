'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Shield,
  Receipt,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ReservaConPropiedad } from '@/types/reserva'
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_COLORS } from '@/types/reserva'
import { formatFechaCorta, formatPrecio } from '@/lib/format'
import { sePuedeCancelar } from '@/lib/reservas/estados'
import { cancelarReserva } from '@/actions/reserva.actions'
import { calcularReembolsoCompleto } from '@/lib/reservas/calculos'
import type { ReembolsoCalculado } from '@/types/reserva'
import { POLITICAS_CANCELACION } from '@/lib/constants'

type Pestana = 'proximas' | 'en_curso' | 'completadas' | 'canceladas'

const PESTANAS: { key: Pestana; etiqueta: string; icono: React.ElementType }[] = [
  { key: 'proximas', etiqueta: 'Próximas', icono: Clock },
  { key: 'en_curso', etiqueta: 'En curso', icono: AlertCircle },
  { key: 'completadas', etiqueta: 'Completadas', icono: CheckCircle2 },
  { key: 'canceladas', etiqueta: 'Canceladas', icono: XCircle },
]

function ReservaCard({ reserva, onCancelar }: { reserva: ReservaConPropiedad; onCancelar: (id: string) => void }) {
  const router = useRouter()
  const esCancelable = sePuedeCancelar(reserva.estado)
  const [expandido, setExpandido] = useState(false)
  const [pending, startTransition] = useTransition()
  const [reembolso, setReembolso] = useState<ReembolsoCalculado | null>(null)

  const handleCancelar = () => {
    startTransition(async () => {
      const result = await cancelarReserva(reserva.id)
      if (result.exito) {
        toast.success('Reserva cancelada')
        onCancelar(reserva.id)
      } else if (result.error) {
        toast.error(result.error.mensaje)
      }
    })
  }

  const esConfirmada = reserva.estado === 'CONFIRMADA'
  const politica = reserva.propiedad.politicaCancelacion ?? 'MODERADA'
  const politicaInfo = POLITICAS_CANCELACION[politica]

  useEffect(() => {
    if (!esCancelable && !esConfirmada) return
    calcularReembolsoCompleto(
      Number(reserva.total),
      Number(reserva.comisionPlataforma),
      politica,
      new Date(reserva.fechaEntrada)
    ).then(setReembolso)
  }, [reserva.total, reserva.comisionPlataforma, politica, reserva.fechaEntrada, esCancelable, esConfirmada])

  return (
    <div
      onClick={() => router.push(`/dashboard/mis-reservas/${reserva.id}`)}
      className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden transition-all hover:border-[#52B788]/50 hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D8F3DC]">
          <Home className="h-5 w-5 text-[#1B4332]" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-[#1A1A1A]">
            {reserva.propiedad.titulo}
          </h4>
          <p className="text-xs text-[#6B6560]">
            {formatFechaCorta(reserva.fechaEntrada)} — {formatFechaCorta(reserva.fechaSalida)}
          </p>
          <p className="text-[10px] text-[#9E9892]">
            {reserva.noches} noche{reserva.noches !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge className={ESTADO_RESERVA_COLORS[reserva.estado] ?? 'bg-[#F8F6F3] text-[#6B6560]'}>
            {reserva.estado === 'CONFIRMADA' ? 'Reserva confirmada' : ESTADO_RESERVA_LABELS[reserva.estado] ?? reserva.estado}
          </Badge>
          {reserva.estado !== 'CONFIRMADA' && reserva.estado !== 'COMPLETADA' && reserva.estado !== 'EN_CURSO' && (
            <div className="flex flex-col items-end gap-0.5 mt-0.5">
              {(!reserva.estadoPago || reserva.estadoPago === 'PENDIENTE') && (
                <span className="text-[10px] font-medium text-[#C2410C] flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Esperando pago
                </span>
              )}
              {reserva.estadoPago && ['VERIFICADO', 'ACREDITADO'].includes(reserva.estadoPago) && reserva.estado === 'PENDIENTE_CONFIRMACION' && (
                <span className="text-[10px] font-medium text-[#B45309] flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Esperando confirmacion del anfitrion
                </span>
              )}
              {reserva.estadoPago && ['VERIFICADO', 'ACREDITADO'].includes(reserva.estadoPago) && reserva.estado !== 'PENDIENTE_CONFIRMACION' && (
                <span className="text-[10px] font-medium text-[#1B4332] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Pago confirmado
                </span>
              )}
            </div>
          )}
          <span className="text-sm font-bold text-[#1B4332]">
            {formatPrecio(Number(reserva.total), reserva.moneda)}
          </span>
          {esCancelable && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpandido(!expandido) }}
              className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[#C1121F] hover:text-[#A0001A] transition-colors"
            >
              <XCircle className="h-3 w-3" />
              Cancelar
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#9E9892]" />
      </div>

      <AnimatePresence>
        {expandido && esCancelable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#E8E4DF] px-5 py-4 space-y-3" onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center gap-2 text-xs text-[#9E9892]">
                <CalendarDays className="h-3 w-3 shrink-0" />
                <span>{formatFechaCorta(reserva.fechaEntrada)} → {formatFechaCorta(reserva.fechaSalida)}</span>
                <span className="text-[#E8E4DF]">·</span>
                <span>{reserva.noches} noche{reserva.noches !== 1 ? 's' : ''}</span>
              </div>

              <div className="rounded-xl border border-[#E8E4DF] bg-[#FDFCFA] p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                  <span className="text-xs font-semibold text-[#1A1A1A]">
                    Política: {politicaInfo?.nombre ?? politica}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6560] leading-relaxed pl-5.5">
                  {politicaInfo?.descripcion}
                </p>
              </div>

              {esConfirmada && reembolso && (
                <div className={`rounded-xl border p-3.5 ${
                  reembolso.porcentajeReembolso === 100
                    ? 'border-[#D8F3DC] bg-[#F0FFF4]'
                    : reembolso.porcentajeReembolso > 0
                      ? 'border-[#FEF3C7] bg-[#FFFBEB]'
                      : 'border-[#FEE2E2] bg-[#FEF2F2]'
                }`}>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Receipt className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                    <span className="text-[#9E9892]">Total pagado</span>
                    <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                    <span className="font-medium text-[#1A1A1A]">{formatPrecio(Number(reserva.total), reserva.moneda)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm mt-1.5">
                    <Receipt className="h-3.5 w-3.5 shrink-0 transparent" />
                    <span className={`text-xs ${
                      reembolso.porcentajeReembolso === 100
                        ? 'text-[#1B4332]'
                        : reembolso.porcentajeReembolso > 0
                          ? 'text-[#92400E]'
                          : 'text-[#C1121F]'
                    }`}>
                      {reembolso.mensaje}
                    </span>
                  </div>
                </div>
              )}

              {esConfirmada && reembolso && reembolso.porcentajeReembolso === 0 && (
                <p className="text-[10px] text-[#C1121F]/70 text-center">
                  Al cancelar ahora no recibirás reembolso según la política {politicaInfo?.nombre}.
                </p>
              )}

              <p className="text-[10px] text-[#9E9892] text-center">
                Se notificará al anfitrión sobre la cancelación.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setExpandido(false)}
                  className="flex-1 flex h-9 items-center justify-center rounded-xl border border-[#E8E4DF] text-xs font-medium text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
                >
                  Mantener reserva
                </button>
                <button
                  disabled={pending}
                  onClick={handleCancelar}
                  className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#C1121F] text-xs font-medium text-white transition-all hover:bg-[#A0001A] disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Cancelar reserva
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [lista, setLista] = useState(reservas)
  const pestanaActual = PESTANAS.find((p) => p.key === activa)
  const reservasActuales = lista[activa]

  const handleCancelar = (id: string) => {
    setLista((prev) => ({
      ...prev,
      proximas: prev.proximas.filter((r) => r.id !== id),
      en_curso: prev.en_curso.filter((r) => r.id !== id),
      canceladas: [
        ...prev.canceladas,
        ...(prev.proximas.find((r) => r.id === id) || prev.en_curso.find((r) => r.id === id)
          ? [{ ...(prev.proximas.find((r) => r.id === id) || prev.en_curso.find((r) => r.id === id)!), estado: 'CANCELADA_HUESPED' as const }]
          : []),
      ],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-20 h-20 w-20 rounded-full bg-white/[0.03]" />
        <div className="relative flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mis reservas</h1>
            <p className="text-sm text-white/70">Consulta y gestiona todas tus reservas</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[#E8E4DF] pb-0">
        {PESTANAS.map((p) => {
          const cantidad = lista[p.key].length
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
            <ReservaCard key={reserva.id} reserva={reserva} onCancelar={handleCancelar} />
          ))}
        </div>
      )}
    </div>
  )
}
