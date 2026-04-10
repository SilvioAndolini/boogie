'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Check, ExternalLink, Loader2, Clock, Shield, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface CryptoPaymentProps {
  reservaId: string
  monto: number
  onPagoRegistrado: () => void
}

function formatUSD(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const TRUST_WALLET_DEEPLINK = 'https://link.trustwallet.com'

export function CryptoPayment({ reservaId, monto, onPagoRegistrado }: CryptoPaymentProps) {
  const [cryptoAddress, setCryptoAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<'generating' | 'waiting' | 'confirmed'>('generating')
  const [elapsed, setElapsed] = useState(0)
  const onPagoRegistradoRef = useRef(onPagoRegistrado)
  onPagoRegistradoRef.current = onPagoRegistrado

  useEffect(() => {
    let cancelled = false

    const generate = async () => {
      try {
        const res = await fetch('/api/crypto/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservaId, monto }),
        })
        const data = await res.json()

        if (!cancelled && data.address) {
          setCryptoAddress(data.address)
          setStatus('waiting')
          onPagoRegistradoRef.current()
        } else if (!cancelled) {
          toast.error(data.error || 'Error al generar direccion')
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

  const handleOpenTrust = () => {
    if (!cryptoAddress) return
    const url = `${TRUST_WALLET_DEEPLINK}?action=send&coin=195&address=${cryptoAddress}&amount=${monto}`
    window.open(url, '_blank')
  }

  const handleOpenExplorer = () => {
    if (!cryptoAddress) return
    window.open(`https://tronscan.org/#/address/${cryptoAddress}`, '_blank')
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

          {/* Monto */}
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

          {/* QR Code */}
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

          {/* Direccion */}
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

          {/* Timer */}
          {status === 'waiting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#FEF3C7] bg-[#FEFCF9] py-2.5"
            >
              <Clock className="h-3.5 w-3.5 text-[#92400E]" />
              <span className="text-xs font-medium text-[#92400E]">Esperando pago</span>
              <span className="font-mono text-xs font-bold text-[#92400E]">{formatElapsed(elapsed)}</span>
            </motion.div>
          )}

          {/* Botones de accion */}
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
          </div>

          {/* Aviso */}
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
}
