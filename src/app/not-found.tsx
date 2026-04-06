'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center">
      {/* Gradient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[#D8F3DC]/30 blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-[#E76F51]/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* 404 with spring bounce */}
        <motion.div
          className="text-8xl font-extrabold text-[#1B4332] sm:text-9xl"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          404
        </motion.div>

        <motion.h1
          className="text-2xl font-bold text-[#1A1A1A]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.25,
          }}
        >
          Página no encontrada
        </motion.h1>

        <motion.p
          className="max-w-md text-[#6B6560]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.35,
          }}
        >
          Lo sentimos, la página que buscas no existe o fue movida.
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.45,
          }}
        >
          <Link href="/">
            <Button className="gap-2 bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
              <Home className="h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2 border-[#E8E4DF] text-[#6B6560] hover:bg-[#F8F6F3]"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Ir atrás
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
