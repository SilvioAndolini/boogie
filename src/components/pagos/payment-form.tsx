'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, CreditCard, Upload, X, Loader2, ArrowRight, Building2, FileText,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getTasaBCV } from '@/actions/wallet.actions'
import { CryptoPayment } from '@/components/pagos/crypto-payment'
import type { MetodoPagoEnum } from '@/types'
import type { PaymentData } from '@/lib/payment-data'

interface PaymentFormProps {
  metodo: MetodoPagoEnum
  monto: number
  moneda: 'USD' | 'VES'
  reservaId?: string
  onSubmit: (data: FormData) => void
}

const BANCOS_VENEZUELA = [
  'Banco de Venezuela', 'Banesco', 'Mercantil', 'Provincial', 'BNC',
  'BOD', 'Bicentenario', 'Bancamiga', 'Bancaribe', 'Bex',
  '100% Banco', 'Del Sur', 'Exterior', 'Fondo Común',
  'Industrial de Venezuela', 'Plaza', 'Sofitasa', 'Venezolano de Crédito',
]

function formatVES(n: number) {
  return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function PaymentForm({ metodo, monto, moneda, reservaId, onSubmit }: PaymentFormProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tasaBCV, setTasaBCV] = useState<number | null>(null)
  const [fuenteBCV, setFuenteBCV] = useState('')
  const [datosPago, setDatosPago] = useState<PaymentData | null>(null)
  const [cryptoRegistrado, setCryptoRegistrado] = useState(false)

  const [ultimos4Ref, setUltimos4Ref] = useState('')
  const [bancoEmisor, setBancoEmisor] = useState('')
  const [telefonoEmisor, setTelefonoEmisor] = useState('')
  const [comprobante, setComprobante] = useState<File | null>(null)

  const esPagoMovil = metodo === 'PAGO_MOVIL'
  const esCripto = metodo === 'CRIPTO'

  useEffect(() => {
    getTasaBCV().then((res) => {
      if (res.tasa) {
        setTasaBCV(res.tasa)
        setFuenteBCV(res.fuente || 'BCV')
      }
    })

    fetch('/api/payment-data')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setDatosPago(data) })
      .catch(() => {})
  }, [])

  const montoVES = tasaBCV ? Math.round(monto * tasaBCV * 100) / 100 : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ultimos4Ref || !bancoEmisor || !telefonoEmisor) {
      return
    }
    setEnviando(true)

    const formData = new FormData()
    formData.append('referencia', ultimos4Ref)
    formData.append('metodoPago', metodo)
    formData.append('bancoEmisor', bancoEmisor)
    formData.append('telefonoEmisor', telefonoEmisor)
    if (comprobante) formData.append('comprobante', comprobante)
    onSubmit(formData)
    setEnviando(false)
  }

  const datosReceptor = datosPago ? datosPago[metodo as keyof PaymentData] : null

  if (esCripto && reservaId) {
    return (
      <CryptoPayment
        reservaId={reservaId}
        monto={monto}
        onPagoRegistrado={() => setCryptoRegistrado(true)}
      />
    )
  }

  if (!esPagoMovil) {
    return (
      <div className="space-y-4">
        {datosReceptor && (
          <div className="rounded-xl border border-[#E8E4DF] bg-[#FDFCFA] p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-3">Datos del receptor</h4>
            <div className="space-y-2">
              {Object.entries(datosReceptor).map(([campo, valor]) => (
                <div key={campo} className="flex items-center gap-2 text-sm">
                  <span className="text-[#9E9892] capitalize">{campo}</span>
                  <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                  <span className="font-medium text-[#1A1A1A]">{valor as string}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm pt-2 border-t border-[#E8E4DF]">
                <span className="font-semibold text-[#1A1A1A]">Monto</span>
                <span className="flex-1 border-b border-dotted border-[#1B4332]/30 min-w-[12px]" />
                <span className="font-bold text-[#1B4332]">
                  {moneda === 'USD' ? formatUSD(monto) : formatVES(monto)}
                </span>
              </div>
            </div>
          </div>
        )}
        <p className="text-center text-xs text-[#9E9892]">Método de pago en desarrollo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ====== PANEL INFO PAGO MÓVIL ====== */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E8E4DF] bg-gradient-to-br from-white to-[#F8F6F3]">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#1B4332]/[0.03]" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[#1B4332]/[0.03]" />

        <div className="relative p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC]">
              <Phone className="h-4 w-4 text-[#1B4332]" />
            </div>
            <h3 className="text-sm font-bold text-[#1A1A1A]">Datos del Pago Móvil</h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
              <span className="text-[#9E9892]">Banco receptor</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
              <span className="font-semibold text-[#1A1A1A]">{datosReceptor ? (datosReceptor as Record<string, string>).banco : '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Phone className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
              <span className="text-[#9E9892]">Teléfono</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
              <span className="font-semibold text-[#1A1A1A]">{datosReceptor ? (datosReceptor as Record<string, string>).telefono : '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <CreditCard className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
              <span className="text-[#9E9892]">Cédula / RIF</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
              <span className="font-semibold text-[#1A1A1A]">{datosReceptor ? (datosReceptor as Record<string, string>).cedula : '—'}</span>
            </div>
          </div>

          {/* Conversión USD → VES */}
          <div className="mt-4 rounded-xl bg-[#1B4332] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-white/50">Monto a pagar</span>
              {tasaBCV && (
                <span className="text-[10px] text-white/40">Tasa {fuenteBCV}: {tasaBCV.toFixed(2)}</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{formatVES(montoVES || monto)}</p>
                {moneda === 'USD' && tasaBCV && (
                  <p className="text-xs text-white/50 mt-0.5">{formatUSD(monto)} USD</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">Concepto</p>
                <p className="text-xs font-medium text-white/70">Reserva Boogie</p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-[#9E9892] text-center">
            Realiza el pago móvil desde tu banco y luego presiona "Procesar pago"
          </p>
        </div>
      </div>

      {/* ====== BOTÓN PROCESAR PAGO ====== */}
      {!mostrarFormulario && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F]"
          >
            Procesar pago
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* ====== FORMULARIO COMPROBANTE ====== */}
      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E8E4DF] bg-white p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-[#1A1A1A]">Comprobante de pago</h3>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9E9892] hover:bg-[#F8F6F3]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Últimos 4 dígitos de la referencia</Label>
                <Input
                  value={ultimos4Ref}
                  onChange={(e) => setUltimos4Ref(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ej: 7890"
                  required
                  maxLength={4}
                  disabled={enviando}
                  className="border-[#E8E4DF] bg-white h-10 rounded-xl font-mono text-center tracking-widest"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Banco emisor</Label>
                <select
                  value={bancoEmisor}
                  onChange={(e) => setBancoEmisor(e.target.value)}
                  required
                  disabled={enviando}
                  className="flex h-10 w-full rounded-xl border border-[#E8E4DF] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332]"
                >
                  <option value="">Selecciona tu banco</option>
                  {BANCOS_VENEZUELA.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Teléfono emisor</Label>
                <Input
                  value={telefonoEmisor}
                  onChange={(e) => setTelefonoEmisor(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="04141234567"
                  required
                  minLength={10}
                  disabled={enviando}
                  className="border-[#E8E4DF] bg-white h-10 rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Comprobante (captura de pantalla)</Label>
                <div className="relative flex items-center justify-center rounded-xl border-2 border-dashed border-[#E8E4DF] p-4 transition-colors hover:border-[#52B788] hover:bg-[#F8F6F3]/50">
                  {comprobante ? (
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-[#1B4332]" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate max-w-[200px]">{comprobante.name}</p>
                        <p className="text-[10px] text-[#9E9892]">{(comprobante.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setComprobante(null)}
                        className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FEE2E2] text-[#C1121F]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-1.5">
                      <Upload className="h-6 w-6 text-[#9E9892]" />
                      <span className="text-xs text-[#6B6560]">Toca para subir comprobante</span>
                      <span className="text-[10px] text-[#9E9892]">JPG, PNG o PDF · Máx 5MB</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && file.size > 5 * 1024 * 1024) {
                            return
                          }
                          setComprobante(file || null)
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando || !ultimos4Ref || ultimos4Ref.length < 4 || !bancoEmisor || !telefonoEmisor}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar pago'
                )}
              </button>

              <p className="text-center text-[10px] text-[#9E9892]">
                Tu pago será verificado manualmente. Recibirás una confirmación por correo.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
