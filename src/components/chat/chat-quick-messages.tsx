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
    <div className="border-b border-[#E8E4DF] bg-[#FEFCF9] px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-[#1A1A1A]">⚡ Mensajes rápidos</span>
        <button onClick={onClose} className="text-[#9E9892] hover:text-[#1A1A1A]">
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
                className="w-48 rounded-lg border border-[#52B788] bg-white px-2 py-1 text-xs outline-none"
                autoFocus
              />
              <button
                onClick={() => handleEditar(m.id)}
                className="text-[#52B788] hover:text-[#1B4332]"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onSelect(m.contenido)}
              onDoubleClick={() => {
                setEditando(m.id)
                setNuevoTexto(m.contenido)
              }}
              className="group flex items-center gap-1 rounded-full border border-[#E8E4DF] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] transition-colors hover:border-[#52B788] hover:bg-[#D8F3DC]/50"
            >
              {m.contenido}
              <button
                onClick={(e) => { e.stopPropagation(); handleEliminar(m.id) }}
                className="ml-1 hidden text-[#9E9892] hover:text-[#E76F51] group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.button>
          )
        )}
      </div>

      <div className="mt-2 flex items-center gap-1">
        <input
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !editando && handleCrear()}
          placeholder="Agregar mensaje rápido..."
          className="flex-1 rounded-lg border border-dashed border-[#E8E4DF] bg-white px-2 py-1 text-xs outline-none placeholder-[#9E9892] focus:border-[#52B788]"
          disabled={agregando}
        />
        <button
          onClick={handleCrear}
          disabled={!nuevoTexto.trim() || agregando}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[#9E9892] transition-colors hover:bg-[#D8F3DC] hover:text-[#1B4332] disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
