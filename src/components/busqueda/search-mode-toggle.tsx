'use client'

import { SearchMode } from '@/lib/constants'
import { Home, Zap, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

const allModes: { key: SearchMode; label: string; icon: typeof Home }[] = [
  { key: 'estandar', label: 'Estándar', icon: Home },
  { key: 'sports', label: 'Sports', icon: Trophy },
  { key: 'express', label: 'Express', icon: Zap },
]

export function SearchModeToggle({
  mode,
  onChange,
  inline = false,
  exclude = [],
}: {
  mode: SearchMode
  onChange: (mode: SearchMode) => void
  inline?: boolean
  exclude?: SearchMode[]
}) {
  const modes = allModes.filter((m) => !exclude.includes(m.key))

  if (inline) {
    return (
      <div className="flex items-center">
        {modes.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              mode === key
                ? 'text-[#1B4332]'
                : 'text-[#6B6560] hover:text-[#1A1A1A]'
            }`}
          >
            {mode === key && (
              <motion.div
                layoutId="inline-mode-indicator"
                className="absolute inset-0 rounded-full bg-[#D8F3DC]"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-[#F8F6F3] p-1">
      {modes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {mode === key && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute inset-0 rounded-full bg-[#1B4332] shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Icon className={`relative z-10 h-3.5 w-3.5 ${mode === key ? 'text-white' : 'text-[#6B6560] hover:text-[#1A1A1A]'}`} />
          <span className={`relative z-10 hidden sm:inline ${mode === key ? 'text-white' : 'text-[#6B6560] hover:text-[#1A1A1A]'}`}>{label}</span>
        </button>
      ))}
    </div>
  )
}
