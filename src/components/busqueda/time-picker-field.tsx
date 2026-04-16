'use client'

import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

interface TimePickerFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  allowAny?: boolean
  anyLabel?: string
}

export function TimePickerField({ label, value, onChange, placeholder, allowAny, anyLabel = 'Cualquier hora' }: TimePickerFieldProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && scrollRef.current && value && value !== '__any__') {
      const target = scrollRef.current.querySelector(`[data-hour="${value}"]`)
      if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayValue = value === '__any__' ? anyLabel : (value || placeholder || 'Seleccionar')

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="text-xs font-semibold text-[#6B6560]">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center gap-2 rounded-lg border border-[#E8E4DF] bg-[#FDFCFA] px-3 text-sm text-[#1A1A1A] transition-colors hover:border-[#1B4332]/30 focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]/20"
      >
        <Clock className="h-3.5 w-3.5 text-[#1B4332]" />
        <span className={value ? '' : 'text-[#C4BFBA]'}>{displayValue}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="absolute left-0 top-full z-[100] mt-1 w-full min-w-[180px] rounded-xl border border-[#E8E4DF] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={scrollRef} className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
              {allowAny && (
                <button
                  onClick={() => { onChange('__any__'); setOpen(false) }}
                  className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-all ${
                    value === '__any__'
                      ? 'bg-[#1B4332] text-white font-semibold'
                      : 'text-[#1B4332] hover:bg-[#D8F3DC] font-medium'
                  }`}
                >
                  {anyLabel}
                </button>
              )}
              {HOURS.map((h) => (
                <button
                  key={h}
                  data-hour={h}
                  onClick={() => { onChange(h); setOpen(false) }}
                  className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm transition-all ${
                    h === value
                      ? 'bg-[#1B4332] text-white font-semibold'
                      : 'text-[#1A1A1A] hover:bg-[#F8F6F3]'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
