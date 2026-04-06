// Página de Perfil del Usuario
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Lock, User, Mail, Phone, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { perfilSchema } from '@/lib/validations'

// Tipo inferido del esquema de validación
type PerfilFormData = {
  nombre: string
  apellido: string
  telefono?: string
  bio?: string
}

// Tipo para cambio de contraseña
type PasswordFormData = {
  passwordActual: string
  passwordNueva: string
  confirmarPassword: string
}

export default function PerfilPage() {
  const [guardando, setGuardando] = useState(false)
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  // Formulario de perfil con validación zod
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      telefono: '',
      bio: '',
    },
  })

  // Formulario de cambio de contraseña (validación manual)
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    watch: watchPassword,
  } = useForm<PasswordFormData>()

  const passwordNueva = watchPassword('passwordNueva')

  // Guardar perfil
  const onGuardarPerfil = async (_data: PerfilFormData) => {
    setGuardando(true)
    // Simular guardado
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setGuardando(false)
  }

  // Cambiar contraseña
  const onCambiarPassword = async (_data: PasswordFormData) => {
    setGuardandoPassword(true)
    // Simular cambio
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setGuardandoPassword(false)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Mi perfil</h1>
        <p className="text-sm text-[#6B6560]">
          Administra tu información personal
        </p>
      </div>

      {/* Sección de avatar */}
      <Card className="border-[#E8E4DF]">
        <CardContent className="flex items-center gap-6 py-6">
          {/* Avatar placeholder */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#1B4332] to-[#52B788] text-2xl font-bold text-white">
              U
            </div>
            <button
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1B4332] text-white shadow-sm hover:bg-[#2D6A4F]"
              aria-label="Cambiar foto de perfil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">Foto de perfil</h3>
            <p className="text-sm text-[#6B6560]">
              Sube una foto para que los huéspedes te reconozcan
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-[#E8E4DF] text-[#1B4332] hover:bg-[#D8F3DC]"
            >
              Subir foto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de información personal */}
      <Card className="border-[#E8E4DF]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-[#52B788]" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onGuardarPerfil)} className="space-y-5">
            {/* Nombre y apellido */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  <span className="flex items-center gap-1.5">
                    Nombre <span className="text-[#C1121F]">*</span>
                  </span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Tu nombre"
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <p className="text-xs text-[#C1121F]">{errors.nombre.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">
                  <span className="flex items-center gap-1.5">
                    Apellido <span className="text-[#C1121F]">*</span>
                  </span>
                </Label>
                <Input
                  id="apellido"
                  placeholder="Tu apellido"
                  {...register('apellido')}
                />
                {errors.apellido && (
                  <p className="text-xs text-[#C1121F]">{errors.apellido.message}</p>
                )}
              </div>
            </div>

            {/* Email (solo lectura) */}
            <div className="space-y-2">
              <Label htmlFor="email">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Correo electrónico
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                value="usuario@ejemplo.com"
                readOnly
                className="cursor-not-allowed bg-[#F8F6F3] text-[#9E9892]"
              />
              <p className="text-xs text-[#9E9892]">
                El correo electrónico no se puede cambiar
              </p>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Teléfono
                </span>
              </Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+58 412 1234567"
                {...register('telefono')}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Biografía
                </span>
              </Label>
              <textarea
                id="bio"
                rows={4}
                placeholder="Cuéntanos un poco sobre ti..."
                className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-xs text-[#C1121F]">{errors.bio.message}</p>
              )}
              <p className="text-xs text-[#9E9892]">
                Máximo 500 caracteres
              </p>
            </div>

            <Button
              type="submit"
              className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sección de cambio de contraseña */}
      <Card className="border-[#E8E4DF]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-[#E9C46A]" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onCambiarPassword)} className="space-y-5">
            {/* Contraseña actual */}
            <div className="space-y-2">
              <Label htmlFor="passwordActual">Contraseña actual</Label>
              <Input
                id="passwordActual"
                type="password"
                placeholder="Ingresa tu contraseña actual"
                {...registerPassword('passwordActual', {
                  required: 'La contraseña actual es requerida',
                })}
              />
              {errorsPassword.passwordActual && (
                <p className="text-xs text-[#C1121F]">
                  {String(errorsPassword.passwordActual.message)}
                </p>
              )}
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-2">
              <Label htmlFor="passwordNueva">Nueva contraseña</Label>
              <Input
                id="passwordNueva"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...registerPassword('passwordNueva', {
                  required: 'La nueva contraseña es requerida',
                  minLength: {
                    value: 8,
                    message: 'La contraseña debe tener al menos 8 caracteres',
                  },
                })}
              />
              {errorsPassword.passwordNueva && (
                <p className="text-xs text-[#C1121F]">
                  {String(errorsPassword.passwordNueva.message)}
                </p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmarPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmarPassword"
                type="password"
                placeholder="Repite la nueva contraseña"
                {...registerPassword('confirmarPassword', {
                  required: 'Debes confirmar la contraseña',
                  validate: (value) =>
                    value === passwordNueva || 'Las contraseñas no coinciden',
                })}
              />
              {errorsPassword.confirmarPassword && (
                <p className="text-xs text-[#C1121F]">
                  {String(errorsPassword.confirmarPassword.message)}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="outline"
              className="border-[#E8E4DF] text-[#1B4332] hover:bg-[#D8F3DC]"
              disabled={guardandoPassword}
            >
              {guardandoPassword ? 'Cambiando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
