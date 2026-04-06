'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailOpen } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export default function VerificarEmailPage() {
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  // Manejador para reenviar correo de verificación (placeholder)
  const handleReenviar = async () => {
    setReenviando(true)
    try {
      // TODO: reemplazar con la server action de reenvío de verificación
      console.log('Reenviando correo de verificación...')
      setReenviado(true)
    } catch (error) {
      console.error('Error al reenviar correo:', error)
    } finally {
      setReenviando(false)
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
          Verifica tu correo electrónico
        </CardTitle>
        <CardDescription className="text-[#6B6560]">
          Revisa tu bandeja de entrada para completar el registro
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-6 text-center">
        {/* Ícono de correo abierto */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D8F3DC]">
          <MailOpen className="size-10 text-[#1B4332]" />
        </div>

        {/* Mensaje principal */}
        <div className="grid gap-3">
          <p className="text-sm leading-relaxed text-[#6B6560]">
            Hemos enviado un correo de verificación a tu dirección de email.
            Haz clic en el enlace del correo para activar tu cuenta.
          </p>
          <p className="text-xs text-[#9E9892]">
            Si no encuentras el correo, revisa tu carpeta de correo no deseado o spam.
          </p>
        </div>

        {/* Botón de reenviar */}
        {reenviado ? (
          <p className="text-sm font-medium text-[#1B4332]">
            ¡Correo reenviado! Revisa tu bandeja de entrada.
          </p>
        ) : (
          <Button
            variant="outline"
            onClick={handleReenviar}
            disabled={reenviando}
            className="border-[#E8E4DF] text-[#1B4332] hover:bg-[#F8F6F3] hover:text-[#2D6A4F]"
          >
            {reenviando ? 'Enviando...' : 'Reenviar correo'}
          </Button>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-[#E8E4DF] pt-4">
        <Link
          href="/login"
          className="text-sm font-medium text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
        >
          Volver al inicio de sesión
        </Link>
      </CardFooter>
      </Card>
    </motion.div>
  )
}
