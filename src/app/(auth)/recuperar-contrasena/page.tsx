'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail } from 'lucide-react'
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
import { z } from 'zod'
import { recuperacionSchema } from '@/lib/validations'

type RecuperacionInput = z.infer<typeof recuperacionSchema>

export default function RecuperarContrasenaPage() {
  const [cargando, setCargando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperacionInput>({
    resolver: zodResolver(recuperacionSchema),
    defaultValues: {
      email: '',
    },
  })

  // Manejador de envío del formulario (acción de servidor placeholder)
  const onSubmit = async (datos: RecuperacionInput) => {
    setCargando(true)
    try {
      // TODO: reemplazar con la server action de recuperación de contraseña
      console.log('Solicitud de recuperación para:', datos.email)
      setEnviado(true)
    } catch (error) {
      console.error('Error al solicitar recuperación:', error)
    } finally {
      setCargando(false)
    }
  }

  // Vista de confirmación de envío
  if (enviado) {
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
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4 text-center">
            {/* Ícono de correo enviado */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D8F3DC]">
              <Mail className="size-8 text-[#1B4332]" />
            </div>
            <div className="grid gap-2">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">
                Correo enviado
              </h2>
              <p className="text-sm text-[#6B6560]">
                Si existe una cuenta asociada a ese correo, recibirás un enlace para
                restablecer tu contraseña. Revisa también la carpeta de correo no deseado.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-center border-t border-[#E8E4DF] pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Volver al inicio de sesión
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // Vista del formulario
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
          Recuperar contraseña
        </CardTitle>
        <CardDescription className="text-[#6B6560]">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
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

          {/* Botón de envío */}
          <Button
            type="submit"
            size="lg"
            disabled={cargando}
            className="mt-2 h-11 w-full bg-[#1B4332] text-white hover:bg-[#2D6A4F] disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-[#E8E4DF] pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver al inicio de sesión
        </Link>
      </CardFooter>
      </Card>
    </motion.div>
  )
}
