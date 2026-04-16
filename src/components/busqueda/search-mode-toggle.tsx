'use client'

import { SearchMode } from '@/lib/constants'
import { Home, Zap, Trophy } from 'lucide-react'

const modes: { key: SearchMode; label: string; icon: typeof Home }[] = [
  { key: 'estandar', label: 'Estándar', icon: Home },
  { key: 'sports', label: 'Sports', icon: Trophy },
  { key: 'express', label: 'Express', icon: Zap },
]

export function SearchModeToggle({
  mode,
  onChange,
}: {
  mode: SearchMode
  onChange: (mode: SearchMode) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[#F8F6F3] p-1">
      {modes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            mode === key
              ? 'bg-[#1B4332] text-white shadow-sm'
              : 'text-[#6B6560] hover:text-[#1A1A1A]'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
