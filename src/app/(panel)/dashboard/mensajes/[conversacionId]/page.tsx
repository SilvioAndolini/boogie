'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Conversacion } from '@/types/chat'
import { obtenerOCrearConversacion, getMensajesRapidos, seedMensajesRapidos } from '@/actions/chat.actions'
import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
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
      const admin = createAdminClient()

      const { data: conv } = await admin
        .from('conversaciones')
        .select(`
          participante_1, participante_2,
          p1:usuarios!participante_1(id, nombre, apellido, avatar_url),
          p2:usuarios!participante_2(id, nombre, apellido, avatar_url),
          propiedad:propiedades(id, titulo)
        `)
        .eq('id', conversacionId)
        .single()

      if (!conv) {
        setLoadingInfo(false)
        return
      }

      const c = conv as Record<string, unknown>
      const esP1 = true

      const user = await getUsuarioAutenticado()
      if (!user) {
        setLoadingInfo(false)
        return
      }

      setMiId(user.id)

      const esParticipante1 = c.participante_1 === user.id
      const otro = esParticipante1 ? c.p2 : c.p1
      setOtroUsuario(otro as Conversacion['otro_usuario'])
      setPropiedad(c.propiedad as Conversacion['propiedad'])

      const { data: userData } = await admin
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (userData) {
        const rol = (userData as Record<string, unknown>).rol as string
        await seedMensajesRapidos(rol)
      }

      setLoadingInfo(false)
    }
    load()
  }, [conversacionId])

  const { mensajes, loading: loadingMessages, sending, send, sendImage } = useChat(conversacionId, miId)

  if (loadingInfo) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E8E4DF] px-4 py-3">
        <button
          onClick={() => router.push('/dashboard/mensajes')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-colors hover:bg-[#F4F1EC] hover:text-[#1A1A1A]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="relative">
          {otroUsuario?.avatar_url ? (
            <img src={otroUsuario.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4332] text-sm font-bold text-white">
              {getInitials(otroUsuario?.nombre, otroUsuario?.apellido)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-[#1A1A1A]">
            {otroUsuario ? `${otroUsuario.nombre} ${otroUsuario.apellido}` : 'Usuario'}
          </p>
          {propiedad && (
            <p className="truncate text-[11px] text-[#9E9892]">
              📍 {propiedad.titulo}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ChatMessages mensajes={mensajes} miId={miId || ''} loading={loadingMessages} />

      {/* Input */}
      <ChatInput
        onSend={(contenido, tipo) => send(contenido, tipo)}
        onSendImage={(file) => sendImage(file)}
        sending={sending}
      />
    </motion.div>
  )
}
