'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface AdminEmptyStateProps {
  icon: LucideIcon
  titulo: string
  descripcion?: string
  action?: React.ReactNode
}

export function AdminEmptyState({ icon: Icon, titulo, descripcion, action }: AdminEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F6F3]">
        <Icon className="h-8 w-8 text-[#9E9892]" />
      </div>
      <p className="font-medium text-[#1A1A1A]">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-[#6B6560]">{descripcion}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
