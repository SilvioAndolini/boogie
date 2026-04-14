import Link from 'next/link'
import { CreditCard, FileText, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

const ESTADO_PAGO_CONFIG: Record<string, { etiqueta: string; className: string }> = {
  PENDIENTE: { etiqueta: 'Pendiente', className: 'bg-[#FEF3C7] text-[#92400E]' },
  EN_VERIFICACION: { etiqueta: 'En verificación', className: 'bg-[#E0F2FE] text-[#0369A1]' },
  VERIFICADO: { etiqueta: 'Verificado', className: 'bg-[#D8F3DC] text-[#1B4332]' },
  ACREDITADO: { etiqueta: 'Acreditado', className: 'bg-[#D8F3DC] text-[#2D6A4F]' },
  RECHAZADO: { etiqueta: 'Rechazado', className: 'bg-[#FEE2E2] text-[#C1121F]' },
  REEMBOLSADO: { etiqueta: 'Reembolsado', className: 'bg-[#F8F6F3] text-[#6B6560]' },
}

const METODO_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA_BANCARIA: 'Transferencia',
  PAGO_MOVIL: 'Pago Móvil',
  ZELLE: 'Zelle',
  EFECTIVO_FARMATODO: 'Efectivo Farmatodo',
  USDT: 'USDT',
  EFECTIVO: 'Efectivo',
  WALLET: 'Boogie Wallet',
}

function formatearPrecio(precio: number, moneda: 'USD' | 'VES'): string {
  if (moneda === 'USD') return `$${precio.toLocaleString('en-US')}`
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export default function PagosPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-20 h-20 w-20 rounded-full bg-white/[0.03]" />
        <div className="relative flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Historial de pagos</h1>
            <p className="text-sm text-white/70">Consulta todos tus pagos y transacciones</p>
          </div>
          <div className="hidden shrink-0 sm:block">
            <Link href="/dashboard/pagos/configuracion">
              <Button className="gap-2 bg-white/10 text-white hover:bg-white/20">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="block sm:hidden">
        <Link href="/dashboard/pagos/configuracion">
          <Button variant="outline" className="w-full border-[#E8E4DF] text-[#1B4332] hover:bg-[#D8F3DC]">
            <Settings className="mr-2 h-4 w-4" />
            Configurar métodos
          </Button>
        </Link>
      </div>

      {pagos.length === 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#F8F6F3]">
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

      {pagos.length > 0 && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-[#E8E4DF] px-6 py-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">
                Fecha
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">
                Reserva
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">
                Método
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">
                Monto
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">
                Estado
              </span>
            </div>

            {pagos.map((pago) => {
              const config = ESTADO_PAGO_CONFIG[pago.estadoPago] ?? {
                etiqueta: pago.estadoPago,
                className: 'bg-[#F8F6F3] text-[#6B6560]',
              }

              return (
                <div
                  key={pago.id}
                  className="border-b border-[#E8E4DF] last:border-b-0"
                >
                  <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4">
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
                    <span className="text-sm font-bold text-[#1B4332]">
                      {formatearPrecio(pago.monto, pago.moneda)}
                    </span>
                    <Badge className={config.className}>
                      {config.etiqueta}
                    </Badge>
                  </div>
                  <div className="flex sm:hidden items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-[#9E9892]" />
                        <span className="truncate text-sm font-medium text-[#1A1A1A]">{pago.reservaTitulo}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#9E9892]">
                        <span>{pago.fecha}</span>
                        <span className="text-[#E8E4DF]">·</span>
                        <span>{METODO_PAGO_LABELS[pago.metodoPago] ?? pago.metodoPago}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[#1B4332]">{formatearPrecio(pago.monto, pago.moneda)}</p>
                      <Badge className={`${config.className} mt-1`}>{config.etiqueta}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
