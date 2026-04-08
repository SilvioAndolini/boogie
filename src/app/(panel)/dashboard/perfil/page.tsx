'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Lock, Mail, Phone, Pencil, Loader2, Check, ShieldCheck, ShieldX, ShieldAlert, Crown, Sparkles, Star, User, FileCheck, Wallet, Share2, CreditCard, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { perfilSchema } from '@/lib/validations'
import { toast } from 'sonner'
import { getPerfilUsuario, actualizarPerfil, cambiarContrasena, subirAvatar } from '@/actions/perfil.actions'
import { optimizeImage } from '@/lib/image-optimize'

type PerfilFormData = {
  nombre: string
  apellido: string
  telefono?: string
  bio?: string
  metodoPagoPreferido?: 'PAGO_MOVIL' | 'EFECTIVO_FARMATODO' | 'USDT' | 'TARJETA_INTERNACIONAL'
  tiktok?: string
  instagram?: string
}

type PasswordFormData = {
  passwordActual: string
  passwordNueva: string
  confirmarPassword: string
}

const METODOS_PAGO = [
  { value: 'PAGO_MOVIL', label: 'Pago Móvil' },
  { value: 'EFECTIVO_FARMATODO', label: 'Efectivo Farmatodo' },
  { value: 'USDT', label: 'USDT' },
  { value: 'TARJETA_INTERNACIONAL', label: 'Tarjeta Internacional' },
] as const

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const editEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

const editExpand = {
  initial: { maxHeight: 0, opacity: 0 },
  animate: { maxHeight: 1200, opacity: 1, transition: { duration: 0.5, ease: editEase } },
  exit: { maxHeight: 0, opacity: 0, transition: { duration: 0.35, ease: editEase } },
}

export default function PerfilPage() {
  const [guardando, setGuardando] = useState(false)
  const [guardandoPassword, setGuardandoPassword] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [iniciales, setIniciales] = useState('U')
  const [editando, setEditando] = useState(false)
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const [verificado, setVerificado] = useState<'pendiente' | 'verificado' | 'rechazado'>('pendiente')
  const [plan, setPlan] = useState<'free' | 'premium' | 'ultra'>('free')
  const [metodoPago, setMetodoPago] = useState<string>('')
  const [tiktok, setTiktok] = useState<string>('')
  const [instagram, setInstagram] = useState<string>('')
  const [subiendoAvatar, setSubiendoAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: '', apellido: '', telefono: '', bio: '', metodoPagoPreferido: undefined, tiktok: '', instagram: '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    watch: watchPassword,
    reset: resetPassword,
  } = useForm<PasswordFormData>()

  const passwordNueva = watchPassword('passwordNueva')
  const watchNombre = watch('nombre')
  const watchApellido = watch('apellido')
  const watchMetodoPago = watch('metodoPagoPreferido')
  const watchTiktok = watch('tiktok')
  const watchInstagram = watch('instagram')

  useEffect(() => {
    async function cargar() {
      const res = await getPerfilUsuario()
      if (res.perfil) {
        const p = res.perfil as Record<string, unknown>
        setEmail((p.email as string) || '')
        setAvatarUrl((p.avatar_url as string) || null)
        setVerificado(
          p.verificado === true ? 'verificado' :
          (p.verificacion_rechazada as boolean) ? 'rechazado' : 'pendiente'
        )
        setPlan((p.plan as string as 'free' | 'premium' | 'ultra') || 'free')
        const mp = (p.metodo_pago_preferido as string) || ''
        const tk = (p.tiktok as string) || ''
        const ig = (p.instagram as string) || ''
        setMetodoPago(mp)
        setTiktok(tk)
        setInstagram(ig)
        reset({
          nombre: (p.nombre as string) || '',
          apellido: (p.apellido as string) || '',
          telefono: (p.telefono as string) || '',
          bio: (p.bio as string) || '',
          metodoPagoPreferido: (mp || undefined) as PerfilFormData['metodoPagoPreferido'],
          tiktok: tk,
          instagram: ig,
        })
        const n = (p.nombre as string) || ''
        const a = (p.apellido as string) || ''
        setIniciales(n && a ? n.charAt(0).toUpperCase() + a.charAt(0).toUpperCase() : 'U')
      }
      setCargando(false)
    }
    cargar()
  }, [reset])

  useEffect(() => {
    const n = watchNombre || ''
    const a = watchApellido || ''
    if (n || a) {
      setIniciales((n.charAt(0) || '').toUpperCase() + (a.charAt(0) || '').toUpperCase())
    }
  }, [watchNombre, watchApellido])

  useEffect(() => {
    setMetodoPago(watchMetodoPago || '')
  }, [watchMetodoPago])

  useEffect(() => {
    setTiktok(watchTiktok || '')
  }, [watchTiktok])

  useEffect(() => {
    setInstagram(watchInstagram || '')
  }, [watchInstagram])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato no permitido. Usa JPG, PNG o WebP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5 MB')
      return
    }

    setSubiendoAvatar(true)
    try {
      const optimized = await optimizeImage(file)
      const formData = new FormData()
      formData.append('avatar', optimized)
      if (avatarUrl) formData.append('avatarUrl', avatarUrl)

      const res = await subirAvatar(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        setAvatarUrl(res.url || null)
        toast.success('Foto de perfil actualizada')
      }
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setSubiendoAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const onGuardarPerfil = async (data: PerfilFormData) => {
    setGuardando(true)
    const formData = new FormData()
    formData.append('nombre', data.nombre)
    formData.append('apellido', data.apellido)
    if (data.telefono) formData.append('telefono', data.telefono)
    if (data.bio) formData.append('bio', data.bio)
    if (data.metodoPagoPreferido) formData.append('metodoPagoPreferido', data.metodoPagoPreferido)
    if (data.tiktok) formData.append('tiktok', data.tiktok)
    if (data.instagram) formData.append('instagram', data.instagram)

    const res = await actualizarPerfil(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Perfil actualizado')
      setEditando(false)
    }
    setGuardando(false)
  }

  const onCambiarPassword = async (data: PasswordFormData) => {
    setGuardandoPassword(true)
    const formData = new FormData()
    formData.append('passwordActual', data.passwordActual)
    formData.append('passwordNueva', data.passwordNueva)

    const res = await cambiarContrasena(formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Contraseña actualizada')
      resetPassword()
      setCambiandoPassword(false)
    }
    setGuardandoPassword(false)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#52B788]" />
      </div>
    )
  }

  const nombreCompleto = `${watchNombre || ''} ${watchApellido || ''}`.trim()

  const allItems = [
    { label: 'Foto de perfil', done: !!avatarUrl, icon: User },
    { label: 'Verificación de identidad', done: verificado === 'verificado', icon: FileCheck },
    { label: 'Biografía', done: !!watch('bio'), icon: Pencil },
    { label: 'Método de pago preferido', done: !!metodoPago, icon: Wallet },
    { label: 'Redes sociales', done: !!(tiktok || instagram), icon: Share2 },
  ]

  const pendingItems = allItems.filter((i) => !i.done)
  const completados = allItems.filter((i) => i.done).length
  const porcentaje = Math.round((completados / allItems.length) * 100)

  const barGradient =
    porcentaje >= 80 ? 'from-[#10B981] to-[#059669]' :
    porcentaje >= 50 ? 'from-[#F59E0B] to-[#D97706]' :
    'from-[#EF4444] to-[#DC2626]'

  const barBg =
    porcentaje >= 80 ? 'bg-[#D8F3DC]' :
    porcentaje >= 50 ? 'bg-[#FEF3C7]' :
    'bg-[#FEE2E2]'

  const barText =
    porcentaje >= 80 ? 'text-[#059669]' :
    porcentaje >= 50 ? 'text-[#D97706]' :
    'text-[#DC2626]'

  const gradStops =
    porcentaje >= 80 ? ['#10B981', '#059669'] :
    porcentaje >= 50 ? ['#F59E0B', '#D97706'] :
    ['#EF4444', '#DC2626']

  const tipBg =
    porcentaje >= 80 ? 'from-[#D8F3DC]/60 via-[#D8F3DC]/40 to-[#D8F3DC]/60' :
    porcentaje >= 50 ? 'from-[#FEF3C7]/60 via-[#FEF3C7]/40 to-[#FEF3C7]/60' :
    'from-[#FEE2E2]/60 via-[#FEE2E2]/40 to-[#FEE2E2]/60'

  const metodoPagoLabel = METODOS_PAGO.find(m => m.value === metodoPago)?.label || metodoPago

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl"
    >
      {/* ====== HERO + EDIT WRAPPER ====== */}
      <motion.div variants={fadeUp} className="mb-8 overflow-hidden rounded-3xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] px-8 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
          <div className="absolute right-20 bottom-4 h-20 w-20 rounded-full bg-white/[0.03]" />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="group relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-white/20 transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-4xl font-bold tracking-tight text-white ring-4 ring-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32 sm:text-5xl">
                  {iniciales}
                </div>
              )}
               <button
                 onClick={() => !subiendoAvatar && avatarInputRef.current?.click()}
                 className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1B4332] shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                 aria-label="Cambiar foto de perfil"
                 disabled={subiendoAvatar}
               >
                 {subiendoAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
               </button>
               <input
                 ref={avatarInputRef}
                 type="file"
                 accept="image/jpeg,image/png,image/webp"
                 className="hidden"
                 onChange={handleAvatarChange}
               />
            </div>

            <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {nombreCompleto || 'Tu nombre'}
                </h1>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-5">
                <div className="flex items-center gap-2 text-white/70">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{email || 'correo@ejemplo.com'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{watch('telefono') || 'Sin teléfono'}</span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {verificado === 'verificado' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] px-3.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm shadow-[#10B981]/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verificado
                  </span>
                ) : verificado === 'rechazado' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] px-3.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm shadow-[#EF4444]/30">
                    <ShieldX className="h-3.5 w-3.5" />
                    Rechazado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1 text-xs font-bold tracking-wide text-[#6B6560] shadow-sm">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Por verificar
                  </span>
                )}

                {plan === 'ultra' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F59E0B] via-[#EAB308] to-[#F59E0B] px-3.5 py-1 text-xs font-bold tracking-wide text-[#78350F] shadow-sm shadow-[#F59E0B]/40">
                    <Crown className="h-3.5 w-3.5" />
                    Ultra Booger
                  </span>
                ) : plan === 'premium' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-3.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm shadow-[#8B5CF6]/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    Booger Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold tracking-wide text-white/80 backdrop-blur-sm">
                    <Star className="h-3.5 w-3.5" />
                    Booger Free
                  </span>
                )}
              </div>

              {(metodoPago || tiktok || instagram) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {metodoPago && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                      <CreditCard className="h-3 w-3" />
                      {metodoPagoLabel}
                    </span>
                  )}
                  {tiktok && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.98a8.22 8.22 0 0 0 3.76.92V6.45a4.84 4.84 0 0 1-0-.24z"/></svg>
                      {tiktok}
                    </span>
                  )}
                  {instagram && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      {instagram}
                    </span>
                  )}
                </div>
              )}
            </div>

            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-110 sm:right-6 sm:top-6"
                aria-label="Editar perfil"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {editando && (
            <motion.div
              key="edit-form"
              {...editExpand}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-b from-[#1B4332]/8 via-white to-white px-6 py-6 sm:px-8 sm:py-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Editar información</h2>
                  <button
                    onClick={() => setEditando(false)}
                    className="text-sm font-medium text-[#9E9892] hover:text-[#1A1A1A] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>

                <form onSubmit={handleSubmit(onGuardarPerfil)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="nombre" className="text-sm font-semibold text-[#1A1A1A]">
                        Nombre
                      </label>
                      <Input
                        id="nombre"
                        placeholder="Tu nombre"
                        className="h-12 border-[#E8E4DF] bg-[#FDFCFA] text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                        {...register('nombre')}
                      />
                      {errors.nombre && <p className="text-xs text-[#C1121F]">{errors.nombre.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="apellido" className="text-sm font-semibold text-[#1A1A1A]">
                        Apellido
                      </label>
                      <Input
                        id="apellido"
                        placeholder="Tu apellido"
                        className="h-12 border-[#E8E4DF] bg-[#FDFCFA] text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                        {...register('apellido')}
                      />
                      {errors.apellido && <p className="text-xs text-[#C1121F]">{errors.apellido.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="telefono" className="text-sm font-semibold text-[#1A1A1A]">
                        Teléfono
                      </label>
                      <Input
                        id="telefono"
                        type="tel"
                        placeholder="+58 412 1234567"
                        className="h-12 border-[#E8E4DF] bg-[#FDFCFA] text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                        {...register('telefono')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#1A1A1A]">
                        Correo electrónico
                      </label>
                      <div className="flex h-12 items-center rounded-md border border-[#E8E4DF] bg-[#F4F1EC] px-3">
                        <Mail className="mr-2 h-4 w-4 text-[#9E9892]" />
                        <span className="text-sm text-[#9E9892]">{email}</span>
                      </div>
                      <p className="text-xs text-[#9E9892]">No se puede cambiar</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metodoPagoPreferido">Método de pago preferido</Label>
                    <Select
                      onValueChange={(value) => setValue('metodoPagoPreferido', value as PerfilFormData['metodoPagoPreferido'])}
                      value={watch('metodoPagoPreferido') || ''}
                    >
                      <SelectTrigger className="h-12 w-full rounded-lg border-[#E8E4DF] bg-[#FDFCFA] text-base focus:ring-[#1B4332]/20">
                        <SelectValue placeholder="Selecciona un método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        {METODOS_PAGO.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="tiktok" className="text-sm font-semibold text-[#1A1A1A]">
                        TikTok
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9E9892]">@</span>
                        <Input
                          id="tiktok"
                          placeholder="usuario"
                          className="h-12 border-[#E8E4DF] bg-[#FDFCFA] pl-8 text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                          {...register('tiktok')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="instagram" className="text-sm font-semibold text-[#1A1A1A]">
                        Instagram
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9E9892]">@</span>
                        <Input
                          id="instagram"
                          placeholder="usuario"
                          className="h-12 border-[#E8E4DF] bg-[#FDFCFA] pl-8 text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                          {...register('instagram')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-semibold text-[#1A1A1A]">
                      Biografía
                    </label>
                    <textarea
                      id="bio"
                      rows={4}
                      placeholder="Cuéntanos un poco sobre ti..."
                      className="flex w-full rounded-md border border-[#E8E4DF] bg-[#FDFCFA] px-3 py-3 text-base outline-none transition-colors placeholder:text-[#9E9892] focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
                      {...register('bio')}
                    />
                    {errors.bio && <p className="text-xs text-[#C1121F]">{errors.bio.message}</p>}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 border-[#E8E4DF] text-base"
                      onClick={() => setEditando(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 flex-1 bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
                      disabled={guardando}
                    >
                      {guardando ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ====== PROFILE COMPLETENESS ====== */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white">
          <div className="relative px-6 pt-6 pb-5 sm:px-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#F4F1EC]" />
            <motion.div
              className={`absolute left-0 top-0 h-1 bg-gradient-to-r ${barGradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${porcentaje}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ maxWidth: '100%' }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${barBg}`}>
                  <Sparkles className={`h-5 w-5 ${barText}`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1A1A1A]">Completar perfil</h2>
                  <p className="text-xs text-[#9E9892]">
                    {porcentaje === 100
                      ? 'Perfil completo'
                      : `${pendingItems.length} paso${pendingItems.length !== 1 ? 's' : ''} restante${pendingItems.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#F4F1EC" strokeWidth="4" />
                  <motion.circle
                    cx="28" cy="28" r="24" fill="none"
                    stroke="url(#completenessGrad)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - porcentaje / 100) }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="completenessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={gradStops[0]} />
                      <stop offset="100%" stopColor={gradStops[1]} />
                    </linearGradient>
                  </defs>
                </svg>
                <span className={`absolute text-sm font-extrabold tabular-nums ${barText}`}>
                  {porcentaje}
                </span>
              </div>
            </div>
          </div>

          {pendingItems.length > 0 && (
            <div className="border-t border-[#F4F1EC] px-6 py-4 sm:px-8">
              <div className="flex flex-col">
                {pendingItems.map((item, idx) => {
                  const isLast = idx === pendingItems.length - 1
                  return (
                    <div key={item.label} className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4F1EC]">
                          <span className="text-[10px] font-bold text-[#C4BFB9]">{idx + 1}</span>
                        </div>
                        {!isLast && <div className="h-6 w-px bg-[#F4F1EC]" />}
                      </div>
                      <div className={`flex flex-1 items-center gap-2.5 ${isLast ? '' : 'pb-4'}`}>
                        <item.icon className="h-4 w-4 shrink-0 text-[#C4BFB9]" />
                        <span className="text-sm font-medium leading-7 text-[#9E9892]">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {porcentaje < 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className={`border-t border-[#F4F1EC] bg-gradient-to-r ${tipBg} px-6 py-3 sm:px-8`}
            >
              <p className="text-center text-xs leading-relaxed text-[#9E9892]">
                Completa tu perfil para aumentar tu visibilidad y desbloquear todas las funciones de Boogie.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ====== BIO SECTION ====== */}
      <motion.div variants={fadeUp} className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">Sobre mí</h2>
        <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
          {watch('bio') ? (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[#4A4540]">
              {watch('bio')}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F3]">
                <Pencil className="h-5 w-5 text-[#9E9892]" />
              </div>
              <p className="text-sm text-[#9E9892]">Aún no has escrito una biografía</p>
              <button
                onClick={() => setEditando(true)}
                className="text-sm font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
              >
                Agregar biografía
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ====== PASSWORD SECTION ====== */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Seguridad</h2>
          {!cambiandoPassword && (
            <button
              onClick={() => setCambiandoPassword(true)}
              className="flex items-center gap-2 rounded-lg bg-[#F8F6F3] px-4 py-2 text-sm font-semibold text-[#1B4332] transition-colors hover:bg-[#D8F3DC]"
            >
              <Lock className="h-4 w-4" />
              Cambiar contraseña
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {cambiandoPassword && (
            <motion.div
              key="password-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6 sm:p-8">
                <form onSubmit={handleSubmitPassword(onCambiarPassword)} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="passwordActual" className="text-sm font-semibold text-[#1A1A1A]">
                      Contraseña actual
                    </label>
                    <Input
                      id="passwordActual"
                      type="password"
                      placeholder="Ingresa tu contraseña actual"
                      className="h-12 border-[#E8E4DF] bg-[#FDFCFA] text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                      {...registerPassword('passwordActual', { required: 'La contraseña actual es requerida' })}
                    />
                    {errorsPassword.passwordActual && (
                      <p className="text-xs text-[#C1121F]">{String(errorsPassword.passwordActual.message)}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="passwordNueva" className="text-sm font-semibold text-[#1A1A1A]">
                        Nueva contraseña
                      </label>
                      <Input
                        id="passwordNueva"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        className="h-12 border-[#E8E4DF] bg-[#FDFCFA] text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                        {...registerPassword('passwordNueva', {
                          required: 'La nueva contraseña es requerida',
                          minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                        })}
                      />
                      {errorsPassword.passwordNueva && (
                        <p className="text-xs text-[#C1121F]">{String(errorsPassword.passwordNueva.message)}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmarPassword" className="text-sm font-semibold text-[#1A1A1A]">
                        Confirmar
                      </label>
                      <Input
                        id="confirmarPassword"
                        type="password"
                        placeholder="Repite la contraseña"
                        className="h-12 border-[#E8E4DF] bg-[#FDFCFA] text-base focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                        {...registerPassword('confirmarPassword', {
                          required: 'Debes confirmar la contraseña',
                          validate: (value) => value === passwordNueva || 'Las contraseñas no coinciden',
                        })}
                      />
                      {errorsPassword.confirmarPassword && (
                        <p className="text-xs text-[#C1121F]">{String(errorsPassword.confirmarPassword.message)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 flex-1 border-[#E8E4DF] text-base"
                      onClick={() => { setCambiandoPassword(false); resetPassword() }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 flex-1 bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
                      disabled={guardandoPassword}
                    >
                      {guardandoPassword ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Actualizar contraseña
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!cambiandoPassword && (
          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D8F3DC]">
                <Lock className="h-5 w-5 text-[#1B4332]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1A1A1A]">Contraseña protegida</p>
                <p className="text-sm text-[#9E9892]">Tu contraseña está encriptada y segura</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
