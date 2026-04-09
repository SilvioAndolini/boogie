'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { FilterPanel } from './filter-bar'

interface FilterModalProps {
  open: boolean
  onClose: () => void
}

export function FilterModal({ open, onClose }: FilterModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[540px] overflow-hidden rounded-3xl border border-[#E8E4DF] bg-white shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15)]"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1B4332] to-[#40916C] px-6 py-5">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5" />
              <div className="absolute -bottom-5 -left-5 h-20 w-20 rounded-full bg-white/5" />
              <div className="absolute right-16 top-0 h-14 w-14 rounded-full bg-white/[0.03]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <SlidersHorizontal className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="block text-lg font-semibold text-white">Filtros</span>
                    <span className="block text-xs text-white/50">Encuentra tu boogie ideal</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:scale-105"
                  aria-label="Cerrar filtros"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto scrollbar-thin">
              <FilterPanel onClose={onClose} hideHeader />
            </div>

            <div className="border-t border-[#E8E4DF] bg-[#FEFCF9] px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.search = ''
                    window.location.href = url.toString()
                  }}
                  className="flex items-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-4 py-2.5 text-sm font-medium text-[#6B6560] transition-colors hover:border-[#D0CBC4] hover:text-[#1A1A1A]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpiar
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2D6A4F]"
                >
                  Ver resultados
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}