'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, MoreVertical, Pencil, Trash2, Trophy, Clock, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { TIPOS_CANCHA } from '@/lib/constants'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease },
  },
}

function CanchaCard({ cancha }: { cancha: Record<string, unknown> }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const imagen = (cancha.imagenes as { url: string }[] | undefined)?.[0]?.url
  const tipoCancha = (cancha.tipoCancha as string) || 'MULTIDEPORTE'
  const precioHora = cancha.precioPorHora as number | null
  const moneda = (cancha.moneda as string) || 'USD'
  const estado = (cancha.estadoPublicacion as string) || 'BORRADOR'
  const rating = cancha.ratingPromedio as number || 0
  const totalResenas = cancha.totalResenas as number || 0

  const estadoColors: Record<string, string> = {
    PUBLICADA: 'bg-[#D8F3DC] text-[#1B4332]',
    BORRADOR: 'bg-[#F0EDE8] text-[#6B6560]',
    PAUSADA: 'bg-[#FEF3C7] text-[#92400E]',
    PENDIENTE_REVISION: 'bg-[#DBEAFE] text-[#1E40AF]',
    SUSPENDIDA: 'bg-[#FEE2E2] text-[#991B1B]',
  }

  return (
    <motion.div variants={cardVariants} className="overflow-hidden rounded-xl border border-[#E8E4DF] bg-white">
      <div className="mx-3 mt-3 overflow-hidden rounded-xl">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#D8F3DC] to-[#B7E4C7]">
          {imagen ? (
            <img src={imagen} alt={cancha.titulo as string} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Trophy className="h-12 w-12 text-[#1B4332]/30" />
            </div>
          )}
          <div className="absolute left-2 top-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estadoColors[estado] || 'bg-[#F0EDE8] text-[#6B6560]'}`}>
              {estado.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="absolute right-2 top-2">
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#1B4332]">
              <Trophy className="h-3 w-3" />
              {TIPOS_CANCHA[tipoCancha as keyof typeof TIPOS_CANCHA] || tipoCancha}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 px-4 pb-4 pt-3">
        <h3 className="truncate text-sm font-semibold text-[#1A1A1A]">{cancha.titulo as string}</h3>
        <p className="text-xs text-[#6B6560]">{cancha.ciudad as string}, {cancha.estado as string}</p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-sm font-bold text-[#1B4332]">
            <DollarSign className="h-3.5 w-3.5" />
            {precioHora ? `${precioHora}` : '—'}
            <span className="text-[10px] font-normal text-[#6B6560]">/{moneda}/h</span>
          </div>
          {totalResenas > 0 && (
            <span className="text-[11px] text-[#6B6560]">★ {rating.toFixed(1)} ({totalResenas})</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/canchas/${cancha.id}`}
            className="flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver
          </Link>
          <Link
            href={`/dashboard/mis-canchas/${cancha.id as string}/editar`}
            className="flex items-center gap-1 text-xs font-medium text-[#6B6560] hover:text-[#1A1A1A]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export function CanchaListClient({ canchas }: { canchas: Record<string, unknown>[] }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 400)
    return () => clearTimeout(t)
  }, [])

  if (!loaded) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-[#E8E4DF] bg-[#F8F6F3]" />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {canchas.map((cancha) => (
        <CanchaCard key={cancha.id as string} cancha={cancha} />
      ))}
    </motion.div>
  )
}
