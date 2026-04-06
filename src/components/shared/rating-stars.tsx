'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  /** Calificación (0 a 5) */
  rating: number
  /** Total de reseñas (opcional) */
  totalReviews?: number
  /** Tamaño de las estrellas */
  size?: 'sm' | 'md'
  /** Clase CSS adicional */
  className?: string
}

// Tamaños de las estrellas y texto
const starSizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
}

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
}

// Componente para mostrar calificación con estrellas
export function RatingStars({
  rating,
  totalReviews,
  size = 'md',
  className,
}: RatingStarsProps) {
  // Calcular estrellas llenas y vacías
  const estrellas = Array.from({ length: 5 }, (_, i) => {
    const valorEstrella = i + 1
    // Determinar si la estrella está llena, media o vacía
    if (rating >= valorEstrella) return 'llena'
    if (rating >= valorEstrella - 0.5) return 'media'
    return 'vacia'
  })

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {/* Calificación numérica */}
      <span className={cn('font-semibold text-[#1A1A1A]', textSizeMap[size])}>
        {rating.toFixed(1)}
      </span>

      {/* Estrellas */}
      <div className="flex items-center">
        {estrellas.map((estado, i) => (
          <Star
            key={i}
            className={cn(
              starSizeMap[size],
              estado === 'llena' && 'fill-[#F4A261] text-[#F4A261]',
              estado === 'media' && 'fill-[#F4A261]/50 text-[#F4A261]',
              estado === 'vacia' && 'fill-none text-[#E8E4DF]'
            )}
          />
        ))}
      </div>

      {/* Total de reseñas */}
      {totalReviews !== undefined && (
        <span className={cn('text-[#6B6560]', textSizeMap[size])}>
          ({totalReviews} reseña{totalReviews !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}
