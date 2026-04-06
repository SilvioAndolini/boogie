// Página de Reservas Recibidas - Vista del anfitrión
import Link from 'next/link'
import {
  Inbox,
  Home,
  User,
  CalendarDays,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Datos de ejemplo vacíos
interface ReservaRecibida {
  id: string
  nombreHuesped: string
  propiedadNombre: string
  fechaEntrada: string
  fechaSalida: string
  estadoReserva: string
  montoTotal: number
  moneda: 'USD' | 'VES'
}

const reservasRecibidas: ReservaRecibida[] = []

// Configuración de colores para los estados de reserva
const ESTADO_BADGE_CONFIG: Record<string, { etiqueta: string; className: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', className: 'bg-[#FEF3C7] text-[#92400E]' },
  CONFIRMADA: { etiqueta: 'Confirmada', className: 'bg-[#D8F3DC] text-[#1B4332]' },
  EN_CURSO: { etiqueta: 'En curso', className: 'bg-[#E8F4FD] text-[#457B9D]' },
  COMPLETADA: { etiqueta: 'Completada', className: 'bg-[#D8F3DC] text-[#2D6A4F]' },
  CANCELADA_HUESPED: { etiqueta: 'Cancelada por huésped', className: 'bg-[#FEE2E2] text-[#C1121F]' },
  CANCELADA_ANFITRION: { etiqueta: 'Cancelada', className: 'bg-[#FEE2E2] text-[#C1121F]' },
  RECHAZADA: { etiqueta: 'Rechazada', className: 'bg-[#FEE2E2] text-[#C1121F]' },
}

function formatearPrecio(precio: number, moneda: 'USD' | 'VES'): string {
  if (moneda === 'USD') return `$${precio.toLocaleString('en-US')}`
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export default function ReservasRecibidasPage() {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Reservas recibidas</h1>
        <p className="text-sm text-[#6B6560]">
          Gestiona las reservas que reciben tus propiedades
        </p>
      </div>

      {/* Estado vacío */}
      {reservasRecibidas.length === 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F6F3]">
              <Inbox className="h-8 w-8 text-[#9E9892]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              No tienes reservas recibidas
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Cuando tus propiedades reciban solicitudes de reserva, aparecerán
              aquí para que puedas confirmarlas o rechazarlas.
            </p>
            <Link href="/dashboard/mis-propiedades/nueva">
              <Button className="mt-6 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
                Publicar propiedad
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Lista de reservas recibidas */}
      {reservasRecibidas.length > 0 && (
        <div className="space-y-3">
          {reservasRecibidas.map((reserva) => {
            const config = ESTADO_BADGE_CONFIG[reserva.estadoReserva] ?? {
              etiqueta: reserva.estadoReserva,
              className: 'bg-[#F8F6F3] text-[#6B6560]',
            }
            const esPendiente = reserva.estadoReserva === 'PENDIENTE'

            return (
              <Card key={reserva.id} className="border-[#E8E4DF] transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Imagen placeholder */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
                      <Home className="h-6 w-6 text-[#1B4332]/30" />
                    </div>

                    {/* Información */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-[#6B6560]" />
                        <span className="text-sm font-semibold text-[#1A1A1A]">
                          {reserva.nombreHuesped}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[#1A1A1A]">
                        {reserva.propiedadNombre}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#6B6560]">
                        <CalendarDays className="h-3 w-3" />
                        {reserva.fechaEntrada} — {reserva.fechaSalida}
                      </div>
                    </div>

                    {/* Estado, monto y acciones */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge className={config.className}>
                        {config.etiqueta}
                      </Badge>
                      <span className="text-sm font-bold text-[#1B4332]">
                        {formatearPrecio(reserva.montoTotal, reserva.moneda)}
                      </span>
                      {esPendiente && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#C1121F] text-[#C1121F] hover:bg-[#FEE2E2]"
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </div>
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
