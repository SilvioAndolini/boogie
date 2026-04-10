'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mensaje } from '@/types/chat'
import { getMensajes, enviarMensaje, subirImagenChat } from '@/actions/chat.actions'
import { CHAT_REALTIME_CHANNEL } from '@/lib/chat/constants'

export function useChat(conversacionId: string | null, miId: string | null) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const channelRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (!conversacionId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      const res = await getMensajes(conversacionId!)
      if (!cancelled && res.exito) {
        setMensajes(res.datos || [])
      }
      setLoading(false)
    }

    load()

    const supabase = createClient()
    const channel = supabase
      .channel(`${CHAT_REALTIME_CHANNEL}:${conversacionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        (payload) => {
          const nuevo = payload.new as unknown as Mensaje
          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
        }
      )
      .subscribe()

    channelRef.current = channel as unknown as typeof channelRef.current

    return () => {
      cancelled = true
      channel.unsubscribe()
    }
  }, [conversacionId])

  const send = useCallback(async (contenido: string, tipo: 'texto' | 'rapido' = 'texto') => {
    if (!conversacionId || !contenido.trim()) return null
    setSending(true)
    const res = await enviarMensaje(conversacionId, contenido, tipo)
    setSending(false)
    if (res.exito && res.datos) {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === res.datos!.id)) return prev
        return [...prev, res.datos!]
      })
    }
    return res
  }, [conversacionId])

  const sendImage = useCallback(async (file: File) => {
    if (!conversacionId) return null
    setSending(true)
    const fd = new FormData()
    fd.append('imagen', file)
    const uploadRes = await subirImagenChat(fd)
    if (!uploadRes.exito) {
      setSending(false)
      return uploadRes
    }
    const res = await enviarMensaje(conversacionId, '', 'imagen', uploadRes.url)
    setSending(false)
    if (res.exito && res.datos) {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === res.datos!.id)) return prev
        return [...prev, res.datos!]
      })
    }
    return res
  }, [conversacionId])

  const loadMore = useCallback(async (offset: number) => {
    if (!conversacionId) return
    const res = await getMensajes(conversacionId, offset)
    if (res.exito && res.datos) {
      setMensajes((prev) => [...res.datos!, ...prev])
    }
  }, [conversacionId])

  return { mensajes, loading, sending, send, sendImage, loadMore }
}
