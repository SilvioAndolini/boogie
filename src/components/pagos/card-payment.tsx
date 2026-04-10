'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Shield, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface CardPaymentProps {
  monto: number
  propiedadId: string
  fechaEntrada: string
  fechaSalida: string
  cantidadHuespedes: number
  onReservaCreated: (reservaId: string) => void
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CardPayment({
  monto,
  propiedadId,
  fechaEntrada,
  fechaSalida,
  cantidadHuespedes,
  onReservaCreated,
}: CardPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const onReservaCreatedRef = useRef(onReservaCreated)
  onReservaCreatedRef.current = onReservaCreated

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/card/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto,
          propiedadId,
          fechaEntrada,
          fechaSalida,
          cantidadHuespedes,
        }),
      })
      const data = await res.json()

      if (data.invoiceUrl) {
        setInvoiceUrl(data.invoiceUrl)
        if (data.reservaId) {
          onReservaCreatedRef.current(data.reservaId)
        }
        window.open(data.invoiceUrl, '_blank')
      } else {
        toast.error(data.error || 'Error al crear el enlace de pago')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  if (invoiceUrl) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-[#E8E4DF] bg-gradient-to-br from-white to-[#F8F6F3]">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#1B4332]/[0.03]" />
          <div className="relative p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC]">
                <CreditCard className="h-4 w-4 text-[#1B4332]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Pago con Tarjeta</h3>
                <p className="text-[10px] text-[#9E9892]">Via NOWPayments · Conversion automatica a USDT</p>
              </div>
            </div>

            <div className="mb-4 rounded-xl bg-[#D8F3DC] p-4 text-center">
              <p className="text-xs font-medium text-[#1B4332]">Se abrio la pagina de pago en una nueva ventana</p>
              <p className="text-[10px] text-[#2D6A4F] mt-1">Completa el pago con tu tarjeta para confirmar la reserva</p>
            </div>

            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F]"
            >
              Abrir pagina de pago
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="mt-3 text-center text-[10px] text-[#9E9892]">
              La reserva se confirmara automaticamente al completar el pago
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#E8E4DF] bg-gradient-to-br from-white to-[#F8F6F3]">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#1B4332]/[0.03]" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[#1B4332]/[0.03]" />

        <div className="relative p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <CreditCard className="h-4 w-4 text-[#1B4332]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Pago con Tarjeta</h3>
              <p className="text-[10px] text-[#9E9892]">Visa, Mastercard, Amex · via NOWPayments</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl bg-[#1B4332] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Total a pagar</p>
                <p className="text-2xl font-bold text-white">{formatUSD(monto)}</p>
              </div>
              <div className="text-right">
                <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">USD</span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#F8F6F3] p-3">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
            <div className="text-[10px] leading-relaxed text-[#6B6560]">
              <p className="font-semibold text-[#1A1A1A]">Pago seguro</p>
              <p>Serás redirigido a la pasarela de pago de NOWPayments. Tu tarjeta sera procesada de forma segura y el monto se convertira automaticamente a USDT.</p>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Pagar con tarjeta
                <CreditCard className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
