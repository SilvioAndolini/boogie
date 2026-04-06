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
import { registroSchema, type RegistroInput } from '@/lib/validations'
import { registrarUsuario } from '@/actions/auth.actions'

export default function RegistroPage() {
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (datos: RegistroInput) => {
    setCargando(true)
    setErrorForm(null)
    try {
      const formData = new FormData()
      formData.append('nombre', datos.nombre)
      formData.append('apellido', datos.apellido)
      formData.append('email', datos.email)
      formData.append('password', datos.password)
      formData.append('confirmPassword', datos.confirmPassword)
      if (datos.telefono) formData.append('telefono', datos.telefono)

      const resultado = await registrarUsuario(formData)
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
          Crea tu cuenta
        </CardTitle>
        <CardDescription className="text-[#6B6560]">
          Regístrate para encontrar tu alojamiento ideal en Venezuela
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          {errorForm && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorForm}
            </div>
          )}
          {/* Fila: nombre y apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nombre" className="text-sm font-medium text-[#1A1A1A]">
                Nombre
              </Label>
              <Input
                id="nombre"
                type="text"
                placeholder="María"
                autoComplete="given-name"
                className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                {...register('nombre')}
              />
              {errors.nombre && (
                <p className="text-xs text-red-500">{errors.nombre.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apellido" className="text-sm font-medium text-[#1A1A1A]">
                Apellido
              </Label>
              <Input
                id="apellido"
                type="text"
                placeholder="García"
                autoComplete="family-name"
                className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                {...register('apellido')}
              />
              {errors.apellido && (
                <p className="text-xs text-red-500">{errors.apellido.message}</p>
              )}
            </div>
          </div>

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

          {/* Campo de teléfono (opcional) */}
          <div className="grid gap-2">
            <Label htmlFor="telefono" className="text-sm font-medium text-[#1A1A1A]">
              Teléfono{' '}
              <span className="font-normal text-[#6B6560]">(opcional)</span>
            </Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+58 412 1234567"
              autoComplete="tel"
              className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
              {...register('telefono')}
            />
            {errors.telefono && (
              <p className="text-xs text-red-500">{errors.telefono.message}</p>
            )}
          </div>

          {/* Campo de contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={mostrarContrasena ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
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

          {/* Campo de confirmar contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1A1A1A]">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={mostrarConfirmacion ? 'text' : 'password'}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                className="h-10 border-[#E8E4DF] bg-[#FEFCF9] pr-10 placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#1A1A1A] transition-colors"
                aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarConfirmacion ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
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
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-[#E8E4DF] pt-4">
        <p className="text-sm text-[#6B6560]">
          ¿Ya tienes una cuenta?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
      </Card>
    </motion.div>
  )
}
