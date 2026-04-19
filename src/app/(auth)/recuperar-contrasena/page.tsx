'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { z } from 'zod'

import { recuperarContrasena, restablecerContrasena } from '@/actions/auth.actions'
import { recuperacionSchema } from '@/lib/validations'

const restablecerSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type RecuperacionInput = z.infer<typeof recuperacionSchema>
type RestablecerInput = z.infer<typeof restablecerSchema>

export default function RecuperarContrasenaPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RecuperarContrasenaContent />
    </Suspense>
  )
}

function LoadingSpinner() {
  return (
    <div className="w-full max-w-[420px]">
      <div className="relative overflow-hidden rounded-3xl border border-[#E8E4DF] bg-white shadow-sm">
        <div className="relative flex p-8 sm:p-10 items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B4332]" />
        </div>
      </div>
    </div>
  )
}

function RecuperarContrasenaContent() {
  const searchParams = useSearchParams()
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [restablecido, setRestablecido] = useState(false)

  const modoRecuperacion = searchParams.get('type') === 'recovery'

  if (modoRecuperacion) {
    return <FormularioRestablecer
      cargando={cargando}
      setCargando={setCargando}
      errorForm={errorForm}
      setErrorForm={setErrorForm}
      restablecido={restablecido}
      setRestablecido={setRestablecido}
    />
  }

  if (enviado) {
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
              <span className="text-2xl font-bold text-[#1B4332]">Boogie</span>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
                <Mail className="size-8 text-[#1B4332]" />
              </div>
              <div className="grid gap-2">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Correo enviado</h2>
                <p className="text-sm text-[#6B6560]">
                  Si existe una cuenta asociada a ese correo, recibirás un enlace para
                  restablecer tu contraseña. Revisa también la carpeta de correo no deseado.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-dotted border-[#E8E4DF] pt-5 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <FormularioRecuperar
      cargando={cargando}
      setCargando={setCargando}
      errorForm={errorForm}
      setErrorForm={setErrorForm}
      setEnviado={setEnviado}
    />
  )
}

function FormularioRecuperar({
  cargando, setCargando, errorForm, setErrorForm, setEnviado,
}: {
  cargando: boolean
  setCargando: (v: boolean) => void
  errorForm: string | null
  setErrorForm: (v: string | null) => void
  setEnviado: (v: boolean) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperacionInput>({
    resolver: zodResolver(recuperacionSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (datos: RecuperacionInput) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const formData = new FormData()
      formData.append('email', datos.email)
      const resultado = await recuperarContrasena(formData)
      if (resultado?.error) {
        setErrorForm(resultado.error)
      } else {
        if (resultado?.codeVerifier) {
          localStorage.setItem('pkce_code_verifier', resultado.codeVerifier)
          document.cookie = `pkce_code_verifier=${encodeURIComponent(resultado.codeVerifier)}; path=/; max-age=3600; samesite=lax`
        }
        setEnviado(true)
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
            <h1 className="text-xl font-bold text-[#1A1A1A]">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-[#9E9892]">
              Ingresa tu correo y te enviaremos un enlace para restablecerla
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-[11px] text-[#C1121F]">{errors.email.message}</p>
              )}
            </div>

            {errorForm && (
              <div className="rounded-xl border border-[#C1121F]/20 bg-[#FEF2F2] px-4 py-3 text-xs text-[#C1121F]">
                {errorForm}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-sm font-semibold text-white transition-all hover:from-[#2D6A4F] hover:to-[#40916C] disabled:opacity-60"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="mt-6 border-t border-dotted border-[#E8E4DF] pt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FormularioRestablecer({
  cargando, setCargando, errorForm, setErrorForm, restablecido, setRestablecido,
}: {
  cargando: boolean
  setCargando: (v: boolean) => void
  errorForm: string | null
  setErrorForm: (v: string | null) => void
  restablecido: boolean
  setRestablecido: (v: boolean) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestablecerInput>({
    resolver: zodResolver(restablecerSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (datos: RestablecerInput) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const formData = new FormData()
      formData.append('password', datos.password)
      const resultado = await restablecerContrasena(formData)
      if (resultado?.error) {
        setErrorForm(resultado.error)
      } else {
        setRestablecido(true)
      }
    } catch {
      setErrorForm('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  if (restablecido) {
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
              <span className="text-2xl font-bold text-[#1B4332]">Boogie</span>
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
                <CheckCircle2 className="size-8 text-[#1B4332]" />
              </div>
              <div className="grid gap-2">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Contraseña actualizada</h2>
                <p className="text-sm text-[#6B6560]">
                  Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/login"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-sm font-semibold text-white transition-all hover:from-[#2D6A4F] hover:to-[#40916C]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    )
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
            <h1 className="text-xl font-bold text-[#1A1A1A]">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-[#9E9892]">
              Ingresa tu nueva contraseña para recuperar el acceso
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                Nueva contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-[11px] text-[#C1121F]">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">
                Confirmar contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-[#C1121F]">{errors.confirmPassword.message}</p>
              )}
            </div>

            {errorForm && (
              <div className="rounded-xl border border-[#C1121F]/20 bg-[#FEF2F2] px-4 py-3 text-xs text-[#C1121F]">
                {errorForm}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-sm font-semibold text-white transition-all hover:from-[#2D6A4F] hover:to-[#40916C] disabled:opacity-60"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {cargando ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>

          <div className="mt-6 border-t border-dotted border-[#E8E4DF] pt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
