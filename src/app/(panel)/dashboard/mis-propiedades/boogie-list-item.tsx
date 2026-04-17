'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, MoreVertical, Pencil, Pause, Trash2, Loader2, BedDouble, Bath, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'
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

export default function BoogieListItem({ boogie }: { boogie: Record<string, unknown> }) {
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
      <div
        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-[#E8E4DF] bg-white px-4 py-3 transition-shadow hover:shadow-md"
        onClick={() => router.push(`/dashboard/mis-propiedades/${id}`)}
      >
        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
          {imagenPrincipal ? (
            <Image fill src={imagenPrincipal} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-lg font-bold text-[#1B4332]/20">B</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[#1A1A1A]">
              {boogie.titulo as string}
            </h3>
            <Badge className={`shrink-0 text-[10px] ${config.className}`}>{config.etiqueta}</Badge>
            {boogie.es_express as boolean && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#F4A261] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Zap className="h-2.5 w-2.5" />
                Express
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-[#6B6560]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{boogie.ciudad as string}, {boogie.estado as string}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden items-center gap-4 text-xs text-[#6B6560] sm:flex">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{boogie.capacidad_maxima as number}</span>
          </div>
          <div className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            <span>{boogie.habitaciones as number}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            <span>{boogie.banos as number}</span>
          </div>
        </div>

        {/* Price */}
        <div className="shrink-0 text-right">
          <span className="text-sm font-bold text-[#1B4332]">
            {formatearPrecio(boogie.precio_por_noche as number, (boogie.moneda as 'USD' | 'VES') || 'USD')}
          </span>
          <p className="text-[10px] text-[#9E9892]">por noche</p>
        </div>

        {/* Actions */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-[#F8F6F3]">
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
