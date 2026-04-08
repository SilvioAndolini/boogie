'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, ArrowLeft, Loader2, Smartphone, Building2, DollarSign,
  RefreshCw, Receipt, Check, ChevronRight, Info, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getWallet, getTasaBCV, crearRecargaWallet } from '@/actions/wallet.actions'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const METODOS = [
  {
    id: 'PAGO_MOVIL',
    label: 'Pago Móvil',
    icon: Smartphone,
    color: 'from-[#1e3a5f] via-[#2563eb] to-[#60a5fa]',
    desc: 'Transferencia instantánea desde tu banco',
  },
  {
    id: 'EFECTIVO_FARMATODO',
    label: 'Efectivo Farmatodo',
    icon: Building2,
    color: 'from-[#064e3b] via-[#059669] to-[#6ee7b7]',
    desc: 'Pago en efectivo en cualquier Farmatodo',
  },
  {
    id: 'USDT',
    label: 'USDT (Tether)',
    icon: DollarSign,
    color: 'from-[#78350f] via-[#d97706] to-[#fcd34d]',
    desc: 'Transferencia por red TRC-20 o ERC-20',
  },
] as const

type MetodoId = (typeof METODOS)[number]['id']

const ic = "h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"

export default function RecargarWalletPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<{ id: string; estado: string; saldo_usd: number } | null>(null)
  const [tasaBCV, setTasaBCV] = useState<number | null>(null)
  const [cargando, setCargando] = useState(true)
  const [metodo, setMetodo] = useState<MetodoId | null>(null)
  const [monto, setMonto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [pm, setPm] = useState({ banco: '', telefono: '', cedula: '', referencia: '' })
  const [farmatodo, setFarmatodo] = useState({ referencia: '' })
  const [usdt, setUsdt] = useState({ hash: '' })

  useEffect(() => {
    async function cargar() {
      const [walletRes, tasaRes] = await Promise.all([getWallet(), getTasaBCV()])
      if (walletRes.wallet) setWallet(walletRes.wallet as typeof wallet)
      if ('tasa' in tasaRes) setTasaBCV(tasaRes.tasa as number)
      setCargando(false)
    }
    cargar()
  }, [])

  const montoNum = monto ? parseFloat(monto) : 0
  const montoVES = tasaBCV && montoNum > 0 ? montoNum * tasaBCV : 0

  const puedeConfirmar = () => {
    if (!metodo || montoNum <= 0 || enviando) return false
    if (metodo === 'PAGO_MOVIL' && (!pm.banco || !pm.telefono || !pm.referencia)) return false
    return true
  }

  const handleConfirmar = async () => {
    if (!metodo) return
    setEnviando(true)
    const datosPago: Record<string, string> = {}
    if (metodo === 'PAGO_MOVIL') {
      datosPago.banco = pm.banco
      datosPago.telefono = pm.telefono
      datosPago.cedula = pm.cedula
      datosPago.referencia = pm.referencia
    } else if (metodo === 'EFECTIVO_FARMATODO') {
      datosPago.referencia = farmatodo.referencia
    } else if (metodo === 'USDT') {
      datosPago.hash = usdt.hash
    }

    const res = await crearRecargaWallet({
      monto_usd: montoNum,
      metodo,
      datos_pago: datosPago,
    })

    setEnviando(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(`Recarga de $${montoNum.toFixed(2)} USD registrada. Será acreditada tras verificación.`)
    router.push('/dashboard/pagos/configuracion/wallet')
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-2xl">

      {/* ====== HEADER ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/pagos/configuracion/wallet')} className="text-[#6B6560]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Recargar Wallet</h1>
          <p className="text-sm text-[#6B6560]">Agrega saldo a tu Boogie Wallet</p>
        </div>
      </motion.div>

      {/* ====== HERO: WALLET CARD MINI ====== */}
      {wallet && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent" />
            <div className="absolute -right-12 -top-12 h-36 w-36 rotate-12 rounded-full bg-white/[0.07]" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rotate-12 rounded-full bg-black/[0.08]" />
            <div className="relative flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <Wallet className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Saldo actual</p>
                  <p className="text-xl font-extrabold text-white tabular-nums">
                    ${wallet.saldo_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-1 text-xs font-semibold text-white/50">USD</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#22c55e]/20 px-2.5 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#22c55e]">Activa</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ====== MONTO ====== */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D8F3DC]">
              <DollarSign className="h-4 w-4 text-[#1B4332]" />
            </div>
            <h2 className="text-sm font-bold text-[#1A1A1A]">Monto a recargar</h2>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[#9E9892]">$</span>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="h-14 pl-8 text-xl font-bold border-[#E8E4DF] bg-[#FDFCFA] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
            />
          </div>

          <AnimatePresence>
            {montoNum > 0 && tasaBCV && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between rounded-xl bg-[#F8F6F3] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-[#9E9892]" />
                    <span className="text-xs text-[#9E9892]">
                      Tasa BCV: <span className="font-bold text-[#4A4540]">{tasaBCV.toFixed(2)}</span>
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">
                    Bs. {montoVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {[10, 25, 50, 100].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setMonto(String(q))}
                className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                  montoNum === q
                    ? 'border-[#1B4332] bg-[#D8F3DC] text-[#1B4332]'
                    : 'border-[#E8E4DF] bg-[#FDFCFA] text-[#6B6560] hover:border-[#D4CFC9]'
                }`}
              >
                ${q}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ====== MÉTODO DE PAGO ====== */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
          <div className="p-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F1EC]">
                <Receipt className="h-4 w-4 text-[#6B6560]" />
              </div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">Método de pago</h2>
            </div>

            <div className="space-y-2">
              {METODOS.map((op) => {
                const IconoOp = op.icon
                const seleccionado = metodo === op.id
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setMetodo(op.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      seleccionado
                        ? 'border-[#1B4332] bg-[#D8F3DC]/30 ring-1 ring-[#1B4332]/20'
                        : 'border-[#E8E4DF] bg-[#FDFCFA] hover:border-[#D4CFC9]'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${op.color} shadow-sm`}>
                      <IconoOp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${seleccionado ? 'text-[#1B4332]' : 'text-[#1A1A1A]'}`}>{op.label}</p>
                      <p className="text-xs text-[#9E9892]">{op.desc}</p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      seleccionado ? 'border-[#1B4332] bg-[#1B4332]' : 'border-[#D4CFC9]'
                    }`}>
                      {seleccionado && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ====== DETALLES POR MÉTODO ====== */}
          <AnimatePresence mode="wait">
            {metodo && (
              <motion.div
                key={metodo}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="overflow-hidden"
              >
                <div className="border-t border-[#F4F1EC] p-5 space-y-4">

                  {/* PAGO MÓVIL */}
                  {metodo === 'PAGO_MOVIL' && (
                    <>
                      <div className="rounded-xl bg-gradient-to-b from-[#1e3a5f]/5 to-transparent border border-[#E8E4DF] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="h-3.5 w-3.5 text-[#2563eb]" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">Datos del beneficiario (Boogie)</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] font-semibold text-[#9E9892]">Banco</p>
                            <p className="text-xs font-bold text-[#1A1A1A]">Bco. de Venezuela</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#9E9892]">Teléfono</p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-bold text-[#1A1A1A]">0414-XXX-XXXX</p>
                              <button type="button" onClick={() => { navigator.clipboard.writeText('0414XXXXXXX'); toast.success('Copiado') }} className="text-[#9E9892] hover:text-[#1A1A1A]"><Copy className="h-3 w-3" /></button>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#9E9892]">Cédula/RIF</p>
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-bold text-[#1A1A1A]">J-XXXXXXXX</p>
                              <button type="button" onClick={() => { navigator.clipboard.writeText('J-XXXXXXXX'); toast.success('Copiado') }} className="text-[#9E9892] hover:text-[#1A1A1A]"><Copy className="h-3 w-3" /></button>
                            </div>
                          </div>
                        </div>
                        {montoNum > 0 && tasaBCV && (
                          <div className="rounded-lg bg-[#1e3a5f]/10 px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">Monto a transferir</span>
                            <span className="text-sm font-extrabold text-[#1e3a5f] tabular-nums">
                              Bs. {montoVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">Tus datos de pago</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#6B6560]">Tu banco</label>
                            <Input placeholder="Ej: Banesco" value={pm.banco} onChange={(e) => setPm((p) => ({ ...p, banco: e.target.value }))} className={ic} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#6B6560]">Tu teléfono</label>
                            <Input placeholder="Ej: 04121234567" value={pm.telefono} onChange={(e) => setPm((p) => ({ ...p, telefono: e.target.value }))} className={ic} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#6B6560]">Tu cédula / RIF</label>
                            <Input placeholder="Ej: V-12345678" value={pm.cedula} onChange={(e) => setPm((p) => ({ ...p, cedula: e.target.value }))} className={ic} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#6B6560]">Nro. referencia</label>
                            <Input placeholder="Ej: 123456789" value={pm.referencia} onChange={(e) => setPm((p) => ({ ...p, referencia: e.target.value }))} className={ic} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* EFECTIVO FARMATODO */}
                  {metodo === 'EFECTIVO_FARMATODO' && (
                    <>
                      <div className="rounded-xl bg-gradient-to-b from-[#064e3b]/5 to-transparent border border-[#E8E4DF] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="h-3.5 w-3.5 text-[#059669]" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">Instrucciones</p>
                        </div>
                        <p className="text-xs text-[#4A4540] leading-relaxed">
                          Acude a cualquier Farmatodo y realiza el pago en efectivo por el monto equivalente en bolívares.
                          Guarda tu comprobante con el número de referencia.
                        </p>
                        {montoNum > 0 && tasaBCV && (
                          <div className="rounded-lg bg-[#064e3b]/10 px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#059669]">Monto a pagar</span>
                            <span className="text-sm font-extrabold text-[#064e3b] tabular-nums">
                              Bs. {montoVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Nro. de referencia del comprobante</label>
                        <Input placeholder="Ej: 987654321" value={farmatodo.referencia} onChange={(e) => setFarmatodo((p) => ({ ...p, referencia: e.target.value }))} className={ic} />
                      </div>
                    </>
                  )}

                  {/* USDT */}
                  {metodo === 'USDT' && (
                    <>
                      <div className="rounded-xl bg-gradient-to-b from-[#78350f]/5 to-transparent border border-[#E8E4DF] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Info className="h-3.5 w-3.5 text-[#d97706]" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9E9892]">Datos para transferencia</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#9E9892]">Red</span>
                            <span className="text-xs font-bold text-[#1A1A1A]">TRC-20 (Tron)</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-[#9E9892] shrink-0">Dirección</span>
                            <div className="flex items-center gap-1 min-w-0">
                              <p className="text-xs font-bold text-[#1A1A1A] truncate">TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</p>
                              <button type="button" onClick={() => { navigator.clipboard.writeText('TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); toast.success('Dirección copiada') }} className="text-[#9E9892] hover:text-[#1A1A1A] shrink-0"><Copy className="h-3 w-3" /></button>
                            </div>
                          </div>
                        </div>
                        {montoNum > 0 && (
                          <div className="rounded-lg bg-[#78350f]/10 px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#d97706]">Enviar exactamente</span>
                            <span className="text-sm font-extrabold text-[#78350f] tabular-nums">
                              ${montoNum.toFixed(2)} USDT
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Hash de la transacción</label>
                        <Input placeholder="0x..." value={usdt.hash} onChange={(e) => setUsdt((p) => ({ ...p, hash: e.target.value }))} className={ic} />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ====== BOTÓN CONFIRMAR ====== */}
      <motion.div variants={fadeUp}>
        <Button
          className="h-12 w-full bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
          disabled={!puedeConfirmar()}
          onClick={handleConfirmar}
        >
          {enviando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {montoNum > 0 ? `Confirmar recarga de $${montoNum.toFixed(2)} USD` : 'Confirmar recarga'}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
