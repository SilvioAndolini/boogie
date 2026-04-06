'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** Icono a mostrar */
  icono: LucideIcon
  /** Título del estado vacío */
  titulo: string
  /** Descripción del estado vacío */
  descripcion: string
  /** Texto del botón de acción (opcional) */
  accion?: string
  /** Función al hacer clic en el botón de acción (opcional) */
  onAccion?: () => void
  /** Clase CSS adicional */
  className?: string
}

// Componente para mostrar un estado vacío con icono, título y descripción
export function EmptyState({
  icono: Icono,
  titulo,
  descripcion,
  accion,
  onAccion,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F6F3]">
        <Icono className="h-8 w-8 text-[#9E9892]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[#1A1A1A]">{titulo}</h3>
      <p className="mb-6 max-w-sm text-sm text-[#6B6560]">{descripcion}</p>
      {accion && onAccion && (
        <Button onClick={onAccion} size="lg">
          {accion}
        </Button>
      )}
    </div>
  )
}
