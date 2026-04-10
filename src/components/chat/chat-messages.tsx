'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Mensaje } from '@/types/chat'
import { esMiMensaje, agruparMensajesPorFecha } from '@/lib/chat/utils'
import { ChatImageViewer } from './chat-image-viewer'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ mensaje, miId }: { mensaje: Mensaje; miId: string }) {
  const [imageViewing, setImageViewing] = useState(false)
  const mio = esMiMensaje(mensaje, miId)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 }}
        className={`flex ${mio ? 'justify-end' : 'justify-start'} mb-1`}
      >
        <div className={`max-w-[78%] sm:max-w-[65%]`}>
          {mensaje.tipo === 'rapido' && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                mio ? 'bg-[#2D6A4F] text-[#D8F3DC]' : 'bg-[#D8F3DC] text-[#1B4332]'
              }`}
            >
              <span className="text-[10px]">⚡</span> Rápido
            </motion.span>
          )}

          <div
            className={`rounded-2xl px-4 py-2.5 shadow-sm ${
              mio
                ? 'bg-[#1B4332] text-white rounded-tr-md'
                : 'bg-[#F4F1EC] text-[#1A1A1A] rounded-tl-md border border-[#E8E4DF]/50'
            }`}
          >
            {mensaje.imagen_url && (
              <button
                onClick={() => setImageViewing(true)}
                className="mb-2 block overflow-hidden rounded-xl"
              >
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={mensaje.imagen_url}
                  alt="Imagen compartida"
                  className="max-h-60 w-auto rounded-xl object-cover transition-transform hover:scale-[1.03]"
                />
              </button>
            )}

            {mensaje.contenido && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {mensaje.contenido}
              </p>
            )}

            <div className={`mt-1.5 flex items-center gap-1.5 ${mio ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] ${mio ? 'text-white/50' : 'text-[#9E9892]'}`}>
                {formatTime(mensaje.created_at)}
              </span>
              {mio && (
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className={`text-[10px] ${mensaje.leido ? 'text-[#52B788]' : 'text-white/40'}`}
                >
                  {mensaje.leido ? '✓✓' : '✓'}
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {mensaje.imagen_url && imageViewing && (
        <ChatImageViewer url={mensaje.imagen_url} onClose={() => setImageViewing(false)} />
      )}
    </>
  )
}

export function ChatMessages({ mensajes, miId, loading }: { mensajes: Mensaje[]; miId: string; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)

  useEffect(() => {
    if (mensajes.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLengthRef.current = mensajes.length
  }, [mensajes.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8F3DC] border-t-[#1B4332]" />
        <span className="text-xs text-[#9E9892]">Cargando mensajes...</span>
      </div>
    )
  }

  if (mensajes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#FEFCF9]/50 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F1EC]">
          <MessageCircle className="h-7 w-7 text-[#9E9892]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1A1A1A]">Inicia la conversación</p>
          <p className="mt-1 text-xs text-[#9E9892]">Envía un mensaje o usa una respuesta rápida ⚡</p>
        </div>
      </div>
    )
  }

  const grupos = agruparMensajesPorFecha(mensajes)

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#FEFCF9]/30 px-4 py-4">
      <AnimatePresence initial={false}>
        {grupos.map((grupo) => (
          <div key={grupo.fecha} className="mb-2">
            <div className="flex items-center justify-center py-3">
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-[#9E9892] shadow-sm border border-[#E8E4DF]/60">
                {grupo.fecha}
              </span>
            </div>
            {grupo.mensajes.map((msg) => (
              <MessageBubble key={msg.id} mensaje={msg} miId={miId} />
            ))}
          </div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
