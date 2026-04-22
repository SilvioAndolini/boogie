'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Check, ExternalLink, Loader2, Clock, Shield, AlertTriangle,
  CheckCircle2, XCircle, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

interface CryptoPaymentProps {
  reservaId: string | null
  monto: number
  propiedadId?: string
  fechaEntrada?: string
  fechaSalida?: string
  cantidadHuespedes?: number
  onPagoRegistrado: (reservaId: string) => void
  onTTLCancel?: () => void
}

type CryptoStatus = 'generating' | 'waiting' | 'confirming' | 'confirmed' | 'failed' | 'manual'

const POLL_INTERVAL = 5000
const MAX_POLL_ATTEMPTS = 36
const TRUST_WALLET_DEEPLINK = 'https://link.trustwallet.com'

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CryptoPayment({
  reservaId, monto, propiedadId, fechaEntrada, fechaSalida, cantidadHuespedes, onPagoRegistrado, onTTLCancel,
}: CryptoPaymentProps) {
  const [cryptoAddress, setCryptoAddress] = useState<string | null>(null)
  const [createdReservaId, setCreatedReservaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<CryptoStatus>('generating')
  const [elapsed, setElapsed] = useState(0)
  const [pollAttempts, setPollAttempts] = useState(0)
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const onPagoRegistradoRef = useRef(onPagoRegistrado)
  onPagoRegistradoRef.current = onPagoRegistrado
  const onTTLCancelRef = useRef(onTTLCancel)
  onTTLCancelRef.current = onTTLCancel

  useEffect(() => {
    if (status === 'confirming' || status === 'confirmed' || status === 'manual') {
      onTTLCancelRef.current?.()
    }
  }, [status])

  useEffect(() => {
    let cancelled = false

    const generate = async () => {
      try {
        const res = await fetch('/api/crypto/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservaId: reservaId || undefined,
            monto,
            propiedadId,
            fechaEntrada,
            fechaSalida,
            cantidadHuespedes,
          }),
        })
        const data = await res.json()

        if (!cancelled && data.address) {
          setCryptoAddress(data.address)
          setCreatedReservaId(data.reservaId || reservaId || null)
          setStatus('waiting')
          onPagoRegistradoRef.current(data.reservaId || reservaId || '')
        } else if (!cancelled) {
          const errMsg = typeof data.error === 'string' ? data.error : data.error?.message || 'Error al generar direccion'
          toast.error(errMsg)
        }
      } catch {
        if (!cancelled) toast.error('Error de conexion con CryptAPI')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    generate()
    return () => { cancelled = true }
  }, [reservaId, monto])

  useEffect(() => {
    if (status !== 'waiting') return
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (status !== 'confirming') return
    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      setStatus('failed')
      return
    }

    const timeout = setTimeout(async () => {
      const rid = createdReservaId || reservaId
      if (!rid) { setStatus('failed'); return }

      try {
        const res = await fetch(`/api/crypto/verificar?reservaId=${rid}`)
        if (res.ok) {
          const body = await res.json()
          const data = body?.data ?? body
          if (data.confirmado) {
            setStatus('confirmed')
            return
          }
        }
      } catch {}
      setPollAttempts((prev) => prev + 1)
    }, POLL_INTERVAL)

    return () => clearTimeout(timeout)
  }, [status, pollAttempts, createdReservaId, reservaId])

  const formatElapsed = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const handleCopy = async () => {
    if (!cryptoAddress) return
    await navigator.clipboard.writeText(cryptoAddress)
    setCopied(true)
    toast.success('Direccion copiada')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmPayment = () => {
    setStatus('confirming')
    setPollAttempts(0)
  }

  const handleManualVerification = async () => {
    const rid = createdReservaId || reservaId
    if (!rid) return
    try {
      const res = await fetch('/api/crypto/verificacion-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId: rid }),
      })
      if (res.ok) {
        setStatus('manual')
        toast.success('Solicitud de verificacion manual enviada')
      } else {
        toast.error('Error al solicitar verificacion manual')
      }
    } catch {
      toast.error('Error de conexion')
    }
  }

  const handleGoBack = () => {
    setVerificationAttempts((prev) => prev + 1)
    setStatus('waiting')
    setPollAttempts(0)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-t-[#1B4332] border-[#E8E4DF] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="h-6 w-6 text-[#1B4332]" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1A1A1A]">Generando direccion de pago</p>
          <p className="text-xs text-[#9E9892] mt-1">Conectando con CryptAPI...</p>
        </div>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D8F3DC]"
        >
          <CheckCircle2 className="h-10 w-10 text-[#1B4332]" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#1B4332]">Pago confirmado</p>
          <p className="text-sm text-[#6B6560] mt-1">Tu reserva ha sido confirmada exitosamente</p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/mis-reservas'}
          className="mt-2 h-11 rounded-xl bg-[#1B4332] px-8 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
        >
          Ver mis reservas
        </button>
      </div>
    )
  }

  if (status === 'manual') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEF3C7]"
        >
          <Clock className="h-10 w-10 text-[#92400E]" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">Verificacion manual solicitada</p>
          <p className="text-sm text-[#6B6560] mt-1">Nuestro equipo revisara tu pago en un plazo de 30 minutos a 1 hora.</p>
          <p className="text-xs text-[#9E9892] mt-2">Te notificaremos por correo una vez verificado.</p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/mis-reservas'}
          className="mt-2 h-11 rounded-xl bg-[#1B4332] px-8 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
        >
          Ver mis reservas
        </button>
      </div>
    )
  }

  if (status === 'failed') {
    const maxAttempts = 3
    const reachedMax = verificationAttempts + 1 >= maxAttempts

    if (reachedMax) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]"
          >
            <XCircle className="h-10 w-10 text-[#C1121F]" />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#1A1A1A]">No pudimos verificar tu pago</p>
            <p className="text-sm text-[#6B6560] mt-1">
              Se agotaron los intentos de verificación automática.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-xl border border-[#E8E4DF] bg-[#F8F6F3] p-4 space-y-2">
            <p className="text-xs font-semibold text-[#1B4332] mb-2">Contacta a soporte técnico</p>
            <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
              <span className="text-[#9E9892]">WhatsApp</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF]" />
              <span className="font-medium">+58 412-000-0000</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
              <span className="text-[#9E9892]">Email</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF]" />
              <span className="font-medium">soporte@boogierent.com</span>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard/mis-reservas'}
            className="mt-2 h-11 rounded-xl bg-[#1B4332] px-8 text-sm font-semibold text-white hover:bg-[#2D6A4F]"
          >
            Ver mis reservas
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]"
        >
          <XCircle className="h-10 w-10 text-[#C1121F]" />
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#1A1A1A]">No pudimos verificar tu pago</p>
          <p className="text-sm text-[#6B6560] mt-1">La transacción no ha podido ser verificada automáticamente.</p>
          <p className="text-xs text-[#9E9892] mt-1">Intento {verificationAttempts + 1} de {maxAttempts}</p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2 mt-2">
          <button
            onClick={handleGoBack}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white hover:bg-[#2D6A4F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a verificar pago
          </button>
          <button
            onClick={handleManualVerification}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] text-sm font-medium text-[#1A1A1A] hover:bg-[#F8F6F3]"
          >
            Verificar pago manualmente
          </button>
          <p className="text-center text-[10px] text-[#9E9892]">
            Las verificaciones manuales pueden tardar de 30 minutos a 1 hora
          </p>
        </div>
      </div>
    )
  }

  if (status === 'confirming') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-t-[#1B4332] border-[#E8E4DF] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="h-6 w-6 text-[#1B4332]" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1A1A1A]">Confirmando tu pago, espera un momento</p>
          <p className="text-xs text-[#9E9892] mt-1">
            Verificando transaccion en la blockchain... (intento {pollAttempts + 1}/{MAX_POLL_ATTEMPTS})
          </p>
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
              <Shield className="h-4 w-4 text-[#1B4332]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Pago con USDT (TRC20)</h3>
              <p className="text-[10px] text-[#9E9892]">Via CryptAPI · Confirmacion automatica</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl bg-[#1B4332] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Enviar exactamente</p>
                <p className="text-2xl font-bold text-white">{formatUSD(monto)}</p>
              </div>
              <div className="text-right">
                <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">TRC20</span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-center">
            <div className="rounded-xl border border-[#E8E4DF] bg-white p-4">
              {cryptoAddress && (
                <QRCodeSVG
                  value={`tron:${cryptoAddress}?amount=${monto}`}
                  size={180}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#1B4332"
                  includeMargin={false}
                />
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">
              Direccion de deposito
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white p-3">
              <p className="flex-1 break-all font-mono text-xs text-[#1A1A1A]">{cryptoAddress}</p>
              <button
                onClick={handleCopy}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-[#F8F6F3]"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="h-4 w-4 text-[#52B788]" />
                    </motion.div>
                  ) : (
                    <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy className="h-4 w-4 text-[#9E9892]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#FEF3C7] bg-[#FEFCF9] py-2.5"
          >
            <Clock className="h-3.5 w-3.5 text-[#92400E]" />
            <span className="text-xs font-medium text-[#92400E]">Esperando pago</span>
            <span className="font-mono text-xs font-bold text-[#92400E]">{formatElapsed(elapsed)}</span>
          </motion.div>

          <div className="space-y-2">
            <button
              onClick={handleOpenTrust}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98]"
            >
              Abrir Trust Wallet
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              onClick={handleOpenExplorer}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] text-xs font-medium text-[#6B6560] transition-all hover:bg-[#F8F6F3]"
            >
              Ver en Tronscan
              <ExternalLink className="h-3 w-3" />
            </button>

            <button
              onClick={handleConfirmPayment}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-bold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98] mt-3"
            >
              <CheckCircle2 className="h-5 w-5" />
              Pago efectuado, confirmar
            </button>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#F8F6F3] p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8860B]" />
            <div className="text-[10px] leading-relaxed text-[#6B6560]">
              <p className="font-semibold text-[#1A1A1A]">Importante</p>
              <p>Envia USDT exclusivamente por la red TRC20. Otras redes pueden resultar en perdida de fondos. El pago se confirma automaticamente al detectar la transaccion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  function handleOpenTrust() {
    if (!cryptoAddress) return
    window.open(`${TRUST_WALLET_DEEPLINK}?action=send&coin=195&address=${cryptoAddress}&amount=${monto}`, '_blank')
  }

  function handleOpenExplorer() {
    if (!cryptoAddress) return
    window.open(`https://tronscan.org/#/address/${cryptoAddress}`, '_blank')
  }
}
