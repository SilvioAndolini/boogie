'use client'

import { Home, Trophy, Wrench, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { CategoriaBoogie } from '@/lib/constants'

interface CategorySwitcherProps {
  activa: CategoriaBoogie
  onChange: (cat: CategoriaBoogie) => void
}

const CATEGORIES: { key: CategoriaBoogie; label: string; icon: typeof Home; disabled?: boolean }[] = [
  { key: 'ALOJAMIENTO', label: 'Alojamientos', icon: Home },
  { key: 'DEPORTE', label: 'Sports', icon: Trophy },
  { key: 'SERVICIO', label: 'Servicios', icon: Wrench, disabled: true },
]

export function CategorySwitcher({ activa, onChange }: CategorySwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[#F8F6F3] p-1">
      {CATEGORIES.map((cat) => {
        const isActive = activa === cat.key
        const Icon = cat.icon
        return (
          <button
            key={cat.key}
            type="button"
            disabled={cat.disabled}
            onClick={() => !cat.disabled && onChange(cat.key)}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              cat.disabled
                ? 'cursor-not-allowed text-[#D0CBC4]'
                : isActive
                  ? 'text-[#1B4332]'
                  : 'text-[#6B6560] hover:text-[#1A1A1A]'
            }`}
          >
            {isActive && !cat.disabled && (
              <motion.div
                layoutId="categoryIndicator"
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{cat.label}</span>
              {cat.disabled && <Lock className="h-2.5 w-2.5" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
