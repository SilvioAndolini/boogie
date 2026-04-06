// Página de Historial de Pagos
import Link from 'next/link'
import { CreditCard, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Datos de ejemplo vacíos
interface Pago {
  id: string
  fecha: string
  reservaTitulo: string
  metodoPago: string
  monto: number
  moneda: 'USD' | 'VES'
  estadoPago: string
}

const pagos: Pago[] = []

// Configuración de colores para los estados de pago
const ESTADO_PAGO_CONFIG: Record<string, { etiqueta: string; className: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', className: 'bg-[#FEF3C7] text-[#92400E]' },
  EN_VERIFICACION: { etiqueta: 'En verificación', className: 'bg-[#E8F4FD] text-[#457B9D]' },
  VERIFICADO: { etiqueta: 'Verificado', className: 'bg-[#D8F3DC] text-[#1B4332]' },
  ACREDITADO: { etiqueta: 'Acreditado', className: 'bg-[#D8F3DC] text-[#2D6A4F]' },
  RECHAZADO: { etiqueta: 'Rechazado', className: 'bg-[#FEE2E2] text-[#C1121F]' },
  REEMBOLSADO: { etiqueta: 'Reembolsado', className: 'bg-[#F8F6F3] text-[#6B6560]' },
}

// Etiquetas legibles para los métodos de pago
const METODO_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA_BANCARIA: 'Transferencia',
  PAGO_MOVIL: 'Pago Móvil',
  ZELLE: 'Zelle',
  EFECTIVO_FARMATODO: 'Efectivo Farmatodo',
  USDT: 'USDT',
  TARJETA_INTERNACIONAL: 'Tarjeta internacional',
  EFECTIVO: 'Efectivo',
}

function formatearPrecio(precio: number, moneda: 'USD' | 'VES'): string {
  if (moneda === 'USD') return `$${precio.toLocaleString('en-US')}`
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export default function PagosPage() {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Historial de pagos</h1>
          <p className="text-sm text-[#6B6560]">
            Consulta todos tus pagos y transacciones
          </p>
        </div>
        <Link href="/dashboard/pagos/configuracion">
          <Button variant="outline" className="border-[#E8E4DF] text-[#1B4332] hover:bg-[#D8F3DC]">
            Configurar métodos
          </Button>
        </Link>
      </div>

      {/* Estado vacío */}
      {pagos.length === 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F6F3]">
              <CreditCard className="h-8 w-8 text-[#9E9892]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">
              No hay pagos registrados
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#6B6560]">
              Tus pagos y transacciones aparecerán aquí una vez que realices o
              recibas pagos por reservas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de pagos */}
      {pagos.length > 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="p-0">
            {/* Encabezado de tabla */}
            <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-[#E8E4DF] px-6 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                Fecha
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                Reserva
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                Método
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                Monto
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6B6560]">
                Estado
              </span>
            </div>

            {/* Filas de pagos */}
            {pagos.map((pago) => {
              const config = ESTADO_PAGO_CONFIG[pago.estadoPago] ?? {
                etiqueta: pago.estadoPago,
                className: 'bg-[#F8F6F3] text-[#6B6560]',
              }

              return (
                <div
                  key={pago.id}
                  className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr] items-center gap-4 border-b border-[#E8E4DF] px-6 py-4 last:border-b-0"
                >
                  <span className="text-sm text-[#1A1A1A]">{pago.fecha}</span>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#9E9892]" />
                    <span className="truncate text-sm font-medium text-[#1A1A1A]">
                      {pago.reservaTitulo}
                    </span>
                  </div>
                  <span className="text-sm text-[#6B6560]">
                    {METODO_PAGO_LABELS[pago.metodoPago] ?? pago.metodoPago}
                  </span>
                  <span className="text-sm font-semibold text-[#1B4332]">
                    {formatearPrecio(pago.monto, pago.moneda)}
                  </span>
                  <Badge className={config.className}>
                    {config.etiqueta}
                  </Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
