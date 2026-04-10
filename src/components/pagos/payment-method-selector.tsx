'use client'

import { motion } from 'framer-motion'
import {
  Smartphone, Building2, CircleDollarSign, CreditCard, Wallet, Coins,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { METODOS_PAGO } from '@/lib/constants'
import type { MetodoPagoEnum } from '@/types'

interface PaymentMethodSelectorProps {
  onSelect: (metodo: MetodoPagoEnum) => void
  selected?: MetodoPagoEnum
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const METODO_META: Record<MetodoPagoEnum, { icon: typeof Smartphone; color: string; bg: string; activeBg: string; ring: string }> = {
  PAGO_MOVIL: { icon: Smartphone, color: '#2D6A4F', bg: 'bg-emerald-50', activeBg: 'bg-[#D8F3DC]', ring: 'ring-[#1B4332]' },
  TRANSFERENCIA_BANCARIA: { icon: Building2, color: '#2563EB', bg: 'bg-blue-50', activeBg: 'bg-blue-100', ring: 'ring-blue-600' },
  ZELLE: { icon: CircleDollarSign, color: '#7C3AED', bg: 'bg-violet-50', activeBg: 'bg-violet-100', ring: 'ring-violet-600' },
  EFECTIVO_FARMATODO: { icon: Wallet, color: '#DC2626', bg: 'bg-red-50', activeBg: 'bg-red-100', ring: 'ring-red-600' },
  USDT: { icon: CircleDollarSign, color: '#059669', bg: 'bg-teal-50', activeBg: 'bg-teal-100', ring: 'ring-teal-600' },
  TARJETA_INTERNACIONAL: { icon: CreditCard, color: '#1D4ED8', bg: 'bg-indigo-50', activeBg: 'bg-indigo-100', ring: 'ring-indigo-600' },
  EFECTIVO: { icon: Wallet, color: '#B45309', bg: 'bg-amber-50', activeBg: 'bg-amber-100', ring: 'ring-amber-600' },
  CRIPTO: { icon: Coins, color: '#1B4332', bg: 'bg-emerald-50', activeBg: 'bg-[#D8F3DC]', ring: 'ring-[#1B4332]' },
}

const METODOS_DISPONIBLES: MetodoPagoEnum[] = [
  'PAGO_MOVIL',
  'CRIPTO',
  'EFECTIVO_FARMATODO',
  'TARJETA_INTERNACIONAL',
]

export function PaymentMethodSelector({ onSelect, selected }: PaymentMethodSelectorProps) {
  const metodos = (Object.entries(METODOS_PAGO) as [MetodoPagoEnum, string][])
    .filter(([key]) => METODOS_DISPONIBLES.includes(key))

  return (
    <div className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B4332] to-[#40916C] px-5 py-4">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5" />
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Método de pago
        </p>
        <p className="text-sm font-medium text-white">
          Selecciona cómo quieres pagar
        </p>
      </div>

      <div className="border-t border-dotted border-[#E8E4DF]" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-2 p-4"
      >
        {metodos.map(([key, label]) => {
          const meta = METODO_META[key]
          const Icon = meta.icon
          const isActive = selected === key

          return (
            <motion.button
              key={key}
              variants={fadeUp}
              onClick={() => onSelect(key)}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200',
                isActive
                  ? `${meta.activeBg} border-transparent ring-2 ${meta.ring}`
                  : 'border-[#E8E4DF] bg-white hover:border-[#52B788] hover:bg-[#F8F6F3]',
              )}
            >
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                isActive ? meta.activeBg : meta.bg,
              )}>
                <Icon className="h-5 w-5" style={{ color: meta.color }} />
              </div>
              <span className={cn(
                'text-xs font-medium text-center leading-tight transition-colors',
                isActive ? 'text-[#1A1A1A]' : 'text-[#6B6560] group-hover:text-[#1A1A1A]',
              )}>
                {label}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
