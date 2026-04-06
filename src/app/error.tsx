'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center">
      {/* Gradient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-red-100/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-[300px] w-[300px] rounded-full bg-[#E76F51]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Error icon with spring bounce */}
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <AlertTriangle className="h-10 w-10 text-[#E76F51]" />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-[#1A1A1A]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
        >
          Algo salió mal
        </motion.h2>

        <motion.p
          className="max-w-md text-[#6B6560]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.3,
          }}
        >
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.4,
          }}
        >
          <Button
            onClick={reset}
            className="gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
          >
            <RotateCcw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="gap-2 border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]"
            >
              <Home className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
