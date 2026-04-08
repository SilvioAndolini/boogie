'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { iniciarSesionAdmin } from '@/actions/auth.actions'

export default function AdminLoginPage() {
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

      const resultado = await iniciarSesionAdmin(formData)
      if (resultado?.error) {
        setErrorForm(resultado.error)
      }
    } catch {
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
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B4332]">
            <Shield className="size-6 text-white" />
          </div>
          <CardTitle className="text-xl font-semibold text-[#1A1A1A]">
            Acceso Administrativo
          </CardTitle>
          <CardDescription className="text-[#6B6560]">
            Ingresa tus credenciales de administrador
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@correo.com"
                autoComplete="email"
                className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">
                Contraseña
              </Label>
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

            {errorForm && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {errorForm}
              </div>
            )}

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
      </Card>
    </motion.div>
  )
}