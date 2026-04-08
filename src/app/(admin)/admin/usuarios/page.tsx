'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users as UsersIcon, Search, Loader2, Shield, EyeOff, UserPlus, Trash2, X,
  CreditCard, Phone, CalendarDays, BadgeCheck, Ban, ArrowRightLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getUsuariosAdmin, actualizarRolUsuario, eliminarUsuarioAdmin } from '@/actions/verificacion.actions'
import { registrarUsuarioAdmin } from '@/actions/admin-usuarios.actions'
import { CEO_EMAIL } from '@/lib/admin-constants'

interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono: string | null
  cedula: string | null
  verificado: boolean
  rol: 'BOOGER' | 'ANFITRION' | 'AMBOS' | 'ADMIN'
  activo: boolean
  fecha_registro: string
}

const ROL_LABELS: Record<string, string> = {
  BOOGER: 'Booger',
  ANFITRION: 'Anfitrión',
  AMBOS: 'Ambos',
  ADMIN: 'Admin',
}

const ROL_COLORS: Record<string, string> = {
  BOOGER: 'bg-[#E0F2FE] text-[#0369A1]',
  ANFITRION: 'bg-[#D8F3DC] text-[#1B4332]',
  AMBOS: 'bg-[#FEF9E7] text-[#B8860B]',
  ADMIN: 'bg-[#F3E8FF] text-[#7C3AED]',
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('TODOS')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [isCeo, setIsCeo] = useState(false)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA')
  const [codigoPais, setCodigoPais] = useState('+58')
  const [rol, setRol] = useState<string>('BOOGER')
  const registroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getUsuariosAdmin().then((res) => {
      if (cancelled) return
      if (res.error) {
        toast.error(res.error)
      } else if (res.usuarios) {
        setUsuarios(res.usuarios as Usuario[])
        setIsCeo(res.isCeo ?? false)
      }
      setCargando(false)
    }).catch(() => {
      toast.error('Error inesperado cargando usuarios')
      setCargando(false)
    })
    return () => { cancelled = true }
  }, [])

  const cargarUsuarios = async () => {
    const res = await getUsuariosAdmin()
    if (res.error) {
      toast.error(res.error)
    } else if (res.usuarios) {
      setUsuarios(res.usuarios as Usuario[])
      setIsCeo(res.isCeo ?? false)
    }
  }

  const handleActualizarRol = async (usuarioId: string, nuevoRol: string) => {
    setActualizando(usuarioId)
    const formData = new FormData()
    formData.append('usuarioId', usuarioId)
    formData.append('rol', nuevoRol)
    const res = await actualizarRolUsuario(formData)
    if (res.error) toast.error(res.error)
    else { toast.success('Rol actualizado'); await cargarUsuarios() }
    setActualizando(null)
  }

  const handleToggleActivo = async (usuarioId: string, activoActual: boolean) => {
    setActualizando(usuarioId)
    const formData = new FormData()
    formData.append('usuarioId', usuarioId)
    formData.append('activo', String(!activoActual))
    const res = await actualizarRolUsuario(formData)
    if (res.error) toast.error(res.error)
    else { toast.success(activoActual ? 'Usuario suspendido' : 'Usuario reactivado'); await cargarUsuarios() }
    setActualizando(null)
  }

  const handleEliminar = async (usuarioId: string) => {
    setActualizando(usuarioId)
    const formData = new FormData()
    formData.append('usuarioId', usuarioId)
    const res = await eliminarUsuarioAdmin(formData)
    if (res.error) toast.error(res.error)
    else { toast.success('Usuario eliminado'); await cargarUsuarios() }
    setActualizando(null)
  }

  const handleRegistro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEnviando(true)
    const formData = new FormData(e.currentTarget)
    formData.set('tipoDocumento', tipoDocumento)
    formData.set('codigoPais', codigoPais)
    formData.set('rol', rol)
    const res = await registrarUsuarioAdmin(formData)
    if (res.error) {
      toast.error(res.error)
      setEnviando(false)
      return
    }
    toast.success('Usuario registrado exitosamente')
    setEnviando(false)
    setMostrarRegistro(false)
    await cargarUsuarios()
  }

  const filtrados = usuarios.filter((u) => {
    if (filtroRol !== 'TODOS' && u.rol !== filtroRol) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cedula || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const cuentasPorRol = {
    BOOGER: usuarios.filter((u) => u.rol === 'BOOGER' || u.rol === 'AMBOS').length,
    ANFITRION: usuarios.filter((u) => u.rol === 'ANFITRION' || u.rol === 'AMBOS').length,
    ADMIN: usuarios.filter((u) => u.rol === 'ADMIN').length,
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
        <div className="absolute right-20 bottom-4 h-20 w-20 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <UsersIcon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Gestión de Usuarios</h1>
            <p className="text-sm text-white/60 mt-0.5">Administra roles, permisos y accesos del sistema</p>
          </div>
        </div>

        <div className="border-t border-white/10 grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'Total', value: usuarios.length, icon: UsersIcon },
            { label: 'Boogers', value: cuentasPorRol.BOOGER, icon: UsersIcon },
            { label: 'Anfitriones', value: cuentasPorRol.ANFITRION, icon: UsersIcon },
            { label: 'Admins', value: cuentasPorRol.ADMIN, icon: Shield },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 border-r border-white/10 last:border-r-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <item.icon className="h-3.5 w-3.5 text-white/60" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ====== TOOLBAR ====== */}
      <motion.div variants={fadeUp} className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9892]" />
          <Input
            placeholder="Buscar por nombre, email o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border-[#E8E4DF] bg-white pl-10 h-11 rounded-xl"
          />
        </div>
        <button
          onClick={() => setMostrarRegistro(!mostrarRegistro)}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#1B4332] px-5 text-sm font-medium text-white transition-all hover:bg-[#2D6A4F] shrink-0"
        >
          {mostrarRegistro ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {mostrarRegistro ? 'Cancelar' : 'Registrar usuario'}
        </button>
      </motion.div>

      {/* ====== FILTROS ROL ====== */}
      <motion.div variants={fadeUp} className="mb-6 flex gap-1 rounded-xl border border-[#E8E4DF] bg-white p-1">
        {['TODOS', 'BOOGER', 'ANFITRION', 'AMBOS', 'ADMIN'].map((r) => (
          <button
            key={r}
            onClick={() => setFiltroRol(r)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filtroRol === r ? 'bg-[#1B4332] text-white' : 'text-[#6B6560] hover:bg-[#F8F6F3]'
            }`}
          >
            {r === 'TODOS' ? 'Todos' : ROL_LABELS[r]}
          </button>
        ))}
      </motion.div>

      {/* ====== FORMULARIO REGISTRO ====== */}
      <AnimatePresence>
        {mostrarRegistro && (
          <motion.div
            ref={registroRef}
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#E8E4DF] bg-gradient-to-br from-white to-[#F8F6F3]">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#1B4332]/[0.03]" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[#1B4332]/[0.03]" />

              <div className="relative p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8F3DC]">
                    <UserPlus className="h-5 w-5 text-[#1B4332]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1A1A1A]">Nuevo usuario</h2>
                    <p className="text-xs text-[#6B6560]">Registro directo sin verificación OTP</p>
                  </div>
                </div>

                <form onSubmit={handleRegistro} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Nombre</Label>
                      <Input name="nombre" placeholder="María" required minLength={2} disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Apellido</Label>
                      <Input name="apellido" placeholder="García" required minLength={2} disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Correo electrónico</Label>
                    <Input name="email" type="email" placeholder="maria@ejemplo.com" required disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Contraseña</Label>
                      <Input name="password" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Confirmar</Label>
                      <Input name="confirmPassword" type="password" placeholder="Repetir contraseña" required minLength={8} disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Tipo documento</Label>
                      <Select value={tipoDocumento} onValueChange={(v) => { if (v) setTipoDocumento(v as 'CEDULA' | 'PASAPORTE') }} disabled={enviando}>
                        <SelectTrigger className="border-[#E8E4DF] bg-white h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CEDULA">Cédula</SelectItem>
                          <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">{tipoDocumento === 'CEDULA' ? 'Número de cédula' : 'Número de pasaporte'}</Label>
                      <Input name="numeroDocumento" placeholder={tipoDocumento === 'CEDULA' ? 'V-12345678' : 'A12345678'} required minLength={4} disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Código país</Label>
                      <Select value={codigoPais} onValueChange={(v) => { if (v) setCodigoPais(v) }} disabled={enviando}>
                        <SelectTrigger className="border-[#E8E4DF] bg-white h-10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+58">+58 (Venezuela)</SelectItem>
                          <SelectItem value="+1">+1 (EE.UU.)</SelectItem>
                          <SelectItem value="+57">+57 (Colombia)</SelectItem>
                          <SelectItem value="+53">+53 (Cuba)</SelectItem>
                          <SelectItem value="+52">+52 (México)</SelectItem>
                          <SelectItem value="+54">+54 (Argentina)</SelectItem>
                          <SelectItem value="+56">+56 (Chile)</SelectItem>
                          <SelectItem value="+51">+51 (Perú)</SelectItem>
                          <SelectItem value="+34">+34 (España)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Teléfono</Label>
                      <Input name="telefono" type="tel" placeholder="4121234567" required minLength={7} disabled={enviando} className="border-[#E8E4DF] bg-white h-10 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Rol del usuario</Label>
                    <Select value={rol} onValueChange={(v) => { if (v) setRol(v) }} disabled={enviando}>
                      <SelectTrigger className="border-[#E8E4DF] bg-white h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOOGER">Booger</SelectItem>
                        <SelectItem value="ANFITRION">Anfitrión</SelectItem>
                        <SelectItem value="AMBOS">Ambos</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMostrarRegistro(false)}
                      disabled={enviando}
                      className="flex-1 flex h-11 items-center justify-center rounded-xl border border-[#E8E4DF] text-sm font-medium text-[#6B6560] transition-colors hover:bg-[#F8F6F3]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1B4332] text-sm font-medium text-white transition-all hover:bg-[#2D6A4F] disabled:opacity-60"
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Registrar usuario
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== LISTA USUARIOS ====== */}
      <motion.div variants={stagger} className="space-y-2">
        {filtrados.map((u) => {
          const expandidoCurrent = expandido === u.id
          const esCeo = u.email === CEO_EMAIL
          const esAdmin = u.rol === 'ADMIN'
          const puedeModificar = esCeo ? false : (esAdmin ? isCeo : true)
          return (
            <motion.div key={u.id} variants={fadeUp}>
              <div className={`group rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden transition-all ${!u.activo ? 'opacity-50' : ''}`}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setExpandido(expandidoCurrent ? null : u.id)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#40916C] text-xs font-bold text-white">
                      {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#1A1A1A] truncate">{u.nombre} {u.apellido}</p>
                        {!u.activo && (
                          <span className="shrink-0 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-bold text-[#991B1B]">Suspendido</span>
                        )}
                      </div>
                      <p className="text-xs text-[#9E9892] truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    {u.verificado && (
                      <BadgeCheck className="h-4 w-4 text-[#1B4332]" />
                    )}
                    {esCeo ? (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider" style={{
                        background: 'linear-gradient(135deg, #D4A017 0%, #F5D060 25%, #D4A017 50%, #AA8A15 75%, #F5D060 100%)',
                        color: '#3D2E00',
                        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
                        boxShadow: '0 1px 3px rgba(212,160,23,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                        border: '1px solid rgba(212,160,23,0.5)',
                      }}>
                        CEO
                      </span>
                    ) : u.rol === 'AMBOS' ? (
                      <div className="flex gap-1">
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-[#E0F2FE] text-[#0369A1]">Booger</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-[#D8F3DC] text-[#1B4332]">Anfitrión</span>
                      </div>
                    ) : (
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${ROL_COLORS[u.rol]}`}>
                        {ROL_LABELS[u.rol]}
                      </span>
                    )}
                    <svg className={`h-4 w-4 text-[#9E9892] transition-transform duration-300 ${expandidoCurrent ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                <AnimatePresence>
                  {expandidoCurrent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#E8E4DF]">
                        <div className="px-5 py-4">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2.5 text-sm">
                              <CreditCard className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                              <span className="text-[#9E9892]">Documento</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A]">{u.cedula || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm">
                              <Phone className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                              <span className="text-[#9E9892]">Teléfono</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A]">{u.telefono || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm">
                              <BadgeCheck className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                              <span className="text-[#9E9892]">Verificado</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className={`font-medium ${u.verificado ? 'text-[#1B4332]' : 'text-[#C1121F]'}`}>{u.verificado ? 'Sí' : 'No'}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm">
                              <CalendarDays className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                              <span className="text-[#9E9892]">Registro</span>
                              <span className="flex-1 border-b border-dotted border-[#E8E4DF] min-w-[12px]" />
                              <span className="font-medium text-[#1A1A1A]">{new Date(u.fecha_registro).toLocaleDateString('es-VE')}</span>
                            </div>
                          </div>
                        </div>

                        {puedeModificar ? (
                          <div className="flex items-center gap-2 border-t border-[#E8E4DF] px-5 py-3 bg-[#FDFCFA]">
                            <div className="flex items-center gap-2 mr-auto">
                              <ArrowRightLeft className="h-3.5 w-3.5 text-[#9E9892]" />
                              <Select
                                defaultValue={u.rol}
                                onValueChange={(value) => handleActualizarRol(u.id, value!)}
                                disabled={actualizando === u.id}
                              >
                                <SelectTrigger className="h-8 w-28 border-transparent bg-white shadow-sm rounded-lg text-xs font-medium text-[#1A1A1A] hover:border-[#E8E4DF]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(ROL_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <button
                              title={u.activo ? 'Suspender usuario' : 'Reactivar usuario'}
                              disabled={actualizando === u.id}
                              onClick={() => handleToggleActivo(u.id, u.activo)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                                u.activo
                                  ? 'text-[#9E9892] hover:bg-[#FEE2E2] hover:text-[#C1121F]'
                                  : 'text-[#9E9892] hover:bg-[#D8F3DC] hover:text-[#1B4332]'
                              }`}
                            >
                              {actualizando === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (u.activo ? <Ban className="h-3.5 w-3.5" /> : <BadgeCheck className="h-3.5 w-3.5" />)}
                            </button>

                            <button
                              title="Eliminar usuario"
                              disabled={actualizando === u.id}
                              onClick={() => {
                                if (confirm(`¿Eliminar a ${u.nombre} ${u.apellido}? Esta acción es irreversible.`)) {
                                  handleEliminar(u.id)
                                }
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] transition-all hover:bg-[#FEE2E2] hover:text-[#C1121F]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : esCeo ? (
                          <div className="flex items-center gap-2 border-t border-[#E8E4DF] px-5 py-3 bg-[#FEF9E7]">
                            <Shield className="h-3.5 w-3.5 text-[#D4A017] shrink-0" />
                            <span className="text-[11px] font-medium text-[#B8860B]">Cuenta protegida — solo modificable desde Supabase</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 border-t border-[#E8E4DF] px-5 py-3 bg-[#F8F6F3]">
                            <Shield className="h-3.5 w-3.5 text-[#9E9892] shrink-0" />
                            <span className="text-[11px] font-medium text-[#9E9892]">Solo el CEO puede modificar otros administradores</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {filtrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9E9892]">
          <UsersIcon className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No se encontraron usuarios</p>
          <p className="text-xs mt-1">Intenta ajustar los filtros o la búsqueda</p>
        </div>
      )}
    </motion.div>
  )
}
