'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { iniciarSesion } from '@/actions/auth.actions'
import { loginWithGoogle } from '@/actions/auth-google.actions'

export default function LoginPage() {
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [cargandoGoogle, setCargandoGoogle] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (datos: LoginInput) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const formData = new FormData()
      formData.append('email', datos.email)
      formData.append('password', datos.password)
      const resultado = await iniciarSesion(formData)
      if (resultado?.error) setErrorForm(resultado.error)
    } catch {
      setErrorForm('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleGoogle = async () => {
    setCargandoGoogle(true)
    setErrorForm(null)
    const res = await loginWithGoogle()
    if (res?.error) {
      setErrorForm(res.error)
      setCargandoGoogle(false)
    } else if (res?.url) {
      window.location.href = res.url
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
            <h1 className="text-xl font-bold text-[#1A1A1A]">Inicia sesión</h1>
            <p className="mt-1 text-sm text-[#9E9892]">Ingresa a tu cuenta de Boogie</p>
          </div>

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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dotted border-[#E8E4DF]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] font-medium uppercase tracking-wider text-[#9E9892]">o</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">Contraseña</label>
                <Link href="/recuperar-contrasena" className="text-[11px] font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-4 pr-10 text-sm text-[#1A1A1A] placeholder:text-[#9E9892] transition-colors focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9892] hover:text-[#1A1A1A] transition-colors"
                >
                  {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-[#C1121F]">{errors.password.message}</p>}
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
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 border-t border-dotted border-[#E8E4DF] pt-5 text-center">
            <p className="text-xs text-[#9E9892]">
              ¿No tienes una cuenta?{' '}
              <Link href="/registro" className="font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
