'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Wallet, ArrowLeft, Loader2, CheckCircle2, AlertTriangle,
  Shield, DollarSign, RefreshCw, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getWallet, activarWallet, getWalletTransacciones } from '@/actions/wallet.actions'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

interface Transaccion {
  id: string
  tipo: string
  monto_usd: number
  descripcion: string | null
  created_at: string
}

export default function WalletPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<{ id: string; estado: string; saldo_usd: number } | null>(null)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [cargando, setCargando] = useState(true)
  const [activando, setActivando] = useState(false)

  useEffect(() => {
    async function cargar() {
      const res = await getWallet()
      if (res.wallet) {
        setWallet(res.wallet as typeof wallet)
        const txs = await getWalletTransacciones(res.wallet.id)
        setTransacciones(txs as Transaccion[])
      }
      setCargando(false)
    }
    cargar()
  }, [])

  const handleActivar = async () => {
    setActivando(true)
    const res = await activarWallet()
    if (res.error) {
      toast.error(res.error)
      setActivando(false)
      return
    }
    const walletRes = await getWallet()
    if (walletRes.wallet) {
      setWallet(walletRes.wallet as typeof wallet)
    }
    toast.success('Tu Boogie Wallet ha sido activada')
    setActivando(false)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  if (wallet && wallet.estado === 'ACTIVA') {
    return (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-2xl">

        <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/pagos/configuracion')} className="text-[#6B6560]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Boogie Wallet</h1>
            <p className="text-sm text-[#6B6560]">Tu billetera digital en Boogie</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] aspect-[1.586/1] max-h-[220px] shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent" />
            <div className="absolute -right-16 -top-16 h-48 w-48 rotate-12 rounded-full bg-white/[0.07]" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rotate-12 rounded-full bg-black/[0.08]" />
            <div className="absolute -left-8 top-0 h-full w-24 rotate-12 bg-gradient-to-b from-white/[0.06] via-white/[0.12] to-white/[0.03]" />

            <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                    <Wallet className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                    Boogie Wallet
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[#22c55e]/20 px-2 py-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#22c55e]">Activa</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-10 items-center justify-center rounded-sm bg-[#fbbf24] shadow-inner">
                  <div className="h-4 w-6 rounded-[1px] border border-black/15 bg-gradient-to-b from-white/40 via-transparent to-white/20" />
                </div>
                <div className="h-3 w-6 rounded-full border border-white/20 bg-white/[0.06]" />
                <div className="h-3 w-6 rounded-full border border-white/20 bg-white/[0.06]" />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Saldo disponible</p>
                  <p className="text-2xl font-extrabold text-white tabular-nums">
                    ${wallet.saldo_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-1 text-xs font-semibold text-white/50">USD</span>
                  </p>
                </div>
                <svg className="h-5 w-5 text-white/25 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 16.5a5 5 0 0 1 0-9" /><path d="M12 18a8 8 0 0 1 0-12" /><path d="M15.5 19.5a11 11 0 0 1 0-15" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {transacciones.length > 0 && (
          <motion.div variants={fadeUp} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E9892] px-1">Historial de transacciones</h2>
            <div className="space-y-2">
              {transacciones.map((tx) => {
                const esIngreso = tx.tipo === 'RECARGA' || tx.tipo === 'REEMBOLSO'
                return (
                  <div key={tx.id} className="flex items-center gap-3 rounded-xl border border-[#E8E4DF] bg-white p-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      esIngreso ? 'bg-[#D8F3DC]' : 'bg-[#FEE2E2]'
                    }`}>
                      {esIngreso ? (
                        <DollarSign className="h-4 w-4 text-[#1B4332]" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-[#C1121F]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                        {tx.descripcion || tx.tipo}
                      </p>
                      <p className="text-xs text-[#9E9892]">
                        {new Date(tx.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${esIngreso ? 'text-[#1B4332]' : 'text-[#C1121F]'}`}>
                      {esIngreso ? '+' : '-'}${Math.abs(tx.monto_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {transacciones.length === 0 && (
          <motion.div variants={fadeUp} className="rounded-2xl border border-dashed border-[#E8E4DF] bg-[#FDFCFA] p-10 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-[#9E9892]" />
            <p className="text-sm text-[#9E9892]">Aún no tienes transacciones</p>
          </motion.div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-2xl">

      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/pagos/configuracion')} className="text-[#6B6560]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Boogie Wallet</h1>
          <p className="text-sm text-[#6B6560]">Activa tu billetera digital</p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tu billetera en Boogie</h2>
            <p className="mt-1 text-sm text-white/60">
              Recibe pagos, gestiona tus ingresos y retira fondos cuando quieras
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-4">
        <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#1A1A1A]">Antes de activar tu Wallet</h3>

          <div className="space-y-3">
            {[
              { icon: Shield, text: 'Tus fondos están protegidos y seguros' },
              { icon: DollarSign, text: 'Recibe pagos directamente en USD' },
              { icon: RefreshCw, text: 'Retira tus fondos en cualquier momento' },
            ].map(({ icon: Icono, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D8F3DC]">
                  <Icono className="h-4 w-4 text-[#1B4332]" />
                </div>
                <p className="text-sm text-[#4A4540] pt-1">{text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#FEF9E7] p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#B8860B] mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#92400E]">Términos y condiciones</p>
              <p className="mt-1 text-xs text-[#92400E]/70">
                Al activar tu Boogie Wallet aceptas los términos de uso del servicio de billetera digital.
                Los saldos se mantienen en USD y las conversiones a bolívares se calculan al día.
                Boogie retiene una comisión del 6% por cada reserva completada.
              </p>
            </div>
          </div>
        </div>

        <Button
          className="h-12 w-full bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
          onClick={handleActivar}
          disabled={activando}
        >
          {activando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activando...</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Activar mi Boogie Wallet</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
