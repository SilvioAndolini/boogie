'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registroSchema, type RegistroInput } from '@/lib/validations'
import { enviarOtpEmail, verificarOtpYRegistrar } from '@/actions/auth.actions'
import { loginWithGoogle } from '@/actions/auth-google.actions'

const CODIGOS_PAIS = [
  { codigo: '+58', label: 'VE +58' },
  { codigo: '+1', label: 'US/CAN +1' },
  { codigo: '+34', label: 'ES +34' },
  { codigo: '+57', label: 'CO +57' },
  { codigo: '+51', label: 'PE +51' },
  { codigo: '+56', label: 'CL +56' },
  { codigo: '+54', label: 'AR +54' },
  { codigo: '+591', label: 'BO +591' },
  { codigo: '+593', label: 'EC +593' },
  { codigo: '+595', label: 'PY +595' },
  { codigo: '+598', label: 'UY +598' },
  { codigo: '+507', label: 'PA +507' },
  { codigo: '+506', label: 'CR +506' },
  { codigo: '+52', label: 'MX +52' },
  { codigo: '+53', label: 'CU +53' },
  { codigo: '+44', label: 'UK +44' },
  { codigo: '+49', label: 'DE +49' },
  { codigo: '+33', label: 'FR +33' },
  { codigo: '+39', label: 'IT +39' },
  { codigo: '+55', label: 'BR +55' },
]

export default function RegistroPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<'datos' | 'email'>('datos')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const [otp, setOtp] = useState('')
  const [segundosReenvio, setSegundosReenvio] = useState(0)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)

  const handleGoogle = async () => {
    setCargandoGoogle(true)
    const res = await loginWithGoogle()
    if (res?.error) {
      toast.error(res.error)
      setCargandoGoogle(false)
    } else if (res?.url) {
      window.location.href = res.url
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      codigoPais: '+58',
      tipoDocumento: 'CEDULA',
      numeroDocumento: '',
      password: '',
      confirmPassword: '',
    },
  })

  const tipoDocumento = watch('tipoDocumento')
  const telefono = watch('telefono')
  const codigoPais = watch('codigoPais')
  const email = watch('email')

  const handleEnviarOtp = async (datos: RegistroInput) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const result = await enviarOtpEmail(datos.email)
      if (result?.error) {
        setErrorForm(result.error)
        return
      }
      setPaso('email')
      setSegundosReenvio(60)
      const intervalo = setInterval(() => {
        setSegundosReenvio((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setErrorForm('Error al enviar el código de verificación')
    } finally {
      setCargando(false)
    }
  }

  const handleReenviarOtp = async () => {
    if (segundosReenvio > 0) return
    setReenviando(true)
    try {
      const result = await enviarOtpEmail(email)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setSegundosReenvio(60)
      const intervalo = setInterval(() => {
        setSegundosReenvio((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      toast.success('Código reenviado')
    } catch {
      toast.error('Error al reenviar el código')
    } finally {
      setReenviando(false)
    }
  }

  const handleVerificarYRegistrar = async () => {
    if (otp.length < 6) {
      setErrorForm('Ingresa el código completo')
      return
    }

    setCargando(true)
    setErrorForm(null)
    try {
      const datos = watch()
      const formData = new FormData()
      formData.append('nombre', datos.nombre)
      formData.append('apellido', datos.apellido)
      formData.append('email', datos.email)
      formData.append('password', datos.password)
      formData.append('confirmPassword', datos.confirmPassword)
      formData.append('tipoDocumento', datos.tipoDocumento)
      formData.append('numeroDocumento', datos.numeroDocumento)
      formData.append('telefono', datos.telefono)
      formData.append('codigoPais', datos.codigoPais)
      formData.append('otp', otp)

      const result = await verificarOtpYRegistrar(formData)
      if (result?.error) {
        setErrorForm(result.error)
      } else if (result?.requiereLogin) {
        router.push('/login')
      } else {
        window.location.href = '/'
      }
    } catch {
      setErrorForm('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[420px]"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#E8E4DF] bg-white shadow-sm">
        <div className="relative p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#40916C]">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">
              {paso === 'datos' ? 'Crea tu cuenta' : 'Verifica tu correo'}
            </h1>
            <p className="mt-1 text-sm text-[#9E9892]">
              {paso === 'datos'
                ? 'Encuentra tu alojamiento ideal en Venezuela'
                : `Enviamos un código a ${email}`}
            </p>
          </div>
          {paso === 'datos' ? (
            <form onSubmit={handleSubmit(handleEnviarOtp)} className="space-y-4">
              {errorForm && (
                <div className="rounded-xl border border-[#C1121F]/20 bg-[#FEF2F2] px-4 py-3 text-xs text-[#C1121F]">
                  {errorForm}
                </div>
              )}

              <button
                type="button"
                disabled={cargandoGoogle}
                onClick={handleGoogle}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#E8E4DF] bg-white text-sm font-medium text-[#1A1A1A] transition-all hover:bg-[#F8F6F3] hover:border-[#D8D4CF] disabled:opacity-60"
              >
                {cargandoGoogle ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#9E9892]" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continuar con Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dotted border-[#E8E4DF]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-[#9E9892]">o</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Nombre</label>
                  <input
                    type="text"
                    placeholder="María"
                    autoComplete="given-name"
                    className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    {...register('nombre')}
                  />
                  {errors.nombre && <p className="text-[11px] text-[#C1121F]">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Apellido</label>
                  <input
                    type="text"
                    placeholder="García"
                    autoComplete="family-name"
                    className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    {...register('apellido')}
                  />
                  {errors.apellido && <p className="text-[11px] text-[#C1121F]">{errors.apellido.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  {...register('email')}
                />
                {errors.email && <p className="text-[11px] text-[#C1121F]">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                  Documento de identidad <span className="text-[#C1121F]">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="h-11 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    value={tipoDocumento}
                    onChange={(e) => setValue('tipoDocumento', e.target.value as 'CEDULA' | 'PASAPORTE')}
                  >
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                  <input
                    type="text"
                    placeholder={tipoDocumento === 'CEDULA' ? 'V-12345678' : 'AB1234567'}
                    className="h-11 flex-1 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    {...register('numeroDocumento')}
                  />
                </div>
                {errors.numeroDocumento && <p className="text-[11px] text-[#C1121F]">{errors.numeroDocumento.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                  Teléfono <span className="text-[#C1121F]">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="h-11 w-24 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-2 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    value={codigoPais}
                    onChange={(e) => setValue('codigoPais', e.target.value)}
                  >
                    {CODIGOS_PAIS.map((c) => (
                      <option key={c.codigo} value={c.codigo}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="412 1234567"
                    autoComplete="tel"
                    className="h-11 flex-1 rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    {...register('telefono')}
                  />
                </div>
                {errors.telefono && <p className="text-[11px] text-[#C1121F]">{errors.telefono.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarContrasena ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 pr-10 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setMostrarContrasena(!mostrarContrasena)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9892] hover:text-[#1A1A1A] transition-colors">
                    {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-[#C1121F]">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarConfirmacion ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 pr-10 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                    {...register('confirmPassword')}
                  />
                  <button type="button" onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9892] hover:text-[#1A1A1A] transition-colors">
                    {mostrarConfirmacion ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[11px] text-[#C1121F]">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-sm font-semibold text-white transition-all hover:from-[#2D6A4F] hover:to-[#40916C] disabled:opacity-60"
              >
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {cargando ? 'Enviando código...' : 'Verificar correo'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {errorForm && (
                <div className="rounded-xl border border-[#C1121F]/20 bg-[#FEF2F2] px-4 py-3 text-xs text-[#C1121F]">
                  {errorForm}
                </div>
              )}

              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D8F3DC]">
                  <Mail className="h-7 w-7 text-[#1B4332]" />
                </div>
                <p className="text-center text-sm text-[#9E9892]">
                  Ingresa el código que enviamos a <strong className="text-[#1A1A1A]">{email}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-center block text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="h-14 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-center text-2xl font-bold tracking-[0.5em] text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  placeholder="--------"
                  autoFocus
                />
              </div>

              <div className="text-center">
                {segundosReenvio > 0 ? (
                  <p className="text-[11px] text-[#9E9892]">Reenviar código en {segundosReenvio}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleReenviarOtp}
                    disabled={reenviando}
                    className="text-[11px] font-medium text-[#1B4332] hover:text-[#2D6A4F] disabled:opacity-50"
                  >
                    {reenviando ? 'Enviando...' : 'Reenviar código'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerificarYRegistrar}
                disabled={cargando || otp.length < 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-sm font-semibold text-white transition-all hover:from-[#2D6A4F] hover:to-[#40916C] disabled:opacity-60"
              >
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <button
                type="button"
                onClick={() => { setPaso('datos'); setOtp(''); setErrorForm(null) }}
                className="flex items-center justify-center gap-1 w-full text-xs text-[#9E9892] hover:text-[#1B4332] transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Cambiar datos
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-dotted border-[#E8E4DF] pt-5 text-center">
            <p className="text-xs text-[#9E9892]">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
