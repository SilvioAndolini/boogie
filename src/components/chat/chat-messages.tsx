'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`flex ${mio ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-[75%] sm:max-w-[65%] ${mio ? 'order-2' : 'order-1'}`}>
          <div
            className={`rounded-2xl px-4 py-2.5 ${
              mio
                ? 'bg-[#1B4332] text-white rounded-br-md'
                : 'bg-[#F4F1EC] text-[#1A1A1A] rounded-bl-md'
            }`}
          >
            {mensaje.tipo === 'rapido' && !mio && (
              <span className={`text-[10px] font-medium ${mio ? 'text-[#D8F3DC]' : 'text-[#52B788]'} block mb-0.5`}>
                ⚡ Respuesta rápida
              </span>
            )}

            {mensaje.imagen_url && (
              <button
                onClick={() => setImageViewing(true)}
                className="mb-2 block overflow-hidden rounded-xl"
              >
                <img
                  src={mensaje.imagen_url}
                  alt="Imagen compartida"
                  className="max-h-60 w-auto rounded-xl object-cover transition-transform hover:scale-105"
                />
              </button>
            )}

            {mensaje.contenido && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {mensaje.contenido}
              </p>
            )}

            <div className={`mt-1 flex items-center gap-1 ${mio ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] ${mio ? 'text-[#D8F3DC]/70' : 'text-[#9E9892]'}`}>
                {formatTime(mensaje.created_at)}
              </span>
              {mio && (
                <span className={`text-[10px] ${mensaje.leido ? 'text-[#D8F3DC]' : 'text-[#D8F3DC]/50'}`}>
                  {mensaje.leido ? '✓✓' : '✓'}
                </span>
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
      <div className="flex flex-1 items-center justify-center gap-2 p-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D8F3DC] border-t-[#1B4332]" />
        <span className="text-sm text-[#9E9892]">Cargando mensajes...</span>
      </div>
    )
  }

  if (mensajes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
          <span className="text-2xl">💬</span>
        </div>
        <p className="text-sm text-[#6B6560]">Inicia la conversación</p>
        <p className="text-xs text-[#9E9892]">Envía un mensaje o usa una respuesta rápida</p>
      </div>
    )
  }

  const grupos = agruparMensajesPorFecha(mensajes)

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <AnimatePresence initial={false}>
        {grupos.map((grupo) => (
          <div key={grupo.fecha}>
            <div className="flex items-center justify-center py-2">
              <span className="rounded-full bg-[#F4F1EC] px-3 py-1 text-[10px] font-medium text-[#9E9892]">
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
