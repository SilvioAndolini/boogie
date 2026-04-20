'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      >
        <motion.div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332]"
          animate={{
            scale: [1, 1.12, 1],
            opacity: [1, 0.85, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <span className="text-lg font-bold text-white">B</span>
        </motion.div>
        <motion.p
          className="text-base font-medium text-[#1A1A1A]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Booging...
        </motion.p>
      </motion.div>
    </div>
  )
}
