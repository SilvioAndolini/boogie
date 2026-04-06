'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { iniciarSesion } from '@/actions/auth.actions'

export default function LoginPage() {
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (datos: LoginInput) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const formData = new FormData()
      formData.append('email', datos.email)
      formData.append('password', datos.password)

      const resultado = await iniciarSesion(formData)
      if (resultado?.error) {
        setErrorForm(resultado.error)
      }
    } catch (error) {
      setErrorForm('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Card className="w-full max-w-md border border-[#E8E4DF] bg-white shadow-sm">
        <CardHeader className="items-center text-center">
          {/* Logo de Boogie */}
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B4332]">
              <span className="text-lg font-bold text-white">B</span>
            </div>
            <span className="text-2xl font-bold text-[#1B4332]">Boogie</span>
          </div>
          <CardTitle className="text-xl font-semibold text-[#1A1A1A]">
            Inicia sesión en tu cuenta
          </CardTitle>
          <CardDescription className="text-[#6B6560]">
            Ingresa tus datos para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            {/* Campo de correo electrónico */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Campo de contraseña */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">
                  Contraseña
                </Label>
                <Link
                  href="/recuperar-contrasena"
                  className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarContrasena ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 border-[#E8E4DF] bg-[#FEFCF9] pr-10 placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasena ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Error del servidor */}
            {errorForm && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {errorForm}
              </div>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              size="lg"
              disabled={cargando}
              className="mt-2 h-11 w-full bg-[#1B4332] text-white hover:bg-[#2D6A4F] disabled:opacity-50"
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center border-t border-[#E8E4DF] pt-4">
          <p className="text-sm text-[#6B6560]">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/registro"
              className="font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
