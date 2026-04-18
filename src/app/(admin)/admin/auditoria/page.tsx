'use client'

import { useState, useEffect, startTransition } from 'react'
import { motion } from 'framer-motion'
import {
  ScrollText, Loader2, Shield, Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getAuditLogAdmin } from '@/actions/admin-auditoria.actions'

interface AuditEntry {
  id: string
  admin_id: string
  accion: string
  entidad: string
  entidad_id: string | null
  detalles: Record<string, unknown>
  ip: string | null
  user_agent: string | null
  created_at: string
  usuarios: { nombre: string; apellido: string; email: string } | null
}

const ENTIDADES = ['TODOS', 'usuario', 'propiedad', 'reserva', 'pago', 'verificacion', 'wallet', 'resena', 'notificacion', 'configuracion'] as const

const ENTIDAD_LABELS: Record<string, string> = {
  usuario: 'Usuario',
  propiedad: 'Propiedad',
  reserva: 'Reserva',
  pago: 'Pago',
  verificacion: 'Verificación',
  wallet: 'Wallet',
  resena: 'Reseña',
  notificacion: 'Notificación',
  configuracion: 'Configuración',
}

const ENTIDAD_COLORS: Record<string, string> = {
  usuario: 'bg-[#E0F2FE] text-[#0369A1]',
  propiedad: 'bg-[#D8F3DC] text-[#1B4332]',
  reserva: 'bg-[#FEF3C7] text-[#92400E]',
  pago: 'bg-[#DBEAFE] text-[#1E40AF]',
  verificacion: 'bg-[#F3E8FF] text-[#7C3AED]',
  wallet: 'bg-[#FEF9E7] text-[#B8860B]',
  resena: 'bg-[#E8E4DF] text-[#6B6560]',
  notificacion: 'bg-[#FCE7F3] text-[#9D174D]',
  configuracion: 'bg-[#F0FDF4] text-[#166534]',
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function formatDateTime(s: string) {
  return new Date(s).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminAuditoriaPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [filtroEntidad, setFiltroEntidad] = useState<string>('TODOS')

  const cargarDatos = async () => {
    const res = await getAuditLogAdmin({ entidad: filtroEntidad })
    if (res.error) {
      toast.error(res.error)
    } else {
      setLogs((res.data || []) as unknown as AuditEntry[])
      setTotal(res.total ?? 0)
    }
    setCargando(false)
  }

  useEffect(() => { startTransition(() => { cargarDatos() }) }, [filtroEntidad])

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
            <ScrollText className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Auditoría</h1>
            <p className="text-sm text-white/60 mt-0.5">Registro completo de acciones administrativas · {total} registros</p>
          </div>
        </div>
      </motion.div>

      {/* ====== FILTRO ENTIDAD ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#E8E4DF] bg-white p-1">
        {ENTIDADES.map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEntidad(e)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              filtroEntidad === e ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {e === 'TODOS' ? 'Todos' : ENTIDAD_LABELS[e]}
          </button>
        ))}
      </motion.div>

      {/* ====== LOG LIST ====== */}
      <motion.div variants={stagger} className="space-y-1.5">
        {logs.map((entry) => (
          <motion.div key={entry.id} variants={fadeUp}>
            <div className="rounded-xl border border-[#E8E4DF] bg-white px-4 py-3 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8F6F3]">
                <Shield className="h-3.5 w-3.5 text-[#9E9892]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {entry.accion.replace(/_/g, ' ')}
                  </p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ENTIDAD_COLORS[entry.entidad] || 'bg-[#E8E4DF] text-[#6B6560]'}`}>
                    {ENTIDAD_LABELS[entry.entidad] || entry.entidad}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9E9892]">
                  <span>{entry.usuarios ? `${entry.usuarios.nombre} ${entry.usuarios.apellido}` : 'Admin'}</span>
                  <span className="text-[#E8E4DF]">·</span>
                  <span>{formatDateTime(entry.created_at)}</span>
                  {entry.ip && (
                    <>
                      <span className="text-[#E8E4DF]">·</span>
                      <span className="font-mono">{entry.ip}</span>
                    </>
                  )}
                </div>
              </div>

              {entry.entidad_id && (
                <span className="shrink-0 text-[10px] font-mono text-[#9E9892] bg-[#F8F6F3] rounded px-2 py-1">
                  {entry.entidad_id.slice(0, 8)}...
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9E9892]">
          <ScrollText className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay registros de auditoría</p>
        </div>
      )}
    </motion.div>
  )
}
