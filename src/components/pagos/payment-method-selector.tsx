// Selector de método de pago para la plataforma Boogie
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { METODOS_PAGO } from '@/lib/constants'
import type { MetodoPagoEnum } from '@/types'

interface PaymentMethodSelectorProps {
  onSelect: (metodo: MetodoPagoEnum) => void
  selected?: MetodoPagoEnum
}

// Iconos representativos para cada método de pago
const METODO_ICONS: Record<MetodoPagoEnum, string> = {
  TRANSFERENCIA_BANCARIA: '🏦',
  PAGO_MOVIL: '📱',
  ZELLE: '💜',
  EFECTIVO_FARMATODO: '💊',
  USDT: '₮',
  TARJETA_INTERNACIONAL: '💳',
  EFECTIVO: '💵',
}

const METODOS_DISPONIBLES: MetodoPagoEnum[] = [
  'PAGO_MOVIL',
  'EFECTIVO_FARMATODO',
  'USDT',
  'TARJETA_INTERNACIONAL',
]

export function PaymentMethodSelector({ onSelect, selected }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#1A1A1A]">Selecciona tu método de pago</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(Object.entries(METODOS_PAGO) as [MetodoPagoEnum, string][])
          .filter(([key]) => METODOS_DISPONIBLES.includes(key))
          .map(([key, label]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
              selected === key
                ? 'border-[#1B4332] bg-[#D8F3DC] ring-1 ring-[#1B4332]'
                : 'border-[#E8E4DF] hover:border-[#52B788] hover:bg-[#F8F6F3]'
            )}
          >
            <span className="text-2xl">{METODO_ICONS[key]}</span>
            <span className="text-sm font-medium text-[#1A1A1A]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
