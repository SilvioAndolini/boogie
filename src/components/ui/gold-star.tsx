import { Star } from 'lucide-react'

interface GoldStarProps {
  size?: number
  rating?: number
  showValue?: boolean
  className?: string
}

export function GoldStar({ size = 16, rating, showValue = false, className = '' }: GoldStarProps) {
  const id = `gs-${Math.random().toString(36).slice(2, 8)}`
  const s = `${size / 16}rem` // 16px base -> rem

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" style={{ width: s, height: s }}>
        <defs>
          <linearGradient id={`gold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="25%" stopColor="#FFF1A8" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="75%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={`url(#gold-${id})`}
          stroke="#B8860B"
          strokeWidth="0.5"
          filter={`url(#glow-${id})`}
        />
      </svg>
      {showValue && rating != null && (
        <span className="text-xs font-bold text-[#1A1A1A] tabular-nums">{rating.toFixed(1)}</span>
      )}
    </span>
  )
}

export function GoldStarSmall({ size = 12, className = '' }: { size?: number; className?: string }) {
  const s = `${size / 16}rem`

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={{ width: s, height: s }}>
      <defs>
        <linearGradient id="gold-sm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="25%" stopColor="#FFF1A8" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="75%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="url(#gold-sm)"
        stroke="#B8860B"
        strokeWidth="0.5"
      />
    </svg>
  )
}
