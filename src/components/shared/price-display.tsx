'use client'

import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  /** Monto a mostrar */
  monto: number
  /** Moneda del precio */
  moneda?: 'USD' | 'VES'
  /** Tamaño del texto */
  size?: 'sm' | 'md' | 'lg'
  /** Mostrar "/ noche" después del precio */
  showPerNight?: boolean
  /** Clase CSS adicional */
  className?: string
}

// Tamaños de fuente según la variante
const sizeMap = {
  sm: 'text-sm',
  md: 'text-xl font-semibold',
  lg: 'text-3xl font-bold',
} as const

const currencySymbolMap = {
  USD: '$',
  VES: 'Bs ',
}

// Formatea un número como precio con separadores decimales
function formatearPrecio(monto: number, moneda: 'USD' | 'VES'): string {
  const simbolo = currencySymbolMap[moneda]
  const decimals = moneda === 'USD' ? 2 : 2
  return `${simbolo}${monto.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

// Componente para mostrar precios formateados
export function PriceDisplay({
  monto,
  moneda = 'USD',
  size = 'md',
  showPerNight = false,
  className,
}: PriceDisplayProps) {
  const precioFormateado = formatearPrecio(monto, moneda)

  return (
    <span className={cn('text-[#1A1A1A]', sizeMap[size], className)}>
      {precioFormateado}
      {showPerNight && (
        <span className="text-sm font-normal text-[#6B6560]"> / noche</span>
      )}
    </span>
  )
}
