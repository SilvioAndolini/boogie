'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowRight, Loader2, Search } from 'lucide-react'
import { Conversacion } from '@/types/chat'
import { getConversaciones } from '@/actions/chat.actions'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
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
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const res = await getConversaciones()
      if (res.exito) setConversaciones(res.datos || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = search.trim()
    ? conversaciones.filter((c) => {
        const nombre = `${c.otro_usuario?.nombre || ''} ${c.otro_usuario?.apellido || ''}`.toLowerCase()
        return nombre.includes(search.toLowerCase()) || (c.ultimo_mensaje_preview || '').toLowerCase().includes(search.toLowerCase())
      })
    : conversaciones

  const totalNoLeidos = conversaciones.reduce((acc, c) => acc + (c.no_leidos || 0), 0)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-4 right-20 h-20 w-20 rounded-full bg-white/[0.03]" />
        <div className="relative flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Mensajes</h1>
            <p className="text-sm text-white/70">Tus conversaciones con anfitriones y huéspedes</p>
          </div>
          {totalNoLeidos > 0 && (
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-white/20 px-2 text-sm font-bold text-white">
              {totalNoLeidos}
            </span>
          )}
        </div>
      </div>

      {conversaciones.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full rounded-xl border border-[#E8E4DF] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#9E9892] outline-none transition-colors focus:border-[#52B788] focus:ring-1 focus:ring-[#52B788]/30"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-[#E8E4DF] bg-white p-5">
              <div className="h-12 w-12 animate-pulse rounded-full bg-[#F4F1EC]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[#F4F1EC]" />
                <div className="h-3 w-48 animate-pulse rounded bg-[#F4F1EC]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E4DF] bg-white">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#F8F6F3]">
              <MessageCircle className="h-6 w-6 text-[#9E9892]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              {search ? 'Sin resultados' : 'Sin conversaciones'}
            </h3>
            <p className="mt-1 text-xs text-[#9E9892]">
              {search ? 'Intenta con otro término' : 'Contacta a un anfitrión desde el detalle de un Boogie'}
            </p>
            {!search && (
              <Link
                href="/propiedades"
                className="mt-4 rounded-xl bg-[#1B4332] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#2D6A4F]"
              >
                Explorar Boogies
              </Link>
            )}
          </div>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
          {filtered.map((conv) => {
            const otro = conv.otro_usuario
            return (
              <motion.div
                key={conv.id}
                variants={fadeUp}
                onClick={() => router.push(`/dashboard/mensajes/${conv.id}`)}
                className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-[#E8E4DF] bg-white p-5 transition-all hover:border-[#52B788]/50 hover:shadow-sm"
              >
                <div className="relative shrink-0">
                  {otro?.avatar_url ? (
                    <img src={otro.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#F4F1EC]" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C] text-sm font-bold text-white ring-2 ring-[#F4F1EC]">
                      {getInitials(otro?.nombre, otro?.apellido)}
                    </div>
                  )}
                  {conv.no_leidos && conv.no_leidos > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E76F51] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {conv.no_leidos}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${conv.no_leidos && conv.no_leidos > 0 ? 'font-bold text-[#1A1A1A]' : 'font-semibold text-[#1A1A1A]'}`}>
                      {otro ? `${otro.nombre} ${otro.apellido}` : 'Usuario'}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#9E9892]">
                      {timeAgo(conv.ultimo_mensaje_at)}
                    </span>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${conv.no_leidos && conv.no_leidos > 0 ? 'font-medium text-[#1A1A1A]' : 'text-[#6B6560]'}`}>
                    {conv.ultimo_mensaje_preview || 'Sin mensajes aún'}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 shrink-0 text-[#E8E4DF] transition-colors group-hover:text-[#1B4332]" />
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
