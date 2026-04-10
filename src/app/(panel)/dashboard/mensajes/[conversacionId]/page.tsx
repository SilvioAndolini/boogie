'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, ShieldCheck, MapPin } from 'lucide-react'
import { Conversacion } from '@/types/chat'
import { getConversacionInfo } from '@/actions/chat.actions'
import { useChat } from '@/hooks/use-chat'
import { ChatMessages } from '@/components/chat/chat-messages'
import { ChatInput } from '@/components/chat/chat-input'

function getInitials(nombre?: string, apellido?: string) {
  return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || '?'
}

export default function ConversacionPage() {
  const params = useParams()
  const router = useRouter()
  const conversacionId = params.conversacionId as string

  const [miId, setMiId] = useState<string | null>(null)
  const [otroUsuario, setOtroUsuario] = useState<Conversacion['otro_usuario'] | null>(null)
  const [propiedad, setPropiedad] = useState<Conversacion['propiedad'] | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await getConversacionInfo(conversacionId)
      if (!res.exito) {
        setLoadingInfo(false)
        return
      }

      setMiId(res.miId || null)
      setOtroUsuario(res.otroUsuario || null)
      setPropiedad(res.propiedad || null)
      setLoadingInfo(false)
    }
    load()
  }, [conversacionId])

  const { mensajes, loading: loadingMessages, sending, send, sendImage } = useChat(conversacionId, miId)

  if (loadingInfo) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#52B788]" />
          <span className="text-xs text-[#9E9892]">Cargando conversación...</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white"
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={() => router.push('/dashboard/mensajes')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="relative">
            {otroUsuario?.avatar_url ? (
              <img src={otroUsuario.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-2 ring-white/20">
                {getInitials(otroUsuario?.nombre, otroUsuario?.apellido)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {otroUsuario ? `${otroUsuario.nombre} ${otroUsuario.apellido}` : 'Usuario'}
            </p>
            {propiedad && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-white/50" />
                <p className="truncate text-[11px] text-white/60">{propiedad.titulo}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatMessages mensajes={mensajes} miId={miId || ''} loading={loadingMessages} />

      <ChatInput
        onSend={(contenido, tipo) => send(contenido, tipo)}
        onSendImage={(file) => sendImage(file)}
        sending={sending}
      />
    </motion.div>
  )
}
