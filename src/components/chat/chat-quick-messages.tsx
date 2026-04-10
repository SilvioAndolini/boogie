'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Pencil, Plus, Trash2, Loader2 } from 'lucide-react'
import { MensajeRapido } from '@/types/chat'
import { getMensajesRapidos, crearMensajeRapido, actualizarMensajeRapido, eliminarMensajeRapido } from '@/actions/chat.actions'

interface ChatQuickMessagesProps {
  onSelect: (contenido: string) => void
  onClose: () => void
}

export function ChatQuickMessages({ onSelect, onClose }: ChatQuickMessagesProps) {
  const [mensajes, setMensajes] = useState<MensajeRapido[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [agregando, setAgregando] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await getMensajesRapidos()
      if (res.exito) setMensajes(res.datos || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleCrear() {
    if (!nuevoTexto.trim()) return
    setAgregando(true)
    const res = await crearMensajeRapido(nuevoTexto.trim())
    if (res.exito && res.datos) {
      setMensajes((prev) => [...prev, res.datos!])
      setNuevoTexto('')
    }
    setAgregando(false)
  }

  async function handleEditar(id: string) {
    if (!nuevoTexto.trim()) {
      setEditando(null)
      return
    }
    await actualizarMensajeRapido(id, nuevoTexto.trim())
    setMensajes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, contenido: nuevoTexto.trim() } : m))
    )
    setEditando(null)
    setNuevoTexto('')
  }

  async function handleEliminar(id: string) {
    await eliminarMensajeRapido(id)
    setMensajes((prev) => prev.filter((m) => m.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-[#9E9892]" />
      </div>
    )
  }

  return (
    <div className="bg-[#FEFCF9] px-4 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#1B4332]" />
          <span className="text-xs font-bold text-[#1A1A1A]">Respuestas rápidas</span>
        </div>
        <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-lg text-[#9E9892] transition-colors hover:bg-[#E8E4DF] hover:text-[#1A1A1A]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {mensajes.map((m) =>
          editando === m.id ? (
            <div key={m.id} className="flex items-center gap-1">
              <input
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditar(m.id)}
                className="w-52 rounded-lg border border-[#52B788] bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-[#52B788]/30"
                autoFocus
              />
              <button
                onClick={() => handleEditar(m.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC] text-[#1B4332] transition-colors hover:bg-[#B7E4C7]"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
              layout
              onClick={() => onSelect(m.contenido)}
              onDoubleClick={() => {
                setEditando(m.id)
                setNuevoTexto(m.contenido)
              }}
              className="group relative flex items-center gap-1.5 overflow-hidden rounded-full border border-[#E8E4DF] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] shadow-sm transition-all hover:border-[#52B788] hover:bg-[#D8F3DC]/30 hover:shadow"
            >
              {m.contenido}
              <button
                onClick={(e) => { e.stopPropagation(); handleEliminar(m.id) }}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[#E8E4DF] transition-colors hover:bg-[#FEE2E2] hover:text-[#E76F51]"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </motion.button>
          )
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !editando) handleCrear() }}
          placeholder="Agregar respuesta rápida..."
          className="flex-1 rounded-lg border border-dashed border-[#E8E4DF] bg-white px-3 py-1.5 text-xs outline-none placeholder-[#9E9892] transition-colors focus:border-[#52B788]"
          disabled={agregando}
        />
        <button
          onClick={handleCrear}
          disabled={!nuevoTexto.trim() || agregando}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E4DF] text-[#9E9892] transition-all hover:border-[#52B788] hover:bg-[#D8F3DC] hover:text-[#1B4332] disabled:opacity-50"
        >
          {agregando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

function Zap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  )
}
