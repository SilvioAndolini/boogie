'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface AdminHeaderProps {
  icon: LucideIcon
  titulo: string
  subtitulo: string
  children?: React.ReactNode
}

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export function AdminHeader({ icon: Icon, titulo, subtitulo, children }: AdminHeaderProps) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-4 h-20 w-20 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{titulo}</h1>
            <p className="text-sm text-white/70">{subtitulo}</p>
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </motion.div>
  )
}
