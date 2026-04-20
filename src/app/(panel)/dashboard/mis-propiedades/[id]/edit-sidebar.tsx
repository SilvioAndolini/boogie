'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Check, ChevronDown, ChevronUp, Upload, Home, MapPin, Sparkles, DollarSign, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { propiedadSchema } from '@/lib/validations'
import { TIPOS_PROPIEDAD, ESTADOS_VENEZUELA, POLITICAS_CANCELACION, MAX_IMAGENES_PROPIEDAD } from '@/lib/constants'
import { actualizarPropiedad } from '@/actions/propiedad.actions'
import { optimizeImage } from '@/lib/image-optimize'

const AMENIDADES = [
  'Wi-Fi', 'Aire acondicionado', 'Piscina', 'Estacionamiento',
  'Cocina equipada', 'Lavadora', 'TV / Smart TV', 'Agua caliente',
  'Seguridad 24h', 'Jardín', 'Parrilla', 'Balcón',
  'Vista al mar', 'Acceso a playa', 'Pet friendly', 'Gimnasio',
]

const SECCIONES = [
  { id: 'info', label: 'Información básica', icon: Home },
  { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
  { id: 'precios', label: 'Precios y capacidad', icon: DollarSign },
  { id: 'politicas', label: 'Políticas y reglas', icon: Clock },
  { id: 'amenidades', label: 'Amenidades', icon: Sparkles },
] as const

type SeccionId = (typeof SECCIONES)[number]['id']

export default function EditSidebar({
  open,
  onClose,
  propiedad,
}: {
  open: boolean
  onClose: () => void
  propiedad: Record<string, unknown>
}) {
  const router = useRouter()
  const propId = propiedad.id as string
  const [guardando, setGuardando] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<SeccionId>>(new Set(['info']))
  const [amenidadesSel, setAmenidadesSel] = useState<string[]>((propiedad.amenidades as string[]) || [])
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [optimizando, setOptimizando] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const imagenesExistentes = (propiedad.imagenes as { id: string; url: string; es_principal: boolean }[]) || []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propiedadSchema),
    defaultValues: {
      titulo: (propiedad.titulo as string) || '',
      descripcion: (propiedad.descripcion as string) || '',
      tipoPropiedad: ((propiedad.tipo_propiedad as string) || 'APARTAMENTO') as 'APARTAMENTO' | 'CASA' | 'VILLA' | 'CABANA' | 'ESTUDIO' | 'HABITACION' | 'LOFT' | 'PENTHOUSE' | 'FINCA' | 'OTRO',
      precioPorNoche: (propiedad.precio_por_noche as number) || 0,
      moneda: ((propiedad.moneda as string) || 'USD') as 'USD' | 'VES',
      capacidadMaxima: (propiedad.capacidad_maxima as number) || 1,
      habitaciones: (propiedad.habitaciones as number) || 1,
      banos: (propiedad.banos as number) || 1,
      camas: (propiedad.camas as number) || 1,
      direccion: (propiedad.direccion as string) || '',
      ciudad: (propiedad.ciudad as string) || '',
      estado: (propiedad.estado as string) || '',
      zona: (propiedad.zona as string) || '',
      reglas: (propiedad.reglas as string) || '',
      politicaCancelacion: ((propiedad.politica_cancelacion as string) || 'MODERADA') as 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA',
      horarioCheckIn: (propiedad.horario_checkin as string) || '14:00',
      horarioCheckOut: (propiedad.horario_checkout as string) || '11:00',
      estanciaMinima: (propiedad.estancia_minima as number) || 1,
      estanciaMaxima: (propiedad.estancia_maxima as number) || undefined,
      amenidades: amenidadesSel,
    },
  })

  const toggleSection = (id: SeccionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAmenidad = (a: string) => {
    setAmenidadesSel((prev) => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const handleImagenes = useCallback(async (files: FileList | null) => {
    if (!files) return
    setOptimizando(true)
    const nuevas: File[] = []
    const nuevasPreview: string[] = []
    const max = MAX_IMAGENES_PROPIEDAD - imagenesExistentes.length - imagenes.length
    const arr = Array.from(files).slice(0, max)
    for (const file of arr) {
      if (!file.type.startsWith('image/')) continue
      try {
        const optimized = await optimizeImage(file)
        nuevas.push(optimized)
        nuevasPreview.push(URL.createObjectURL(optimized))
      } catch { /* skip */ }
    }
    setImagenes((prev) => [...prev, ...nuevas])
    setPreviews((prev) => [...prev, ...nuevasPreview])
    setOptimizando(false)
  }, [imagenes.length, imagenesExistentes.length])

  const removeImagen = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setImagenes((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (data: Record<string, unknown>) => {
    setGuardando(true)
    const formData = new FormData()
    const fields = [
      'titulo', 'descripcion', 'tipoPropiedad', 'precioPorNoche', 'moneda',
      'capacidadMaxima', 'habitaciones', 'banos', 'camas', 'direccion',
      'ciudad', 'estado', 'zona', 'reglas', 'politicaCancelacion',
      'horarioCheckIn', 'horarioCheckOut', 'estanciaMinima', 'estanciaMaxima',
    ]
    for (const f of fields) {
      const val = data[f]
      if (val !== undefined && val !== null && val !== '') {
        formData.append(f, String(val))
      }
    }
    amenidadesSel.forEach((a) => formData.append('amenidades', a))
    imagenes.forEach((img) => formData.append('imagenes', img))

    const res = await actualizarPropiedad(propId, formData)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Boogie actualizado')
      onClose()
      router.refresh()
    }
    setGuardando(false)
  }

  const inputClass = "h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"
  const selectClass = "flex h-11 w-full rounded-md border border-[#E8E4DF] bg-[#FDFCFA] px-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8E4DF] bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Editar boogie</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E9892] hover:bg-[#F8F6F3] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {SECCIONES.map((sec) => (
                <div key={sec.id} className="rounded-xl border border-[#E8E4DF] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FDFCFA] transition-colors"
                  >
                    <sec.icon className="h-4 w-4 text-[#1B4332]" />
                    <span className="flex-1 text-sm font-semibold text-[#1A1A1A]">{sec.label}</span>
                    {expandedSections.has(sec.id) ? <ChevronUp className="h-4 w-4 text-[#9E9892]" /> : <ChevronDown className="h-4 w-4 text-[#9E9892]" />}
                  </button>
                  <AnimatePresence>
                    {expandedSections.has(sec.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[#F4F1EC] p-4 space-y-4">
                          {sec.id === 'info' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Título</label>
                                <Input {...register('titulo')} className={inputClass} />
                                {errors.titulo && <p className="text-xs text-[#C1121F]">{String(errors.titulo.message)}</p>}
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Descripción</label>
                                <Textarea {...register('descripcion')} rows={3} className="border-[#E8E4DF] bg-[#FDFCFA] text-sm" />
                                {errors.descripcion && <p className="text-xs text-[#C1121F]">{String(errors.descripcion.message)}</p>}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Tipo</label>
                                  <select {...register('tipoPropiedad')} className={selectClass}>
                                    {Object.entries(TIPOS_PROPIEDAD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Capacidad</label>
                                  <Input {...register('capacidadMaxima', { valueAsNumber: true })} type="number" min={1} className={inputClass} />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Habitaciones</label>
                                  <Input {...register('habitaciones', { valueAsNumber: true })} type="number" min={0} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Baños</label>
                                  <Input {...register('banos', { valueAsNumber: true })} type="number" min={1} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Camas</label>
                                  <Input {...register('camas', { valueAsNumber: true })} type="number" min={1} className={inputClass} />
                                </div>
                              </div>
                            </>
                          )}

                          {sec.id === 'ubicacion' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Dirección</label>
                                <Input {...register('direccion')} className={inputClass} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Ciudad</label>
                                  <Input {...register('ciudad')} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Estado</label>
                                  <select {...register('estado')} className={selectClass}>
                                    {ESTADOS_VENEZUELA.map((e) => <option key={e} value={e}>{e}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Zona</label>
                                <Input {...register('zona')} className={inputClass} />
                              </div>
                            </>
                          )}

                          {sec.id === 'precios' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Precio por noche</label>
                                <Input {...register('precioPorNoche', { valueAsNumber: true })} type="number" step="0.01" min={1} className={inputClass} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Moneda</label>
                                <select {...register('moneda')} className={selectClass}>
                                  <option value="USD">USD ($)</option>
                                  <option value="VES">VES (Bs.)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {sec.id === 'politicas' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Política de cancelación</label>
                                <select {...register('politicaCancelacion')} className={selectClass}>
                                  {Object.entries(POLITICAS_CANCELACION).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Check-in</label>
                                  <Input {...register('horarioCheckIn')} type="time" className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Check-out</label>
                                  <Input {...register('horarioCheckOut')} type="time" className={inputClass} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Estancia mínima (noches)</label>
                                  <Input {...register('estanciaMinima', { valueAsNumber: true })} type="number" min={1} className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-[#6B6560]">Estancia máxima (noches)</label>
                                  <Input {...register('estanciaMaxima', { valueAsNumber: true })} type="number" min={1} className={inputClass} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#6B6560]">Reglas</label>
                                <Textarea {...register('reglas')} rows={3} className="border-[#E8E4DF] bg-[#FDFCFA] text-sm" />
                              </div>
                            </>
                          )}

                          {sec.id === 'amenidades' && (
                            <div className="flex flex-wrap gap-2">
                              {AMENIDADES.map((a) => (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => toggleAmenidad(a)}
                                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                    amenidadesSel.includes(a)
                                      ? 'bg-[#1B4332] text-white'
                                      : 'bg-[#F4F1EC] text-[#6B6560] hover:bg-[#E8E4DF]'
                                  }`}
                                >
                                  {a}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="rounded-xl border border-[#E8E4DF] p-4">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Imágenes</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {imagenesExistentes.map((img) => (
                    <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#E8E4DF]">
                      <Image fill src={img.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {previews.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#1B4332]">
                      <Image fill src={url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeImagen(i)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImagenes(e.target.files)} />
                <Button type="button" variant="outline" className="w-full border-dashed border-[#E8E4DF]" onClick={() => fileInputRef.current?.click()} disabled={optimizando}>
                  {optimizando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Subir imágenes
                </Button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1 border-[#E8E4DF]" onClick={onClose}>Cancelar</Button>
                <Button type="submit" className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F]" disabled={guardando}>
                  {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
