'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  /** Mensaje de error a mostrar */
  mensaje: string
  /** Clase CSS adicional */
  className?: string
}

// Componente para mostrar mensajes de error con estilo consistente
export function ErrorMessage({ mensaje, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
      <p className="text-sm font-medium text-red-700">{mensaje}</p>
    </div>
  )
}
