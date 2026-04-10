import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, CalendarDays, Clock, Home, Users, Receipt, Shield,
  CheckCircle2, XCircle, CreditCard, Package, ConciergeBell, MapPin,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getReservaPorId, getReservaStoreItems } from '@/actions/reserva.actions'
import { formatFecha, formatFechaCorta, formatPrecio } from '@/lib/format'
import { ESTADO_RESERVA_LABELS, ESTADO_RESERVA_COLORS, ESTADO_PAGO_LABELS } from '@/types/reserva'
import { POLITICAS_CANCELACION, METODOS_PAGO } from '@/lib/constants'
import type { EstadoPago } from '@/types'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function ReservaDetallePage({ params }: Props) {
  const { id } = await params
  const reserva = await getReservaPorId(id)

  if (!reserva) {
    console.error('[ReservaDetallePage] No se encontro la reserva:', id)
    notFound()
  }

  const storeItems = await getReservaStoreItems(id)
  const politicaKey = reserva.propiedad.politicaCancelacion as keyof typeof POLITICAS_CANCELACION
  const politica = POLITICAS_CANCELACION[politicaKey]
  const storeTotal = storeItems.reduce((sum: number, item: Record<string, unknown>) => sum + Number(item.subtotal), 0)

  return (
    <div className="space-y-4">

      <div>
        <Link
          href="/dashboard/mis-reservas"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[#9E9892] transition-colors hover:bg-[#F4F1EC] hover:text-[#1B4332]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Mis reservas
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-white">{reserva.codigo}</h1>
                <p className="text-[11px] text-white/60 truncate">{reserva.propiedad.titulo}</p>
              </div>
            </div>
            <Badge className={`${ESTADO_RESERVA_COLORS[reserva.estado] ?? 'bg-white/20 text-white'} text-[10px]`}>
              {ESTADO_RESERVA_LABELS[reserva.estado] ?? reserva.estado}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
              <p className="text-[8px] uppercase tracking-wider text-white/40">Check-in</p>
              <p className="text-[11px] font-semibold text-white">{formatFechaCorta(reserva.fechaEntrada)}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
              <p className="text-[8px] uppercase tracking-wider text-white/40">Check-out</p>
              <p className="text-[11px] font-semibold text-white">{formatFechaCorta(reserva.fechaSalida)}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
              <p className="text-[8px] uppercase tracking-wider text-white/40">Duracion</p>
              <p className="text-[11px] font-semibold text-white">{reserva.noches} noches</p>
            </div>
            <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
              <p className="text-[8px] uppercase tracking-wider text-white/40">Huespedes</p>
              <p className="text-[11px] font-semibold text-white">{reserva.cantidadHuespedes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E4DF] bg-white divide-y divide-[#E8E4DF]">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#D8F3DC]">
            <Clock className="h-2.5 w-2.5 text-[#1B4332]" />
          </div>
          <span className="text-[11px] font-bold text-[#1A1A1A]">Fechas</span>
        </div>
        <div className="px-4 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9E9892]">Emitida</span>
            <span className="font-medium text-[#1A1A1A]">{formatFecha(reserva.fechaCreacion)}</span>
          </div>
          {reserva.fechaConfirmacion && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Confirmada</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#52B788]" />
                <span className="font-medium text-[#1B4332]">{formatFecha(reserva.fechaConfirmacion)}</span>
              </div>
            </div>
          )}
          {reserva.fechaCancelacion && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Cancelada</span>
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-[#C1121F]" />
                <span className="font-medium text-[#C1121F]">{formatFecha(reserva.fechaCancelacion)}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9E9892]">Politica</span>
            <span className="font-medium text-[#1A1A1A]">{politica?.nombre ?? reserva.propiedad.politicaCancelacion}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E8E4DF] bg-white divide-y divide-[#E8E4DF]">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#D8F3DC]">
            <Receipt className="h-2.5 w-2.5 text-[#1B4332]" />
          </div>
          <span className="text-[11px] font-bold text-[#1A1A1A]">Desglose</span>
        </div>
        <div className="px-4 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9E9892]">{formatPrecio(Number(reserva.precioPorNoche), reserva.moneda)} x {reserva.noches} noches</span>
            <span className="font-medium text-[#1A1A1A]">{formatPrecio(Number(reserva.subtotal), reserva.moneda)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9E9892]">Comision</span>
            <span className="font-medium text-[#1A1A1A]">{formatPrecio(Number(reserva.comisionPlataforma), reserva.moneda)}</span>
          </div>
          {storeItems.length > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Boogie Store</span>
              <span className="font-medium text-[#1A1A1A]">{formatPrecio(storeTotal, reserva.moneda)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1.5 border-t border-[#E8E4DF]">
            <span className="text-[11px] font-bold text-[#1A1A1A]">Total</span>
            <span className="text-sm font-bold text-[#1B4332]">{formatPrecio(Number(reserva.total) + storeTotal, reserva.moneda)}</span>
          </div>
        </div>
      </div>

      {reserva.pago && (
        <div className="rounded-xl border border-[#E8E4DF] bg-white divide-y divide-[#E8E4DF]">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#D8F3DC]">
              <CreditCard className="h-2.5 w-2.5 text-[#1B4332]" />
            </div>
            <span className="text-[11px] font-bold text-[#1A1A1A]">Pago</span>
          </div>
          <div className="px-4 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Metodo</span>
              <span className="font-medium text-[#1A1A1A]">{METODOS_PAGO[reserva.pago.metodoPago as keyof typeof METODOS_PAGO] ?? reserva.pago.metodoPago}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Referencia</span>
              <span className="font-medium text-[#1A1A1A]">{reserva.pago.referencia ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Estado</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{ESTADO_PAGO_LABELS[reserva.pago.estado as EstadoPago] ?? reserva.pago.estado}</Badge>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#9E9892]">Fecha</span>
              <span className="font-medium text-[#1A1A1A]">{formatFecha(reserva.pago.fechaCreacion)}</span>
            </div>
          </div>
        </div>
      )}

      {storeItems.length > 0 && (
        <div className="rounded-xl border border-[#E8E4DF] bg-white divide-y divide-[#E8E4DF]">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#D8F3DC]">
              <Package className="h-2.5 w-2.5 text-[#1B4332]" />
            </div>
            <span className="text-[11px] font-bold text-[#1A1A1A]">Boogie Store</span>
            <span className="rounded bg-[#F4F1EC] px-1.5 py-0.5 text-[9px] font-semibold text-[#6B6560]">{storeItems.length}</span>
          </div>
          <div className="divide-y divide-[#F4F1EC]">
            {storeItems.map((item: Record<string, unknown>) => {
              const tipo = item.tipo_item as string
              const esServicio = tipo === 'servicio'
              const productoData = item.producto as Record<string, unknown> | null
              const servicioData = item.servicio as Record<string, unknown> | null
              const imagenUrl = (productoData?.imagen_url || servicioData?.imagen_url) as string | null
              return (
                <div key={item.id as string} className="flex items-center gap-2.5 px-4 py-2">
                  <div className="relative h-7 w-5 shrink-0 overflow-hidden rounded bg-[#F8F6F3]">
                    {imagenUrl ? (
                      <Image fill src={imagenUrl} alt={item.nombre as string} className="h-full w-full object-contain" />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center ${esServicio ? 'bg-[#FEF3C7]/60' : 'bg-[#D8F3DC]/60'}`}>
                        {esServicio ? (
                          <ConciergeBell className="h-3 w-3 text-[#92400E]/50" />
                        ) : (
                          <Package className="h-3 w-3 text-[#1B4332]/50" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#1A1A1A] truncate">{item.nombre as string}</p>
                    <p className="text-[9px] text-[#9E9892]">
                      {formatPrecio(Number(item.precio_unitario), item.moneda as 'USD' | 'VES')} x {item.cantidad as number}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#1B4332] shrink-0">
                    {formatPrecio(Number(item.subtotal), item.moneda as 'USD' | 'VES')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Link
        href={`/propiedades/${reserva.propiedad.id}`}
        className="flex items-center gap-3 rounded-xl border border-[#E8E4DF] bg-white px-4 py-3 transition-all hover:border-[#52B788]/50 hover:shadow-sm"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC]">
          <Home className="h-4 w-4 text-[#1B4332]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#1A1A1A] truncate">{reserva.propiedad.titulo}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#9E9892]">
            <MapPin className="h-2.5 w-2.5" />
            {reserva.propiedad.direccion}
          </div>
        </div>
        <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[#9E9892]" />
      </Link>

    </div>
  )
}
