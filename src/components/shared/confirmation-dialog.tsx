'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ReactElement } from 'react'

interface ConfirmationDialogProps {
  /** Título del diálogo */
  titulo: string
  /** Descripción del diálogo */
  descripcion: string
  /** Función al confirmar la acción */
  onConfirm: () => void
  /** Elemento que activa el diálogo */
  trigger: ReactElement
  /** Texto del botón de confirmación (por defecto "Confirmar") */
  textoConfirmar?: string
  /** Texto del botón de cancelar (por defecto "Cancelar") */
  textoCancelar?: string
  /** Variante destructiva para el botón de confirmación */
  destructive?: boolean
  /** Clase CSS adicional */
  className?: string
}

// Diálogo de confirmación reutilizable con AlertDialog de base-ui
export function ConfirmationDialog({
  titulo,
  descripcion,
  onConfirm,
  trigger,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  destructive = false,
  className,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={trigger} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
        />
        <AlertDialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#E8E4DF] bg-white p-6 shadow-lg',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 transition-transform duration-200',
            className
          )}
        >
          {/* Título */}
          <AlertDialog.Title className="text-lg font-semibold text-[#1A1A1A]">
            {titulo}
          </AlertDialog.Title>

          {/* Descripción */}
          <AlertDialog.Description className="mt-2 text-sm text-[#6B6560]">
            {descripcion}
          </AlertDialog.Description>

          {/* Botones de acción */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <AlertDialog.Close
              render={
                <Button variant="outline" size="lg">
                  {textoCancelar}
                </Button>
              }
            />
            <AlertDialog.Close
              render={
                <Button
                  variant={destructive ? 'destructive' : 'default'}
                  size="lg"
                  onClick={onConfirm}
                >
                  {textoConfirmar}
                </Button>
              }
            />
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
