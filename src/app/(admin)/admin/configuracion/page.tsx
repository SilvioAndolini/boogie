'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Loader2, Bell, Send, DollarSign, Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { enviarNotificacionAdmin } from '@/actions/admin-notificaciones.actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { METODOS_PAGO, COMISION_PLATAFORMA_HUESPED, COMISION_PLATAFORMA_ANFITRION } from '@/lib/constants'

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function AdminConfiguracionPage() {
  const [enviando, setEnviando] = useState(false)
  const [notiTitulo, setNotiTitulo] = useState('')
  const [notiMensaje, setNotiMensaje] = useState('')

  const handleEnviarNotificacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    const formData = new FormData()
    formData.append('titulo', notiTitulo)
    formData.append('mensaje', notiMensaje)
    const res = await enviarNotificacionAdmin(formData)
    if (res.error) {
      toast.error(res.error)
    } else if ('broadcast' in res && res.broadcast) {
      toast.success(`Notificación enviada a ${res.total} usuarios`)
    } else {
      toast.success('Notificación enviada')
    }
    setNotiTitulo('')
    setNotiMensaje('')
    setEnviando(false)
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-5xl">

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Configuración</h1>
            <p className="text-sm text-white/60 mt-0.5">Ajustes generales de la plataforma</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ====== COMISIONES ====== */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Comisiones de plataforma
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-[#9E9892]">Comisión huésped</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
              <span className="font-bold text-[#1B4332]">{(COMISION_PLATAFORMA_HUESPED * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <span className="text-[#9E9892]">Comisión anfitrión</span>
              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
              <span className="font-bold text-[#1B4332]">{(COMISION_PLATAFORMA_ANFITRION * 100).toFixed(0)}%</span>
            </div>
            <p className="text-[10px] text-[#9E9892] pt-1">Configuradas vía variables de entorno (COMISION_PLATAFORMA_HUESPED, COMISION_PLATAFORMA_ANFITRION)</p>
          </div>
        </motion.div>

        {/* ====== MÉTODOS DE PAGO ====== */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Métodos de pago activos
          </h3>
          <div className="space-y-2">
            {Object.entries(METODOS_PAGO).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-[#1B4332]" />
                <span className="text-[#1A1A1A]">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ====== ROLES ====== */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Jerarquía de roles
          </h3>
          <div className="space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-[#FEF9E7] to-white border border-[#F5D060]/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide" style={{
                  background: 'linear-gradient(135deg, #D4A017 0%, #F5D060 25%, #D4A017 50%)',
                  color: '#3D2E00',
                  boxShadow: '0 1px 2px rgba(212,160,23,0.3)',
                }}>
                  CEO
                </span>
                <span className="text-sm font-semibold text-[#1A1A1A]">Admin Maestro</span>
              </div>
              <p className="text-xs text-[#6B6560]">Control total. Puede gestionar otros admins y configurar la plataforma.</p>
            </div>
            <div className="rounded-xl bg-[#F8F6F3] border border-[#E8E4DF] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-bold text-[#7C3AED]">ADMIN</span>
                <span className="text-sm font-semibold text-[#1A1A1A]">Administrador</span>
              </div>
              <p className="text-xs text-[#6B6560]">Gestiona usuarios, propiedades, reservas y pagos. No puede modificar otros admins.</p>
            </div>
          </div>
        </motion.div>

        {/* ====== NOTIFICACIÓN GLOBAL ====== */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9E9892] mb-4 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notificación global
          </h3>
          <p className="text-xs text-[#9E9892] mb-3">Envía una notificación a todos los usuarios activos de la plataforma</p>
          <form onSubmit={handleEnviarNotificacion} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Título</Label>
              <Input
                value={notiTitulo}
                onChange={(e) => setNotiTitulo(e.target.value)}
                placeholder="Ej: Mantenimiento programado"
                required
                minLength={3}
                disabled={enviando}
                className="border-[#E8E4DF] bg-white h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Mensaje</Label>
              <textarea
                value={notiMensaje}
                onChange={(e) => setNotiMensaje(e.target.value)}
                placeholder="Escribe el mensaje para todos los usuarios..."
                required
                minLength={5}
                disabled={enviando}
                rows={3}
                className="flex w-full rounded-xl border border-[#E8E4DF] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={enviando || !notiTitulo || !notiMensaje}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-medium text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-60"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar a todos
            </button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}
