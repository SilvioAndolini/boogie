'use client'

import { motion } from 'framer-motion'
import { Clock, ArrowLeft } from 'lucide-react'

interface TTLExpiredModalProps {
  onVolver: () => void
}

export function TTLExpiredModal({ onVolver }: TTLExpiredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mx-4 w-full max-w-sm rounded-2xl border border-[#E8E4DF] bg-white p-8 text-center shadow-xl"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <Clock className="h-8 w-8 text-red-600" />
        </div>

        <h3 className="text-lg font-bold text-[#1A1A1A]">Tiempo agotado</h3>

        <p className="mt-2 text-sm text-[#6B6560] leading-relaxed">
          El tiempo para realizar el pago se ha agotado. Debes escoger nuevamente las fechas para tu reserva.
        </p>

        <button
          onClick={onVolver}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-semibold text-white transition-all hover:bg-[#2D6A4F] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la propiedad
        </button>
      </motion.div>
    </div>
  )
}
