'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Star, Loader2, Trash2, EyeOff, Eye, MessageSquare,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getResenasAdmin, moderarResenaAdmin } from '@/actions/admin-resenas.actions'

interface Resena {
  id: string
  calificacion: number
  limpieza: number | null
  comunicacion: number | null
  ubicacion: number | null
  valor: number | null
  comentario: string
  respuesta: string | null
  fecha_creacion: string
  fecha_respuesta: string | null
  oculta: boolean
  propiedades: { id: string; titulo: string } | null
  usuarios: { id: string; nombre: string; apellido: string; email: string } | null
  reservas: { id: string; codigo: string } | null
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= value ? 'fill-[#F5D060] text-[#D4A017]' : 'text-[#E8E4DF]'}`} />
      ))}
    </div>
  )
}

export default function AdminResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [stats, setStats] = useState({ total: 0, promedio: 0, distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRating, setFiltroRating] = useState<number>(0)
  const [accionando, setAccionando] = useState<string | null>(null)

  const cargarDatos = async () => {
    const res = await getResenasAdmin({ busqueda, calificacionMin: filtroRating || undefined })
    if (res.error) {
      toast.error(res.error)
    } else {
      setResenas((res.data || []) as unknown as Resena[])
      if (res.stats) setStats(res.stats as typeof stats)
    }
    setCargando(false)
  }

  useEffect(() => { startTransition(() => { cargarDatos() }) }, [filtroRating])

  useEffect(() => {
    const timer = setTimeout(() => { if (!cargando) cargarDatos() }, 400)
    return () => clearTimeout(timer)
  }, [busqueda])

  const handleModerar = async (resenaId: string, accion: string) => {
    setAccionando(resenaId)
    const formData = new FormData()
    formData.append('resenaId', resenaId)
    formData.append('accion', accion)
    const res = await moderarResenaAdmin(formData)
    if (res.error) toast.error(res.error)
    else { toast.success(`Reseña ${accion === 'eliminar' ? 'eliminada' : accion === 'ocultar' ? 'ocultada' : 'mostrada'}`); cargarDatos() }
    setAccionando(null)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-5xl">

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Star className="h-8 w-8 text-[#F5D060]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Gestión de Reseñas</h1>
            <p className="text-sm text-white/60 mt-0.5">Modera y gestiona las reseñas del sistema</p>
          </div>
        </div>

        <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-3">
          <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <MessageSquare className="h-3.5 w-3.5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Total</p>
              <p className="text-sm font-bold text-white tabular-nums">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Star className="h-3.5 w-3.5 text-[#F5D060]" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Promedio</p>
              <p className="text-sm font-bold text-white tabular-nums">{stats.promedio}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Star className="h-3.5 w-3.5 text-white/60" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">5 estrellas</p>
              <p className="text-sm font-bold text-white tabular-nums">{stats.distribucion[5]}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ====== TOOLBAR ====== */}
      <motion.div variants={fadeUp} className="mb-4">
        <div className="relative">
          <Star className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar en comentarios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-[#E8E4DF] bg-white pl-10 h-11 rounded-xl"
          />
        </div>
      </motion.div>

      {/* ====== FILTRO RATING ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 rounded-xl border border-[#E8E4DF] bg-white p-1">
        {[0, 5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => setFiltroRating(r)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              filtroRating === r ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {r === 0 ? 'Todas' : <>{r} <Star className="h-3 w-3" /></>}
          </button>
        ))}
      </motion.div>

      {/* ====== LISTA RESEÑAS ====== */}
      <motion.div variants={stagger} className="space-y-2">
        {resenas.map((r) => (
          <motion.div key={r.id} variants={fadeUp}>
            <div className={`rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden transition-all ${r.oculta ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C] text-xs font-bold text-white">
                  {r.usuarios ? `${r.usuarios.nombre.charAt(0)}${r.usuarios.apellido.charAt(0)}` : '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-[#1A1A1A]">
                      {r.usuarios ? `${r.usuarios.nombre} ${r.usuarios.apellido}` : 'Usuario eliminado'}
                    </p>
                    <StarRating value={r.calificacion} />
                    {r.oculta && (
                      <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#C1121F]">OCULTA</span>
                    )}
                  </div>
                  <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap line-clamp-2 mb-1">{r.comentario}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9E9892]">
                    {r.propiedades && <span>{r.propiedades.titulo}</span>}
                    <span>{new Date(r.fecha_creacion).toLocaleDateString('es-VE')}</span>
                    {r.limpieza && <span>Limp: {r.limpieza}</span>}
                    {r.comunicacion && <span>Com: {r.comunicacion}</span>}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {r.oculta ? (
                    <button
                      title="Mostrar"
                      disabled={accionando === r.id}
                      onClick={() => handleModerar(r.id, 'mostrar')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#D8F3DC] hover:text-[#1B4332]"
                    >
                      {accionando === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  ) : (
                    <button
                      title="Ocultar"
                      disabled={accionando === r.id}
                      onClick={() => handleModerar(r.id, 'ocultar')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#FEF3C7] hover:text-[#92400E]"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    title="Eliminar"
                    disabled={accionando === r.id}
                    onClick={() => { if (confirm('¿Eliminar esta reseña?')) handleModerar(r.id, 'eliminar') }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#FEE2E2] hover:text-[#C1121F]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {resenas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9E9892]">
          <Star className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No se encontraron reseñas</p>
        </div>
      )}
    </motion.div>
  )
}
