'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface AdminConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion: string
  onConfirm: () => void
  textoConfirmar?: string
  textoCancelar?: string
  destructive?: boolean
  loading?: boolean
}

export function AdminConfirmDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  onConfirm,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  destructive = false,
  loading = false,
}: AdminConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-[#E8E4DF]"
          >
            {textoCancelar}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
            className={!destructive ? 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]' : ''}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
