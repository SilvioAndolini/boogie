'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, MoreVertical, Pencil, Pause, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { eliminarPropiedad, actualizarEstadoPropiedad } from '@/actions/propiedad.actions'

const ESTADO_PUBLICACION_CONFIG: Record<string, { etiqueta: string; className: string }> = {
  BORRADOR: { etiqueta: 'Borrador', className: 'bg-[#F8F6F3] text-[#6B6560]' },
  PUBLICADA: { etiqueta: 'Publicada', className: 'bg-[#D8F3DC] text-[#1B4332]' },
  PAUSADA: { etiqueta: 'Pausada', className: 'bg-[#FEF3C7] text-[#92400E]' },
}

function formatearPrecio(precio: number, moneda: 'USD' | 'VES'): string {
  if (moneda === 'USD') return `$${precio.toLocaleString('en-US')}`
  return `Bs. ${precio.toLocaleString('es-VE')}`
}

export default function BoogieCard({ boogie }: { boogie: Record<string, unknown> }) {
  const router = useRouter()
  const id = boogie.id as string
  const estadoPublicacion = (boogie.estado_publicacion as string) || 'BORRADOR'
  const config = ESTADO_PUBLICACION_CONFIG[estadoPublicacion] ?? ESTADO_PUBLICACION_CONFIG.BORRADOR
  const imagenes = boogie.imagenes as { url: string; es_principal: boolean }[] | undefined
  const imagenPrincipal = imagenes?.find((img) => img.es_principal)?.url || imagenes?.[0]?.url
  const slug = (boogie.slug as string) || id

  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [pausando, setPausando] = useState(false)

  const handlePausar = async () => {
    setPausando(true)
    try {
      const nuevoEstado = estadoPublicacion === 'PAUSADA' ? 'BORRADOR' : 'PAUSADA'
      const result = await actualizarEstadoPropiedad(id, nuevoEstado)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(nuevoEstado === 'PAUSADA' ? 'Boogie pausado' : 'Boogie reanudado')
      router.refresh()
    } catch {
      toast.error('Error al cambiar el estado')
    } finally {
      setPausando(false)
    }
  }

  const handleEliminar = async () => {
    setEliminando(true)
    try {
      const result = await eliminarPropiedad(id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setDialogOpen(false)
      setConfirmText('')
      toast.success('Boogie eliminado')
      router.refresh()
    } catch {
      toast.error('Error al eliminar el boogie')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <Card className="cursor-pointer overflow-hidden border-[#E8E4DF] transition-shadow hover:shadow-md" onClick={() => router.push(`/propiedades/${slug}`)}>
        <div className="mx-3 mt-3 overflow-hidden rounded-xl">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
            {imagenPrincipal ? (
              <img src={imagenPrincipal} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-5xl font-bold text-[#1B4332]/20">B</span>
              </div>
            )}
            <div className="absolute left-3 top-3">
              <Badge className={config.className}>{config.etiqueta}</Badge>
            </div>
            <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B6560] backdrop-blur-sm transition-colors hover:bg-white">
                  {pausando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/mis-propiedades/${id}/editar`)}>
                    <Pencil className="h-4 w-4" />
                    Editar boogie
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePausar} disabled={pausando}>
                    <Pause className="h-4 w-4" />
                    {estadoPublicacion === 'PAUSADA' ? 'Reanudar boogie' : 'Pausar boogie'}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar boogie
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <CardContent className="space-y-2 px-5 pb-5 pt-3">
          <h3 className="line-clamp-1 font-semibold text-[#1A1A1A]">
            {boogie.titulo as string}
          </h3>
          <div className="flex items-center gap-1 text-sm text-[#6B6560]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {boogie.ciudad as string}, {boogie.estado as string}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold text-[#1B4332]">
              {formatearPrecio(boogie.precio_por_noche as number, (boogie.moneda as 'USD' | 'VES') || 'USD')}
            </span>
            <span className="text-xs text-[#9E9892]">por noche</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmText('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar boogie</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el boogie
              <strong> {(boogie.titulo as string)}</strong> junto con todas sus imágenes y datos asociados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-[#6B6560]">
              Escribe <strong className="text-[#1A1A1A]">Eliminar boogie</strong> para confirmar:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Eliminar boogie"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setConfirmText('') }}>
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={confirmText !== 'Eliminar boogie' || eliminando}
              className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
