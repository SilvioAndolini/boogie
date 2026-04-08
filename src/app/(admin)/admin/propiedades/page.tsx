'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Star, Eye, MoreVertical, Pause, Play,
  Trash2, Loader2, ChevronLeft, ChevronRight, Sparkles, Search,
} from 'lucide-react'
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { AdminHeader, AdminFilterBar, AdminEmptyState } from '@/components/admin'
import {
  getPropiedadesAdmin,
  getCiudadesPropiedades,
  actualizarPropiedadAdmin,
  eliminarPropiedadAdmin,
} from '@/actions/admin-propiedades.actions'
import { TIPOS_PROPIEDAD } from '@/lib/constants'

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: 'bg-[#F8F6F3] text-[#6B6560]' },
  PENDIENTE_REVISION: { label: 'Pendiente', color: 'bg-[#FEF3C7] text-[#92400E]' },
  PUBLICADA: { label: 'Publicada', color: 'bg-[#D8F3DC] text-[#1B4332]' },
  PAUSADA: { label: 'Pausada', color: 'bg-[#FEF3C7] text-[#92400E]' },
  SUSPENDIDA: { label: 'Suspendida', color: 'bg-[#FEE2E2] text-[#C1121F]' },
}

const FILTROS_ESTADO = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PUBLICADA', label: 'Publicadas' },
  { key: 'PENDIENTE_REVISION', label: 'Pendientes' },
  { key: 'BORRADOR', label: 'Borradores' },
  { key: 'PAUSADA', label: 'Pausadas' },
  { key: 'SUSPENDIDA', label: 'Suspendidas' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function formatMoney(n: number, moneda: string) {
  if (moneda === 'VES') return `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

interface PropiedadCard {
  id: string
  titulo: string
  slug: string
  tipo_propiedad: string
  precio_por_noche: number
  moneda: string
  capacidad_maxima: number
  habitaciones: number
  banos: number
  ciudad: string
  estado: string
  estado_publicacion: string
  destacada: boolean
  vistas_totales: number
  rating_promedio: number | null
  total_resenas: number
  propietario: { id: string; nombre: string; apellido: string; email: string; avatar_url: string | null } | null
  imagenes: { url: string; es_principal: boolean }[]
}

export default function AdminPropiedadesPage() {
  const router = useRouter()
  const [propiedades, setPropiedades] = useState<PropiedadCard[]>([])
  const [ciudades, setCiudades] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODAS')
  const [filtroCiudad, setFiltroCiudad] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; titulo: string }>({ open: false, id: '', titulo: '' })

  const load = useCallback(async () => {
    const res = await getPropiedadesAdmin({
      estado: filtroEstado !== 'TODAS' ? filtroEstado : undefined,
      ciudad: filtroCiudad || undefined,
      busqueda: busqueda || undefined,
      pagina,
      limite: 12,
    })
    if (res && 'propiedades' in res) {
      setPropiedades((res.propiedades as unknown as PropiedadCard[]) || [])
      setTotal(res.total ?? 0)
      setPaginas(res.paginas ?? 0)
    }
    setLoading(false)
  }, [filtroEstado, filtroCiudad, busqueda, pagina])

  useEffect(() => {
    getCiudadesPropiedades().then((res) => {
      if (Array.isArray(res)) setCiudades(res)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const handleEstado = async (id: string, nuevoEstado: string) => {
    setActionLoading(id)
    const formData = new FormData()
    formData.append('propiedadId', id)
    formData.append('estadoPublicacion', nuevoEstado)
    const res = await actualizarPropiedadAdmin(formData)
    if (res.error) toast.error(res.error)
    else { toast.success('Estado actualizado'); load() }
    setActionLoading(null)
  }

  const handleDestacar = async (id: string, destacada: boolean) => {
    setActionLoading(id)
    const formData = new FormData()
    formData.append('propiedadId', id)
    formData.append('destacada', String(!destacada))
    const res = await actualizarPropiedadAdmin(formData)
    if (res.error) toast.error(res.error)
    else { toast.success(destacada ? 'Destacada removida' : 'Propiedad destacada'); load() }
    setActionLoading(null)
  }

  const handleEliminar = async () => {
    setActionLoading(deleteDialog.id)
    const formData = new FormData()
    formData.append('propiedadId', deleteDialog.id)
    const res = await eliminarPropiedadAdmin(formData)
    if (res.error) toast.error(res.error)
    else { toast.success('Propiedad eliminada'); setDeleteDialog({ open: false, id: '', titulo: '' }); load() }
    setActionLoading(null)
  }

  return (
    <div>
      <AdminHeader
        icon={Building2}
        titulo="Propiedades"
        subtitulo={`${total} propiedades registradas`}
      />

      <AdminFilterBar
        busqueda={busqueda}
        onBusquedaChange={(v) => { setBusqueda(v); setPagina(1) }}
        placeholder="Buscar por título, ciudad o estado..."
        filtros={FILTROS_ESTADO}
        filtroActivo={filtroEstado}
        onFiltroChange={(key) => { setFiltroEstado(key); setPagina(1) }}
        extraActions={
          ciudades.length > 0 ? (
            <select
              value={filtroCiudad}
              onChange={(e) => { setFiltroCiudad(e.target.value); setPagina(1) }}
              className="h-7 rounded-lg border border-[#E8E4DF] bg-white px-2 text-xs text-[#6B6560] outline-none focus:border-[#52B788]"
            >
              <option value="">Todas las ciudades</option>
              {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[#E8E4DF] bg-white">
              <div className="aspect-[4/3] bg-[#F4F1EC]" />
              <div className="space-y-2 p-5">
                <div className="h-4 w-3/4 rounded bg-[#F4F1EC]" />
                <div className="h-3 w-1/2 rounded bg-[#F4F1EC]" />
                <div className="h-3 w-1/3 rounded bg-[#F4F1EC]" />
              </div>
            </div>
          ))}
        </div>
      ) : propiedades.length === 0 ? (
        <AdminEmptyState icon={Building2} titulo="Sin propiedades" descripcion={busqueda || filtroEstado !== 'TODAS' ? 'Intenta ajustar los filtros' : 'No hay propiedades registradas'} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {propiedades.map((p) => {
                const estadoConfig = ESTADO_CONFIG[p.estado_publicacion] || ESTADO_CONFIG.BORRADOR
                const imagen = p.imagenes?.find(i => i.es_principal)?.url || p.imagenes?.[0]?.url
                const propietario = p.propietario
                return (
                  <motion.div
                    key={p.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <div
                      className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E8E4DF] bg-white transition-shadow hover:shadow-md"
                      onClick={() => router.push(`/admin/propiedades/${p.id}`)}
                    >
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#D8F3DC] to-[#F8F6F3]">
                        {imagen ? (
                          <img src={imagen} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-5xl font-bold text-[#1B4332]/20">B</span>
                          </div>
                        )}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${estadoConfig.color}`}>
                            {estadoConfig.label}
                          </span>
                          {p.destacada && (
                            <span className="flex items-center gap-0.5 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                              <Sparkles className="h-3 w-3" /> Destacada
                            </span>
                          )}
                        </div>
                        <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#6B6560] backdrop-blur-sm transition-colors hover:bg-white">
                              {actionLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/propiedades/${p.slug || p.id}`, '_blank')}>
                                <Eye className="h-4 w-4" /> Vista pública
                              </DropdownMenuItem>
                              {p.estado_publicacion !== 'PUBLICADA' && (
                                <DropdownMenuItem onClick={() => handleEstado(p.id, 'PUBLICADA')}>
                                  <Play className="h-4 w-4" /> Publicar
                                </DropdownMenuItem>
                              )}
                              {p.estado_publicacion === 'PUBLICADA' && (
                                <DropdownMenuItem onClick={() => handleEstado(p.id, 'PAUSADA')}>
                                  <Pause className="h-4 w-4" /> Pausar
                                </DropdownMenuItem>
                              )}
                              {p.estado_publicacion !== 'SUSPENDIDA' && (
                                <DropdownMenuItem onClick={() => handleEstado(p.id, 'SUSPENDIDA')}>
                                  <Pause className="h-4 w-4" /> Suspender
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDestacar(p.id, p.destacada)}>
                                <Sparkles className="h-4 w-4" /> {p.destacada ? 'Quitar destacada' : 'Destacar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialog({ open: true, id: p.id, titulo: p.titulo })}>
                                <Trash2 className="h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="space-y-2 p-4">
                        <h3 className="line-clamp-1 text-sm font-semibold text-[#1A1A1A]">{p.titulo}</h3>
                        <div className="flex items-center gap-1 text-xs text-[#6B6560]">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{p.ciudad}, {p.estado}</span>
                        </div>
                        {propietario && (
                          <p className="text-[11px] text-[#9E9892]">
                            {propietario.nombre} {propietario.apellido}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-bold text-[#1B4332]">
                            {formatMoney(p.precio_por_noche, p.moneda)}<span className="text-[10px] font-normal text-[#9E9892]">/noche</span>
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-[#9E9892]">
                            {p.rating_promedio !== null && (
                              <span className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-[#F4A261] text-[#F4A261]" />
                                {p.rating_promedio.toFixed(1)}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" /> {p.vistas_totales}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {paginas > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}
                className="border-[#E8E4DF]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm text-[#6B6560]">
                {pagina} de {paginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina === paginas}
                onClick={() => setPagina(p => p + 1)}
                className="border-[#E8E4DF]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: deleteDialog.id, titulo: deleteDialog.titulo })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar propiedad</DialogTitle>
            <DialogDescription>
              Se eliminará permanentemente <strong>{deleteDialog.titulo}</strong> junto con todas sus imágenes, reservas y datos asociados. Esta acción es irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: '', titulo: '' })} className="border-[#E8E4DF]">
              Cancelar
            </Button>
            <Button
              onClick={handleEliminar}
              disabled={actionLoading === deleteDialog.id}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading === deleteDialog.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
