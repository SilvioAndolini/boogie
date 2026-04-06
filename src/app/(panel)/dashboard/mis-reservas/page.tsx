// Página de Mis Reservas - Listado de reservas del huésped
import Link from 'next/link'
import {
  CalendarDays,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Tipos de pestañas
type PestanaReserva = 'proximas' | 'en_curso' | 'completadas' | 'canceladas'

// Datos de ejemplo vacíos
interface ReservaEjemplo {
  id: string
  propiedadNombre: string
  fechaEntrada: string
  fechaSalida: string
  estadoReserva: string
  montoTotal: number
  moneda: 'USD' | 'VES'
}

const reservasPorPestana: Record<PestanaReserva, ReservaEjemplo[]> = {
  proximas: [],
  en_curso: [],
  completadas: [],
  canceladas: [],
}

// Configuración de las pestañas
const pestanas: Array<{
  key: PestanaReserva
  etiqueta: string
  icono: React.ElementType
  estadoColor: string
}> = [
  { key: 'proximas', etiqueta: 'Próximas', icono: Clock, estadoColor: 'bg-[#E8F4FD] text-[#457B9D]' },
  { key: 'en_curso', etiqueta: 'En curso', icono: AlertCircle, estadoColor: 'bg-[#FEF3C7] text-[#92400E]' },
  { key: 'completadas', etiqueta: 'Completadas', icono: CheckCircle2, estadoColor: 'bg-[#D8F3DC] text-[#1B4332]' },
  { key: 'canceladas', etiqueta: 'Canceladas', icono: XCircle, estadoColor: 'bg-[#FEE2E2] text-[#C1121F]' },
]

// Mapa de nombres legibles para los estados de reserva
const ESTADO_RESERVA_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA_HUESPED: 'Cancelada',
  CANCELADA_ANFITRION: 'Cancelada',
  RECHAZADA: 'Rechazada',
}

function formatearPrecio(precio: number, moneda: 'USD' | 'VES'): string {
  if (moneda === 'USD') return `$${precio.toLocaleString('en-US')}`
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export default function MisReservasPage() {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mis reservas</h1>
        <p className="text-sm text-[#6B6560]">
          Consulta y gestiona todas tus reservas
        </p>
      </div>

      {/* Pestañas de estado */}
      <div className="flex gap-2 overflow-x-auto border-b border-[#E8E4DF] pb-0">
        {pestanas.map((pestana) => {
          const cantidad = reservasPorPestana[pestana.key].length
          const IconoPestana = pestana.icono
          return (
            <div
              key={pestana.key}
              className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 pb-3 text-sm font-medium text-[#6B6560] transition-colors first:border-[#1B4332] first:text-[#1B4332]"
            >
              <IconoPestana className="h-4 w-4" />
              {pestana.etiqueta}
              {cantidad > 0 && (
                <span className="rounded-full bg-[#F8F6F3] px-2 py-0.5 text-xs text-[#6B6560]">
                  {cantidad}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Contenido por pestaña */}
      {pestanas.map((pestana) => {
        const reservas = reservasPorPestana[pestana.key]
        return (
          <div key={pestana.key}>
            {reservas.length === 0 ? (
              /* Estado vacío por pestaña */
              <Card className="border-[#E8E4DF]">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F3]">
                    <CalendarDays className="h-6 w-6 text-[#9E9892]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">
                    No hay reservas {pestana.etiqueta.toLowerCase()}
                  </h3>
                  <p className="mt-1 text-xs text-[#9E9892]">
                    Las reservas {pestana.etiqueta.toLowerCase()} aparecerán aquí
                  </p>
                  {pestana.key === 'proximas' && (
                    <Link href="/zonas">
                      <Button
                        variant="outline"
                        className="mt-4 border-[#E8E4DF] text-[#1B4332] hover:bg-[#D8F3DC]"
                      >
                        <Home className="mr-1 h-4 w-4" />
                        Explorar propiedades
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Lista de reservas */
              <div className="space-y-3">
                {reservas.map((reserva) => (
                  <Card key={reserva.id} className="border-[#E8E4DF] transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 py-4">
                      {/* Imagen placeholder */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
                        <Home className="h-6 w-6 text-[#1B4332]/30" />
                      </div>
                      {/* Información */}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-[#1A1A1A]">
                          {reserva.propiedadNombre}
                        </h4>
                        <p className="text-xs text-[#6B6560]">
                          {reserva.fechaEntrada} — {reserva.fechaSalida}
                        </p>
                      </div>
                      {/* Estado y monto */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge className={pestana.estadoColor}>
                          {ESTADO_RESERVA_LABELS[reserva.estadoReserva] ?? reserva.estadoReserva}
                        </Badge>
                        <span className="text-sm font-bold text-[#1B4332]">
                          {formatearPrecio(reserva.montoTotal, reserva.moneda)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
