'use client'

import { useState, useEffect, useTransition, useCallback, useMemo, startTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, Loader2, Plus, Trash2, Search, X, MapPin, Star, Eye, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getSeccionesDestacadasAdmin,
  actualizarSeccionDestacada,
  eliminarSeccionDestacada,
  listarPropiedadesPublicadas,
  getPropiedadesPorIds,
  previsualizarPropiedadesPorUbicacion,
  type SeccionDestacada,
} from '@/actions/secciones-destacadas.actions'

const TIPO_FILTRO_LABELS: Record<string, string> = {
  MANUAL: 'Selección manual',
  RATING: 'Mejores valorados',
  POPULAR: 'Más populares',
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

interface PropiedadMini {
  id: string
  titulo: string
  ciudad: string
  estado: string
  imagen: string | null
  precioPorNoche?: number
  moneda?: string
  ratingPromedio?: number
  totalResenas?: number
}

function PropiedadChip({ titulo, ciudad, imagen, onRemove }: { titulo: string; ciudad: string; imagen: string | null; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#D8F3DC] bg-[#F0FFF4] pr-2 pl-1 py-1">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#E8E4DF]">
        {imagen ? <Image src={imagen} alt="" fill className="object-cover" sizes="32px" /> : <div className="flex h-full w-full items-center justify-center text-[10px] font-light text-[#9E9892]">B</div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-[#1A1A1A]">{titulo}</p>
        <p className="truncate text-[9px] text-[#6B6560]">{ciudad}</p>
      </div>
      <button onClick={onRemove} className="shrink-0 text-[#9E9892] hover:text-[#C1121F] transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function PropiedadPreviewMini({ p }: { p: PropiedadMini }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#E8E4DF] bg-[#FDFCFA] px-2.5 py-2">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#E8E4DF]">
        {p.imagen ? <Image src={p.imagen} alt="" fill className="object-cover" sizes="40px" /> : <div className="flex h-full w-full items-center justify-center text-xs font-light text-[#9E9892]">B</div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-[#1A1A1A]">{p.titulo}</p>
        <div className="flex items-center gap-1.5 text-[9px] text-[#6B6560]">
          <MapPin className="h-2.5 w-2.5 text-[#52B788]" />
          <span className="truncate">{p.ciudad}, {p.estado}</span>
        </div>
      </div>
      {p.precioPorNoche != null && (
        <span className="shrink-0 text-[11px] font-bold text-[#1B4332]">
          {p.moneda === 'USD' ? '$' : 'Bs.'}{p.precioPorNoche.toLocaleString()}
        </span>
      )}
      {(p.ratingPromedio ?? 0) > 0 && (
        <div className="flex items-center gap-0.5 shrink-0">
          <Star className="h-2.5 w-2.5 fill-[#F4A261] text-[#F4A261]" />
          <span className="text-[10px] font-semibold">{p.ratingPromedio!.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

function SeccionEditor({ seccion, onSave, onDelete, creating }: {
  seccion: SeccionDestacada | null
  onSave: (fd: FormData) => Promise<{ error?: string; exito?: boolean }>
  onDelete: (fd: FormData) => Promise<{ error?: string; exito?: boolean }>
  creating?: boolean
}) {
  const [titulo, setTitulo] = useState(seccion?.titulo || '')
  const [subtitulo, setSubtitulo] = useState(seccion?.subtitulo || '')
  const [tipoFiltro, setTipoFiltro] = useState<'MANUAL' | 'RATING' | 'POPULAR'>(seccion?.tipo_filtro || 'MANUAL')
  const [filtroEstado, setFiltroEstado] = useState(seccion?.filtro_estado || '')
  const [filtroCiudad, setFiltroCiudad] = useState(seccion?.filtro_ciudad || '')
  const [orden, setOrden] = useState(seccion?.orden || 0)
  const [activa, setActiva] = useState(seccion?.activa ?? true)
  const [selectedIds, setSelectedIds] = useState<string[]>(seccion?.propiedad_ids || [])
  const [selectedProps, setSelectedProps] = useState<PropiedadMini[]>([])
  const [allProps, setAllProps] = useState<PropiedadMini[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [previewProps, setPreviewProps] = useState<PropiedadMini[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    listarPropiedadesPublicadas().then((data) => setAllProps(data as PropiedadMini[]))
  }, [])

  useEffect(() => {
    if (selectedIds.length > 0) {
      getPropiedadesPorIds(selectedIds).then((data) => setSelectedProps(data as PropiedadMini[]))
    } else {
      setSelectedProps([])
    }
  }, [selectedIds.length])

  const filteredProps = useMemo(() => {
    if (!searchQuery.trim()) return allProps
    const q = searchQuery.toLowerCase()
    return allProps.filter((p) =>
      p.titulo.toLowerCase().includes(q) || p.ciudad.toLowerCase().includes(q) || p.estado.toLowerCase().includes(q)
    )
  }, [allProps, searchQuery])

  const addPropiedad = (id: string) => {
    if (selectedIds.length >= 10) { toast.error('Máximo 10 propiedades por sección'); return }
    if (!selectedIds.includes(id)) setSelectedIds([...selectedIds, id])
  }

  const removePropiedad = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id))
    setSelectedProps(selectedProps.filter((p) => p.id !== id))
  }

  const loadPreview = useCallback(() => {
    if (tipoFiltro === 'MANUAL' || (!filtroEstado && !filtroCiudad)) { setPreviewProps([]); return }
    setPreviewLoading(true)
    previsualizarPropiedadesPorUbicacion(tipoFiltro, filtroEstado, filtroCiudad)
      .then((data) => setPreviewProps(data as PropiedadMini[]))
      .finally(() => setPreviewLoading(false))
  }, [tipoFiltro, filtroEstado, filtroCiudad])

  const handleSave = () => {
    const fd = new FormData()
    if (seccion?.id) fd.set('id', seccion.id)
    fd.set('titulo', titulo)
    fd.set('subtitulo', subtitulo)
    fd.set('tipo_filtro', tipoFiltro)
    fd.set('filtro_estado', filtroEstado)
    fd.set('filtro_ciudad', filtroCiudad)
    fd.set('propiedad_ids', tipoFiltro === 'MANUAL' ? selectedIds.join(',') : '')
    fd.set('orden', String(orden))
    fd.set('activa', String(activa))
    startTransition(async () => {
      const res = await onSave(fd)
      if (res.error) toast.error(res.error)
      else toast.success(seccion?.id ? 'Sección actualizada' : 'Sección creada')
    })
  }

  const handleDelete = () => {
    if (!seccion?.id) return
    if (!confirm('¿Eliminar esta sección?')) return
    const fd = new FormData()
    fd.set('id', seccion.id)
    startTransition(async () => {
      const res = await onDelete(fd)
      if (res.error) toast.error(res.error)
      else toast.success('Sección eliminada')
    })
  }

  return (
    <div className="rounded-2xl border border-[#E8E4DF] bg-white overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Subtítulo</label>
            <input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Tipo de filtro</label>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as 'MANUAL' | 'RATING' | 'POPULAR')} className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm focus:border-[#1B4332] focus:outline-none">
              {Object.entries(TIPO_FILTRO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {tipoFiltro !== 'MANUAL' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Estado</label>
                <input value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} placeholder="Ej: Distrito Capital" className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Ciudad</label>
                <input value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)} placeholder="Ej: Caracas" className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/10" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Orden</label>
                <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className="h-10 w-full rounded-xl border border-[#E8E4DF] bg-[#FEFCF9] px-3 text-sm focus:border-[#1B4332] focus:outline-none" />
              </div>
              <div />
            </>
          )}
        </div>

        {tipoFiltro === 'MANUAL' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
                Seleccionados ({selectedIds.length}/10)
              </label>
              {selectedProps.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedProps.map((p) => (
                    <PropiedadChip key={p.id} titulo={p.titulo} ciudad={p.ciudad} imagen={p.imagen} onRemove={() => removePropiedad(p.id)} />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#9E9892] py-2">Clickea un boogie de la lista para agregarlo</p>
              )}
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">
                Boogies publicados ({filteredProps.length})
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9E9892]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar..."
                  className="h-9 w-full rounded-lg border border-[#E8E4DF] bg-[#FEFCF9] pl-9 pr-3 text-xs focus:border-[#1B4332] focus:outline-none"
                />
              </div>
              <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
                {filteredProps.length === 0 ? (
                  <p className="text-[11px] text-[#9E9892] py-4 text-center">No hay boogies publicados</p>
                ) : filteredProps.map((p) => {
                  const isSelected = selectedIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? removePropiedad(p.id) : addPropiedad(p.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                        isSelected
                          ? 'bg-[#D8F3DC] border border-[#52B788]'
                          : 'hover:bg-[#F8F6F3] border border-transparent'
                      }`}
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[#E8E4DF]">
                        {p.imagen ? <Image src={p.imagen} alt="" fill className="object-cover" sizes="32px" /> : <div className="flex h-full w-full items-center justify-center text-[8px] text-[#9E9892]">B</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-[#1A1A1A]">{p.titulo}</p>
                        <p className="truncate text-[9px] text-[#6B6560]">{p.ciudad}, {p.estado}</p>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tipoFiltro !== 'MANUAL' && (filtroEstado || filtroCiudad) && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560]">Vista previa de boogies</label>
              <button onClick={loadPreview} className="flex items-center gap-1 rounded-lg border border-[#E8E4DF] px-2 py-0.5 text-[10px] font-medium text-[#1B4332] hover:bg-[#F8F6F3] transition-colors">
                <Eye className="h-3 w-3" /> Cargar vista previa
              </button>
            </div>
            {previewLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#52B788]" /></div>
            ) : previewProps.length > 0 ? (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {previewProps.map((p) => <PropiedadPreviewMini key={p.id} p={p} />)}
              </div>
            ) : (
              <p className="text-[11px] text-[#9E9892] py-2">Configura estado o ciudad y presiona &quot;Cargar vista previa&quot;</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 text-xs text-[#6B6560]">
            <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} className="rounded border-[#E8E4DF] text-[#1B4332] focus:ring-[#1B4332]/20" />
            Activa
          </label>
          <div className="flex-1" />
          {seccion?.id && (
            <button onClick={handleDelete} disabled={pending} className="flex h-9 items-center gap-1.5 rounded-xl border border-[#C1121F]/30 px-3 text-xs font-medium text-[#C1121F] hover:bg-[#FEF2F2] disabled:opacity-60">
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          )}
          <button onClick={handleSave} disabled={pending || !titulo} className="flex h-9 items-center gap-1.5 rounded-xl bg-[#1B4332] px-5 text-xs font-medium text-white hover:bg-[#2D6A4F] disabled:opacity-60">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {seccion?.id ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSeccionesPage() {
  const [secciones, setSecciones] = useState<SeccionDestacada[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarCrear, setMostrarCrear] = useState(false)

  const cargar = async () => {
    const res = await getSeccionesDestacadasAdmin()
    if (res.error) { toast.error(res.error); return }
    setSecciones(res.secciones || [])
  }

  useEffect(() => { cargar().finally(() => setCargando(false)) }, [])

  if (cargando) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#52B788]" /></div>
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-4xl">
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C]">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <LayoutGrid className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Secciones Destacadas</h1>
            <p className="text-sm text-white/60 mt-0.5">Configura las filas de Boogies en la página principal</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6 flex justify-end">
        <button onClick={() => setMostrarCrear(!mostrarCrear)} className="flex h-10 items-center gap-2 rounded-xl bg-[#1B4332] px-5 text-sm font-medium text-white hover:bg-[#2D6A4F]">
          {mostrarCrear ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {mostrarCrear ? 'Cancelar' : 'Nueva sección'}
        </button>
      </motion.div>

      <AnimatePresence>
        {mostrarCrear && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }} className="overflow-hidden mb-4">
            <SeccionEditor seccion={null} creating onSave={async (fd) => { const res = await actualizarSeccionDestacada(fd); if (res.exito) { setMostrarCrear(false); cargar() } return res }} onDelete={async () => ({ error: 'No se puede eliminar' })} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} className="space-y-3">
        {secciones.map((s) => (
          <motion.div key={s.id} variants={fadeUp}>
            <SeccionEditor seccion={s} onSave={async (fd) => { const res = await actualizarSeccionDestacada(fd); if (res.exito) cargar(); return res }} onDelete={async (fd) => { const res = await eliminarSeccionDestacada(fd); if (res.exito) cargar(); return res }} />
          </motion.div>
        ))}
      </motion.div>

      {secciones.length === 0 && !mostrarCrear && (
        <div className="flex flex-col items-center justify-center py-16 text-[#9E9892]">
          <LayoutGrid className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">No hay secciones configuradas</p>
          <p className="text-xs mt-1">Crea la primera sección para mostrar Boogies en la página principal</p>
        </div>
      )}
    </motion.div>
  )
}
