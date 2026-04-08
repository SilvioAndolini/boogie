'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registrarUsuarioAdmin } from '@/actions/admin-usuarios.actions'
import { toast } from 'sonner'

interface RegistrarUsuarioModalProps {
  abierto: boolean
  onCerrar: () => void
  onRegistrado: () => void
}

export function RegistrarUsuarioModal({ abierto, onCerrar, onRegistrado }: RegistrarUsuarioModalProps) {
  const [enviando, setEnviando] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState<'CEDULA' | 'PASAPORTE'>('CEDULA')
  const [codigoPais, setCodigoPais] = useState('+58')
  const [rol, setRol] = useState<string>('HUESPED')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEnviando(true)

    const formData = new FormData(e.currentTarget)
    formData.set('tipoDocumento', tipoDocumento)
    formData.set('codigoPais', codigoPais)
    formData.set('rol', rol)

    const res = await registrarUsuarioAdmin(formData)

    if (res.error) {
      toast.error(res.error)
      setEnviando(false)
      return
    }

    toast.success('Usuario registrado exitosamente')
    setEnviando(false)
    onRegistrado()
    onCerrar()
  }

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D8F3DC]">
              <UserPlus className="h-4 w-4 text-[#1B4332]" />
            </div>
            Registrar nuevo usuario
          </DialogTitle>
          <DialogDescription>
            Crea una cuenta directamente sin verificación OTP. El usuario podrá iniciar sesión inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-sm font-medium text-[#1A1A1A]">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="María"
                required
                minLength={2}
                disabled={enviando}
                className="border-[#E8E4DF]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido" className="text-sm font-medium text-[#1A1A1A]">Apellido</Label>
              <Input
                id="apellido"
                name="apellido"
                placeholder="García"
                required
                minLength={2}
                disabled={enviando}
                className="border-[#E8E4DF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1A]">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="maria@ejemplo.com"
              required
              disabled={enviando}
              className="border-[#E8E4DF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-[#1A1A1A]">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                disabled={enviando}
                className="border-[#E8E4DF]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1A1A1A]">Confirmar</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repetir contraseña"
                required
                minLength={8}
                disabled={enviando}
                className="border-[#E8E4DF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1A1A1A]">Tipo de documento</Label>
              <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v as 'CEDULA' | 'PASAPORTE')} disabled={enviando}>
                <SelectTrigger className="border-[#E8E4DF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEDULA">Cédula</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numeroDocumento" className="text-sm font-medium text-[#1A1A1A]">
                {tipoDocumento === 'CEDULA' ? 'Número de cédula' : 'Número de pasaporte'}
              </Label>
              <Input
                id="numeroDocumento"
                name="numeroDocumento"
                placeholder={tipoDocumento === 'CEDULA' ? 'V-12345678' : 'A12345678'}
                required
                minLength={4}
                disabled={enviando}
                className="border-[#E8E4DF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#1A1A1A]">Código país</Label>
              <Select value={codigoPais} onValueChange={(v) => { if (v) setCodigoPais(v) }} disabled={enviando}>
                <SelectTrigger className="border-[#E8E4DF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+58">+58 (Venezuela)</SelectItem>
                  <SelectItem value="+1">+1 (EE.UU.)</SelectItem>
                  <SelectItem value="+57">+57 (Colombia)</SelectItem>
                  <SelectItem value="+53">+53 (Cuba)</SelectItem>
                  <SelectItem value="+52">+52 (México)</SelectItem>
                  <SelectItem value="+54">+54 (Argentina)</SelectItem>
                  <SelectItem value="+56">+56 (Chile)</SelectItem>
                  <SelectItem value="+51">+51 (Perú)</SelectItem>
                  <SelectItem value="+34">+34 (España)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono" className="text-sm font-medium text-[#1A1A1A]">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="4121234567"
                required
                minLength={7}
                disabled={enviando}
                className="border-[#E8E4DF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#1A1A1A]">Rol del usuario</Label>
            <Select value={rol} onValueChange={(v) => { if (v) setRol(v) }} disabled={enviando}>
              <SelectTrigger className="border-[#E8E4DF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HUESPED">Huésped</SelectItem>
                <SelectItem value="ANFITRION">Anfitrión</SelectItem>
                <SelectItem value="AMBOS">Ambos</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 pt-2"
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCerrar}
              disabled={enviando}
              className="flex-1 border-[#E8E4DF] text-[#6B6560]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={enviando}
              className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
            >
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrar usuario
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
