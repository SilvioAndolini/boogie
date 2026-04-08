'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

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
import { enviarOtpEmail, verificarOtpYRegistrar } from '@/actions/auth.actions'

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
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Card className="w-full max-w-md border border-[#E8E4DF] bg-white shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B4332]">
              <span className="text-lg font-bold text-white">B</span>
            </div>
            <span className="text-2xl font-bold text-[#1B4332]">Boogie</span>
          </div>
          <CardTitle className="text-xl font-semibold text-[#1A1A1A]">
            {paso === 'datos' ? 'Crea tu cuenta' : 'Verifica tu correo'}
          </CardTitle>
          <CardDescription className="text-[#6B6560]">
            {paso === 'datos'
              ? 'Regístrate para encontrar tu alojamiento ideal en Venezuela'
              : `Enviamos un código a ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {paso === 'datos' ? (
            <form onSubmit={handleSubmit(handleEnviarOtp)} className="grid gap-4">
              {errorForm && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="nombre" className="text-sm font-medium text-[#1A1A1A]">Nombre</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="María"
                    autoComplete="given-name"
                    className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                    {...register('nombre')}
                  />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apellido" className="text-sm font-medium text-[#1A1A1A]">Apellido</Label>
                  <Input
                    id="apellido"
                    type="text"
                    placeholder="García"
                    autoComplete="family-name"
                    className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                    {...register('apellido')}
                  />
                  {errors.apellido && <p className="text-xs text-red-500">{errors.apellido.message}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-medium text-[#1A1A1A]">
                  Documento de identidad <span className="text-[#C1121F]">*</span>
                </Label>
                <div className="flex gap-2">
                  <select
                    className="h-10 rounded-md border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none"
                    value={tipoDocumento}
                    onChange={(e) => setValue('tipoDocumento', e.target.value as 'CEDULA' | 'PASAPORTE')}
                  >
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                  <Input
                    type="text"
                    placeholder={tipoDocumento === 'CEDULA' ? 'V-12345678' : 'AB1234567'}
                    className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                    {...register('numeroDocumento')}
                  />
                </div>
                {errors.numeroDocumento && <p className="text-xs text-red-500">{errors.numeroDocumento.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefono" className="text-sm font-medium text-[#1A1A1A]">
                  Teléfono <span className="text-[#C1121F]">*</span>
                </Label>
                <div className="flex gap-2">
                  <select
                    className="h-10 w-24 rounded-md border border-[#E8E4DF] bg-[#FEFCF9] px-2 text-sm text-[#1A1A1A] focus:border-[#1B4332] focus:outline-none"
                    value={codigoPais}
                    onChange={(e) => setValue('codigoPais', e.target.value)}
                  >
                    {CODIGOS_PAIS.map((c) => (
                      <option key={c.codigo} value={c.codigo}>{c.label}</option>
                    ))}
                  </select>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="412 1234567"
                    autoComplete="tel"
                    className="h-10 border-[#E8E4DF] bg-[#FEFCF9] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                    {...register('telefono')}
                  />
                </div>
                {errors.telefono && <p className="text-xs text-red-500">{errors.telefono.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">Contraseña</Label>
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
                  >
                    {mostrarContrasena ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1A1A1A]">Confirmar contraseña</Label>
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
                  >
                    {mostrarConfirmacion ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={cargando}
                className="mt-2 h-11 w-full bg-[#1B4332] text-white hover:bg-[#2D6A4F] disabled:opacity-50"
              >
                {cargando ? 'Enviando código...' : 'Verificar correo'}
              </Button>
            </form>
          ) : (
            <div className="grid gap-4">
              {errorForm && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorForm}
                </div>
              )}

              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D8F3DC]">
                  <Mail className="h-7 w-7 text-[#1B4332]" />
                </div>
                <p className="text-center text-sm text-[#6B6560]">
                  Ingresa el código que enviamos a <strong className="text-[#1A1A1A]">{email}</strong>
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="otp" className="text-center text-sm font-medium text-[#1A1A1A]">Código de verificación</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="h-14 border-[#E8E4DF] bg-[#FEFCF9] text-center text-2xl font-bold tracking-[0.5em] placeholder:text-[#9E9892] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
                  placeholder="--------"
                  autoFocus
                />
              </div>

              <div className="text-center">
                {segundosReenvio > 0 ? (
                  <p className="text-xs text-[#9E9892]">Reenviar código en {segundosReenvio}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleReenviarOtp}
                    disabled={reenviando}
                    className="text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] disabled:opacity-50"
                  >
                    {reenviando ? 'Enviando...' : 'Reenviar código'}
                  </button>
                )}
              </div>

              <Button
                type="button"
                onClick={handleVerificarYRegistrar}
                disabled={cargando || otp.length < 6}
                className="h-11 w-full bg-[#1B4332] text-white hover:bg-[#2D6A4F] disabled:opacity-50"
              >
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>

              <button
                type="button"
                onClick={() => { setPaso('datos'); setOtp(''); setErrorForm(null) }}
                className="flex items-center justify-center gap-1 text-sm text-[#6B6560] hover:text-[#1B4332]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Cambiar datos
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t border-[#E8E4DF] pt-4">
          <p className="text-sm text-[#6B6560]">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-[#1B4332] hover:text-[#2D6A4F] transition-colors">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
