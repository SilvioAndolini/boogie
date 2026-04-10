'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Conversacion } from '@/types/chat'
import { getConversaciones } from '@/actions/chat.actions'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `${diffMin}m`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d`
  return new Date(dateStr).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })
}

function getInitials(nombre?: string, apellido?: string) {
  return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase() || '?'
}

export default function MensajesPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const res = await getConversaciones()
      if (res.exito) setConversaciones(res.datos || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Mensajes</h1>
          <p className="text-sm text-[#9E9892]">Tus conversaciones con anfitriones y huéspedes</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E8E4DF] bg-white p-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-[#F4F1EC]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[#F4F1EC]" />
                <div className="h-3 w-48 animate-pulse rounded bg-[#F4F1EC]" />
              </div>
            </div>
          ))}
        </div>
      ) : conversaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#E8E4DF] bg-white py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D8F3DC]">
            <MessageCircle className="h-8 w-8 text-[#1B4332]" />
          </div>
          <p className="text-sm font-medium text-[#1A1A1A]">Sin conversaciones</p>
          <p className="text-xs text-[#9E9892]">Contacta a un anfitrión desde el detalle de un Boogie</p>
          <Link
            href="/propiedades"
            className="mt-2 rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#2D6A4F]"
          >
            Explorar Boogies
          </Link>
        </div>
      ) : (
        <motion.div variants={stagger} className="space-y-2">
          {conversaciones.map((conv) => {
            const otro = conv.otro_usuario
            return (
              <motion.div
                key={conv.id}
                variants={fadeUp}
                onClick={() => router.push(`/dashboard/mensajes/${conv.id}`)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[#E8E4DF] bg-white p-4 transition-all hover:border-[#52B788] hover:shadow-sm"
              >
                <div className="relative shrink-0">
                  {otro?.avatar_url ? (
                    <img
                      src={otro.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-sm font-bold text-white">
                      {getInitials(otro?.nombre, otro?.apellido)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                      {otro ? `${otro.nombre} ${otro.apellido}` : 'Usuario'}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#9E9892]">
                      {timeAgo(conv.ultimo_mensaje_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-[#6B6560]">
                      {conv.ultimo_mensaje_preview || 'Sin mensajes aún'}
                    </p>
                    {conv.no_leidos && conv.no_leidos > 0 ? (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1B4332] px-1.5 text-[10px] font-bold text-white">
                        {conv.no_leidos}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-[#9E9892] transition-colors group-hover:text-[#1B4332]" />
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
