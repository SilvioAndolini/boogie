'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, X, Check, Loader2, AlertCircle } from 'lucide-react'
import { validarCupon } from '@/actions/admin-cupones.actions'

interface CuponInputProps {
  propiedadId: string
  subtotal: number
  noches: number
  onApply: (descuento: number, cuponCodigo: string) => void
  onRemove: () => void
  appliedCupon: string | null
  descuento: number
}

export function CuponInput({ propiedadId, subtotal, noches, onApply, onRemove, appliedCupon, descuento }: CuponInputProps) {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!codigo.trim()) return
    setLoading(true)
    setError(null)

    const result = await validarCupon(codigo.trim().toUpperCase(), propiedadId, subtotal, noches)

    if (result.error) {
      setError(String(result.error))
      setLoading(false)
      return
    }

    const desc = (result as Record<string, unknown>).descuento as number
    const cod = (result as Record<string, unknown>).codigo as string
    onApply(desc, cod)
    setLoading(false)
  }

  const handleRemove = () => {
    setCodigo('')
    setError(null)
    onRemove()
  }

  if (appliedCupon) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-[#D8F3DC] bg-[#D8F3DC]/20 p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#52B788]">
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1B4332]">{appliedCupon}</p>
              <p className="text-[10px] text-[#2D6A4F]">Descuento: -${descuento.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="rounded-lg p-1 text-[#9E9892] hover:bg-[#E8E4DF] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <input
            type="text"
            value={codigo}
            onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError(null) }}
            placeholder="Código de cupón"
            className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-white pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] focus:border-[#52B788] focus:outline-none focus:ring-1 focus:ring-[#52B788]/30 transition-colors"
            disabled={loading}
            maxLength={30}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!codigo.trim() || loading}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1B4332] px-4 text-xs font-semibold text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
        </button>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1 text-[11px] text-red-500"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
