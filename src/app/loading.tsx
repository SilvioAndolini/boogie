'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <motion.div
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B4332]"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <span className="text-xl font-bold text-white">B</span>
        </motion.div>
        <motion.p
          className="text-sm text-[#6B6560]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          Cargando...
        </motion.p>
      </motion.div>
    </div>
  )
}
