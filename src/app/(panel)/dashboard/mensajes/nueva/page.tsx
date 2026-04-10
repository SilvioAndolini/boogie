'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { obtenerOCrearConversacion } from '@/actions/chat.actions'

export default function NuevaConversacionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function crear() {
      const usuarioId = searchParams.get('usuario')
      const propiedadId = searchParams.get('propiedad') || undefined

      if (!usuarioId) {
        setError('Usuario no especificado')
        return
      }

      const res = await obtenerOCrearConversacion(usuarioId, propiedadId)

      if (res.exito && res.datos) {
        router.replace(`/dashboard/mensajes/${res.datos.id}`)
      } else {
        setError(res.error || 'Error al crear conversación')
      }
    }

    crear()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-sm text-[#E76F51]">{error}</p>
        <button
          onClick={() => router.push('/dashboard/mensajes')}
          className="text-xs text-[#1B4332] underline"
        >
          Volver a mensajes
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-[#52B788]" />
    </div>
  )
}
