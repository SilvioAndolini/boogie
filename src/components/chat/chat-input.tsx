'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ImagePlus, Zap, Loader2 } from 'lucide-react'
import { ChatQuickMessages } from './chat-quick-messages'

interface ChatInputProps {
  onSend: (contenido: string, tipo: 'texto' | 'rapido') => void
  onSendImage: (file: File) => void
  sending: boolean
}

export function ChatInput({ onSend, onSendImage, sending }: ChatInputProps) {
  const [texto, setTexto] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || sending) return
    onSend(texto.trim(), 'texto')
    setTexto('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleQuickSelect(contenido: string) {
    onSend(contenido, 'rapido')
    setShowQuick(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onSendImage(file)
      e.target.value = ''
    }
  }

  return (
    <div className="border-t border-[#E8E4DF] bg-white">
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ChatQuickMessages onSelect={handleQuickSelect} onClose={() => setShowQuick(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#9E9892] transition-colors hover:bg-[#F4F1EC] hover:text-[#1B4332] disabled:opacity-50"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <button
          type="button"
          onClick={() => setShowQuick(!showQuick)}
          disabled={sending}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50 ${
            showQuick ? 'bg-[#D8F3DC] text-[#1B4332]' : 'text-[#9E9892] hover:bg-[#F4F1EC] hover:text-[#1B4332]'
          }`}
        >
          <Zap className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            disabled={sending}
            className="w-full resize-none rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9E9892] outline-none transition-colors focus:border-[#52B788] focus:ring-1 focus:ring-[#52B788]/30 disabled:opacity-50"
            style={{ maxHeight: 120 }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!texto.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4332] text-white transition-all hover:bg-[#2D6A4F] disabled:bg-[#E8E4DF] disabled:text-[#9E9892]"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  )
}
