'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ChatImageViewerProps {
  url: string
  onClose: () => void
}

export function ChatImageViewer({ url, onClose }: ChatImageViewerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        src={url}
        alt="Imagen"
        className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  )
}
