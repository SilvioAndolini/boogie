'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home, MapPin, Sparkles, Check, Upload, X, Loader2, DollarSign, Clock, Pencil, BedDouble, Bath, CookingPot, Sofa, TreePine, Waves, Mountain, HelpCircle, ChevronDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { propiedadSchema } from '@/lib/validations'
import { TIPOS_PROPIEDAD, POLITICAS_CANCELACION, MAX_IMAGENES_PROPIEDAD } from '@/lib/constants'
import { actualizarPropiedad } from '@/actions/propiedad.actions'
import { optimizeImage } from '@/lib/image-optimize'
import { LocationPickerMap, type AddressData } from '@/components/propiedades/location-picker'

const AMENIDADES = [
  'Wi-Fi', 'Aire acondicionado', 'Piscina', 'Estacionamiento',
  'Cocina equipada', 'Lavadora', 'TV / Smart TV', 'Agua caliente',
  'Seguridad 24h', 'Jardín', 'Parrilla', 'Balcón',
  'Vista al mar', 'Acceso a playa', 'Pet friendly', 'Gimnasio',
]

const CATEGORIAS_IMAGEN = [
  { value: 'habitaciones', label: 'Habitaciones', icon: BedDouble, color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { value: 'banos', label: 'Baños', icon: Bath, color: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  { value: 'cocina', label: 'Cocina', icon: CookingPot, color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'areas_comunes', label: 'Comunes', icon: Sofa, color: 'bg-purple-50 text-purple-700 ring-purple-200' },
  { value: 'exterior', label: 'Exterior', icon: TreePine, color: 'bg-green-50 text-green-700 ring-green-200' },
  { value: 'piscina', label: 'Piscina', icon: Waves, color: 'bg-sky-50 text-sky-700 ring-sky-200' },
  { value: 'vistas', label: 'Vistas', icon: Mountain, color: 'bg-rose-50 text-rose-700 ring-rose-200' },
] as const

const CUSTOM_COLOR = 'bg-orange-50 text-orange-700 ring-orange-200'

function parseCategoria(raw: string): { key: string; label: string; icon: typeof BedDouble; color: string } {
  if (raw.startsWith('personalizada:')) {
    return { key: raw, label: raw.slice(14), icon: HelpCircle, color: CUSTOM_COLOR }
  }
  const found = CATEGORIAS_IMAGEN.find((c) => c.value === raw)
  if (found) return { key: found.value, label: found.label, icon: found.icon, color: found.color }
  return { key: 'otro', label: 'Otro', icon: HelpCircle, color: 'bg-gray-50 text-gray-600 ring-gray-200' }
}

const SECCIONES = [
  { id: 'info', label: 'Información básica', icon: Home },
  { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
  { id: 'precios', label: 'Precios y capacidad', icon: DollarSign },
  { id: 'politicas', label: 'Políticas y reglas', icon: Clock },
  { id: 'amenidades', label: 'Amenidades', icon: Sparkles },
] as const

type SeccionId = (typeof SECCIONES)[number]['id']

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function EditarBoogieClient({ boogie }: { boogie: Record<string, unknown> }) {
  const router = useRouter()
  const boogieId = boogie.id as string
  const [enviando, setEnviando] = useState(false)
  const [intentadoEnviar, setIntentadoEnviar] = useState(false)
  const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({})
  const [amenidadesSeleccionadas, setAmenidadesSeleccionadas] = useState<string[]>(
    (boogie.amenidades as string[]) || []
  )
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imagenCategorias, setImagenCategorias] = useState<string[]>([])
  const [customInputVisible, setCustomInputVisible] = useState<number | null>(null)
  const [customInputValue, setCustomInputValue] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [existentesCustomInputVisible, setExistentesCustomInputVisible] = useState<number | null>(null)
  const [existentesCustomInputValue, setExistentesCustomInputValue] = useState('')
  const [existentesCollapsedGroups, setExistentesCollapsedGroups] = useState<Set<string>>(new Set())
  const [optimizando, setOptimizando] = useState(false)
  const [latitud, setLatitud] = useState<number | null>(
    (boogie.latitud as number) ?? null
  )
  const [longitud, setLongitud] = useState<number | null>(
    (boogie.longitud as number) ?? null
  )
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [seccionExpandida, setSeccionExpandida] = useState<SeccionId>('info')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagenesExistentes = (boogie.imagenes as { id: string; url: string; orden: number; es_principal: boolean; categoria: string }[]) || []
  const [existentesCategorias, setExistentesCategorias] = useState<string[]>(
    imagenesExistentes.map((img) => img.categoria || 'otro')
  )

  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { },
  } = useForm({
    resolver: zodResolver(propiedadSchema),
    defaultValues: {
      titulo: (boogie.titulo as string) || '',
      descripcion: (boogie.descripcion as string) || '',
      tipoPropiedad: ((boogie.tipo_propiedad as string) || 'APARTAMENTO') as 'APARTAMENTO' | 'CASA' | 'VILLA' | 'CABANA' | 'ESTUDIO' | 'HABITACION' | 'LOFT' | 'PENTHOUSE' | 'FINCA' | 'OTRO',
      precioPorNoche: (boogie.precio_por_noche as number) || 0,
      moneda: ((boogie.moneda as string) || 'USD') as 'USD' | 'VES',
      capacidadMaxima: (boogie.capacidad_maxima as number) || 1,
      habitaciones: (boogie.habitaciones as number) || 1,
      banos: (boogie.banos as number) || 1,
      camas: (boogie.camas as number) || 1,
      direccion: (boogie.direccion as string) || '',
      ciudad: (boogie.ciudad as string) || '',
      estado: (boogie.estado as string) || '',
      zona: (boogie.zona as string) || '',
      latitud: (boogie.latitud as number) ?? undefined,
      longitud: (boogie.longitud as number) ?? undefined,
      amenidades: (boogie.amenidades as string[]) || [],
      reglas: (boogie.reglas as string) || '',
      politicaCancelacion: ((boogie.politica_cancelacion as string) || 'MODERADA') as 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA',
      horarioCheckIn: (boogie.horario_checkin as string) || '14:00',
      horarioCheckOut: (boogie.horario_checkout as string) || '11:00',
      estanciaMinima: (boogie.estancia_minima as number) || 1,
    },
  })

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  const toggleAmenidad = (amenidad: string) => {
    setAmenidadesSeleccionadas((prev) =>
      prev.includes(amenidad)
        ? prev.filter((a) => a !== amenidad)
        : [...prev, amenidad]
    )
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitud(lat)
    setLongitud(lng)
    setValue('latitud', lat)
    setValue('longitud', lng)
  }

  const handleAddressChange = (data: AddressData) => {
    setAddressData(data)
    if (data.direccion) setValue('direccion', data.direccion)
    if (data.ciudad) setValue('ciudad', data.ciudad)
    if (data.estado) setValue('estado', data.estado)
    if (data.zona) setValue('zona', data.zona)
  }

  const handleImagenes = useCallback(async (files: FileList | null) => {
    if (!files) return
    if (imagenesExistentes.length + imagenes.length >= MAX_IMAGENES_PROPIEDAD) {
      toast.error(`Máximo ${MAX_IMAGENES_PROPIEDAD} imágenes`)
      return
    }
    setOptimizando(true)
    const nuevas: File[] = []
    const nuevasPreview: string[] = []
    const filesArray = Array.from(files).slice(0, MAX_IMAGENES_PROPIEDAD - imagenesExistentes.length - imagenes.length)
    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) continue
      try {
        const optimized = await optimizeImage(file)
        nuevas.push(optimized)
        nuevasPreview.push(URL.createObjectURL(optimized))
      } catch (err) {
        toast.error(`Error al procesar ${file.name}`)
        console.error(err)
      }
    }
    setImagenes((prev) => [...prev, ...nuevas])
    setPreviews((prev) => [...prev, ...nuevasPreview])
    setImagenCategorias((prev) => [...prev, ...nuevas.map(() => 'otro')])
    setOptimizando(false)
  }, [imagenes.length, imagenesExistentes.length])

  const removeImagen = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImagenes((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    setImagenCategorias((prev) => prev.filter((_, i) => i !== index))
  }

  const setCategoriaImagen = (index: number, categoria: string) => {
    setImagenCategorias((prev) => {
      const next = [...prev]
      next[index] = categoria
      return next
    })
    setCustomInputVisible(null)
    setCustomInputValue('')
  }

  const confirmCustomCategoria = (index: number) => {
    const trimmed = customInputValue.trim()
    if (!trimmed) return
    setCategoriaImagen(index, `personalizada:${trimmed}`)
  }

  const groupedImages = useMemo(() => {
    const map = new Map<string, { parsed: ReturnType<typeof parseCategoria>; indices: number[] }>()
    previews.forEach((_, i) => {
      const cat = imagenCategorias[i] || 'otro'
      if (!map.has(cat)) {
        map.set(cat, { parsed: parseCategoria(cat), indices: [] })
      }
      map.get(cat)!.indices.push(i)
    })
    const entries = Array.from(map.entries())
    entries.sort((a, b) => {
      const aIsCustom = a[0].startsWith('personalizada:')
      const bIsCustom = b[0].startsWith('personalizada:')
      const aIsOther = a[0] === 'otro'
      const bIsOther = b[0] === 'otro'
      if (aIsOther && !bIsOther) return 1
      if (!aIsOther && bIsOther) return -1
      if (aIsCustom && !bIsCustom) return 1
      if (!aIsCustom && bIsCustom) return -1
      return 0
    })
    return entries
  }, [previews, imagenCategorias])

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleGuardar = async () => {
    setIntentadoEnviar(true)
    setErroresValidacion({})
    const data = getValues()
    const result = propiedadSchema.safeParse(data)

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      const errorFields = Object.keys(fieldErrors)
      const errores: Record<string, string> = {}
      for (const [field, msgs] of Object.entries(fieldErrors)) {
        if (msgs && msgs.length > 0) errores[field] = msgs[0]
      }
      setErroresValidacion(errores)
      const seccionMap: Record<string, SeccionId> = {
        titulo: 'info', descripcion: 'info', tipoPropiedad: 'info',
        precioPorNoche: 'precios', moneda: 'precios',
        capacidadMaxima: 'precios', habitaciones: 'precios', banos: 'precios', camas: 'precios',
        direccion: 'ubicacion', ciudad: 'ubicacion', estado: 'ubicacion', zona: 'ubicacion',
        reglas: 'politicas', politicaCancelacion: 'politicas',
        horarioCheckIn: 'politicas', horarioCheckOut: 'politicas', estanciaMinima: 'politicas',
      }
      if (errorFields.length > 0) {
        setSeccionExpandida(seccionMap[errorFields[0]] || 'info')
      }
      const nombreCampo: Record<string, string> = {
        titulo: 'Título', descripcion: 'Descripción', tipoPropiedad: 'Tipo',
        precioPorNoche: 'Precio por noche', moneda: 'Moneda',
        capacidadMaxima: 'Capacidad máxima', habitaciones: 'Habitaciones', banos: 'Baños', camas: 'Camas',
        direccion: 'Dirección', ciudad: 'Ciudad', estado: 'Estado', zona: 'Zona',
        reglas: 'Reglas', politicaCancelacion: 'Política de cancelación',
        horarioCheckIn: 'Check-in', horarioCheckOut: 'Check-out', estanciaMinima: 'Estancia mínima',
      }
      const detalles = errorFields.map((f) => `${nombreCampo[f] || f}: ${errores[f]}`).join('\n')
      toast.error(`${errorFields.length} campo${errorFields.length !== 1 ? 's' : ''} requiere atención:\n${detalles}`, { duration: 8000 })
      return
    }

    setEnviando(true)
    try {
      const data = getValues()
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'amenidades') return
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      amenidadesSeleccionadas.forEach((a) => formData.append('amenidades', a))
      imagenes.forEach((file) => formData.append('imagenes', file))
      imagenCategorias.forEach((c) => formData.append('imagen_categorias', c))
      existentesCategorias.forEach((c) => formData.append('existentes_categorias', c))
      imagenesExistentes.forEach((img) => formData.append('imagen_ids', img.id))

      const result = await actualizarPropiedad(boogieId, formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success('Boogie actualizado correctamente')
      router.push('/dashboard/mis-propiedades')
    } catch (error: any) {
      toast.error('Error al actualizar el boogie')
      console.error('Error al actualizar boogie:', error)
    } finally {
      setEnviando(false)
    }
  }

  const ic = (field?: string) => `h-11 text-sm ${
    field && erroresValidacion[field] && intentadoEnviar
      ? 'border-[#C1121F] bg-[#FEF2F2] focus-visible:border-[#C1121F] focus-visible:ring-[#C1121F]/20'
      : 'border-[#E8E4DF] bg-[#FDFCFA] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20'
  }`

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl">

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/mis-propiedades')}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Editar boogie</h1>
            <p className="text-sm text-white/60">Modifica los detalles de tu alojamiento</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Pencil className="h-5 w-5 text-white/70" />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {SECCIONES.map((sec, i) => (
            <div key={sec.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide ${
                seccionExpandida === sec.id ? 'bg-white text-[#1B4332]' : 'bg-white/10 text-white/50'
              }`}>
                <sec.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{sec.label}</span>
              </div>
              {i < SECCIONES.length - 1 && <div className="h-px w-3 bg-white/15" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ====== FORM ====== */}
      <motion.div variants={fadeUp} className="rounded-2xl border border-[#E8E4DF] bg-gradient-to-b from-[#1B4332]/5 via-white to-white overflow-hidden">

        {SECCIONES.map((sec) => {
          const seccionCampos: Record<SeccionId, string[]> = {
            info: ['titulo', 'descripcion', 'tipoPropiedad', 'capacidadMaxima', 'habitaciones', 'banos', 'camas'],
            ubicacion: ['direccion', 'ciudad', 'estado', 'zona'],
            precios: ['precioPorNoche', 'moneda'],
            politicas: ['politicaCancelacion', 'horarioCheckIn', 'horarioCheckOut', 'estanciaMinima', 'reglas'],
            amenidades: [],
          }
          const errorCount = seccionCampos[sec.id].filter((c) => erroresValidacion[c]).length
          return (
          <div key={sec.id} className="border-b border-[#E8E4DF] last:border-b-0">
            <button
              type="button"
              onClick={() => setSeccionExpandida(seccionExpandida === sec.id ? '' as SeccionId : sec.id)}
              className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${
                errorCount > 0 && intentadoEnviar ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2]' : 'hover:bg-[#FDFCFA]'
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                errorCount > 0 && intentadoEnviar ? 'bg-[#FEE2E2]' : 'bg-[#D8F3DC]'
              }`}>
                {errorCount > 0 && intentadoEnviar ? (
                  <AlertCircle className="h-4 w-4 text-[#C1121F]" />
                ) : (
                  <sec.icon className="h-4 w-4 text-[#1B4332]" />
                )}
              </div>
              <span className="flex-1 text-sm font-semibold text-[#1A1A1A]">{sec.label}</span>
              {errorCount > 0 && intentadoEnviar && (
                <span className="flex items-center gap-1 rounded-full bg-[#C1121F] px-2 py-0.5 text-[10px] font-bold text-white">
                  {errorCount} error{errorCount !== 1 ? 'es' : ''}
                </span>
              )}
              <span className="text-lg text-[#D4CFC9]">{seccionExpandida === sec.id ? '−' : '+'}</span>
            </button>

            <AnimatePresence>
              {seccionExpandida === sec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[#F4F1EC] px-5 py-5 space-y-4">

                    {sec.id === 'info' && (<>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Título</label>
                        <Input placeholder="Ej: Apartamento moderno en Chacao" {...register('titulo')} className={ic('titulo')} />
                        {erroresValidacion.titulo && <p className="text-xs text-[#C1121F]">{erroresValidacion.titulo}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Descripción</label>
                        <Textarea placeholder="Describe tu boogie..." rows={4} {...register('descripcion')} className={`border text-sm ${
                          erroresValidacion.descripcion && intentadoEnviar
                            ? 'border-[#C1121F] bg-[#FEF2F2] focus-visible:border-[#C1121F] focus-visible:ring-[#C1121F]/20'
                            : 'border-[#E8E4DF] bg-[#FDFCFA] focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20'
                        }`} />
                        {erroresValidacion.descripcion && <p className="text-xs text-[#C1121F]">{erroresValidacion.descripcion}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                           <Label className="text-xs font-semibold text-[#6B6560]">Tipo de boogie</Label>
                           <Select onValueChange={(v) => setValue('tipoPropiedad', v as any)} defaultValue={(boogie.tipo_propiedad as string) || 'APARTAMENTO'}>
                             <SelectTrigger className="h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus:ring-[#1B4332]/20">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {Object.entries(TIPOS_PROPIEDAD).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                             </SelectContent>
                           </Select>
                         </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Capacidad máxima</label>
                          <Input type="number" min={1} {...register('capacidadMaxima', { valueAsNumber: true })} className={ic('capacidadMaxima')} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Habitaciones</label>
                          <Input type="number" min={0} {...register('habitaciones', { valueAsNumber: true })} className={ic('habitaciones')} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Baños</label>
                          <Input type="number" min={1} {...register('banos', { valueAsNumber: true })} className={ic('banos')} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Camas</label>
                          <Input type="number" min={1} {...register('camas', { valueAsNumber: true })} className={ic('camas')} />
                        </div>
                      </div>
                    </>)}

                    {sec.id === 'ubicacion' && (<>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Ubicación en el mapa</label>
                        <p className="text-[10px] text-[#9E9892]">Busca una dirección o haz clic en el mapa para marcar la ubicación exacta</p>
                        <LocationPickerMap
                          latitud={latitud}
                          longitud={longitud}
                          onLocationSelect={handleLocationSelect}
                          onAddressChange={handleAddressChange}
                        />
                        {latitud !== null && longitud !== null && (
                          <p className="text-[10px] text-[#1B4332] font-medium">Coordenadas: {latitud.toFixed(6)}, {longitud.toFixed(6)}</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-[#E8E4DF] bg-[#FDFCFA] p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-3.5 w-3.5 text-[#1B4332]" />
                          <span className="text-xs font-semibold text-[#1A1A1A]">Dirección detectada</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Dirección</span>
                          <p className="text-sm text-[#1A1A1A]">{addressData?.direccion || watch('direccion') || (boogie.direccion as string) || '—'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Ciudad</span>
                            <p className="text-sm text-[#1A1A1A]">{addressData?.ciudad || watch('ciudad') || (boogie.ciudad as string) || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Estado</span>
                            <p className="text-sm text-[#1A1A1A]">{addressData?.estado || watch('estado') || (boogie.estado as string) || '—'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Zona</span>
                          <p className="text-sm text-[#1A1A1A]">{addressData?.zona || watch('zona') || (boogie.zona as string) || '—'}</p>
                        </div>
                      </div>
                      <input type="hidden" {...register('direccion')} />
                      <input type="hidden" {...register('ciudad')} />
                      <input type="hidden" {...register('estado')} />
                      <input type="hidden" {...register('zona')} />
                      {intentadoEnviar && (erroresValidacion.direccion || erroresValidacion.ciudad || erroresValidacion.estado) && (
                        <div className="rounded-lg border border-[#C1121F]/20 bg-[#FEF2F2] p-3 space-y-1">
                          <p className="text-xs font-semibold text-[#C1121F]">Campos de ubicación incompletos:</p>
                          {erroresValidacion.direccion && <p className="text-xs text-[#C1121F]">• {erroresValidacion.direccion}</p>}
                          {erroresValidacion.ciudad && <p className="text-xs text-[#C1121F]">• {erroresValidacion.ciudad}</p>}
                          {erroresValidacion.estado && <p className="text-xs text-[#C1121F]">• {erroresValidacion.estado}</p>}
                          <p className="text-[10px] text-[#92400E]">Usa el mapa para seleccionar la ubicación, o edita los campos manualmente</p>
                        </div>
                      )}
                    </>)}

                    {sec.id === 'precios' && (<>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Precio por noche</label>
                          <Input type="number" step="0.01" min={1} placeholder="0.00" {...register('precioPorNoche', { valueAsNumber: true })} className={ic('precioPorNoche')} />
                          {erroresValidacion.precioPorNoche && <p className="text-xs text-[#C1121F]">{erroresValidacion.precioPorNoche}</p>}
                        </div>
                         <div className="space-y-1.5">
                           <Label className="text-xs font-semibold text-[#6B6560]">Moneda</Label>
                           <Select onValueChange={(v) => setValue('moneda', v as 'USD' | 'VES')} defaultValue={(boogie.moneda as string) || 'USD'}>
                             <SelectTrigger className="h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus:ring-[#1B4332]/20">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="USD">USD ($)</SelectItem>
                               <SelectItem value="VES">VES (Bs.)</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                      </div>
                    </>)}

                    {sec.id === 'politicas' && (<>
                       <div className="space-y-1.5">
                         <Label className="text-xs font-semibold text-[#6B6560]">Política de cancelación</Label>
                         <Select onValueChange={(v) => setValue('politicaCancelacion', v as any)} defaultValue={(boogie.politica_cancelacion as string) || 'MODERADA'}>
                           <SelectTrigger className="h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus:ring-[#1B4332]/20">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {Object.entries(POLITICAS_CANCELACION).map(([k, v]) => <SelectItem key={k} value={k}>{v.nombre}</SelectItem>)}
                           </SelectContent>
                         </Select>
                       </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Check-in</label>
                          <Input type="time" {...register('horarioCheckIn')} className={ic('horarioCheckIn')} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Check-out</label>
                          <Input type="time" {...register('horarioCheckOut')} className={ic('horarioCheckOut')} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Estancia mínima (noches)</label>
                        <Input type="number" min={1} {...register('estanciaMinima', { valueAsNumber: true })} className={ic('estanciaMinima')} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Reglas del boogie</label>
                        <Textarea placeholder="Ej: No fumar, no mascotas, no fiestas..." rows={3} {...register('reglas')} className="border-[#E8E4DF] bg-[#FDFCFA] text-sm" />
                      </div>
                    </>)}

                    {sec.id === 'amenidades' && (<>
                      <div className="flex flex-wrap gap-2">
                        {AMENIDADES.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => toggleAmenidad(a)}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                              amenidadesSeleccionadas.includes(a)
                                ? 'bg-[#1B4332] text-white'
                                : 'bg-[#F4F1EC] text-[#6B6560] hover:bg-[#E8E4DF]'
                            }`}
                          >
                            {amenidadesSeleccionadas.includes(a) && <Check className="mr-1 inline h-3 w-3" />}
                            {a}
                          </button>
                        ))}
                      </div>
                    </>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )
        })}

        {/* ====== EXISTING IMAGES ====== */}
        {imagenesExistentes.length > 0 && (() => {
          const groupedExistentes = (() => {
            const map = new Map<string, { parsed: ReturnType<typeof parseCategoria>; indices: number[] }>()
            imagenesExistentes.forEach((_, i) => {
              const cat = existentesCategorias[i] || 'otro'
              if (!map.has(cat)) map.set(cat, { parsed: parseCategoria(cat), indices: [] })
              map.get(cat)!.indices.push(i)
            })
            const entries = Array.from(map.entries())
            entries.sort((a, b) => {
              const aIsOther = a[0] === 'otro'
              const bIsOther = b[0] === 'otro'
              if (aIsOther && !bIsOther) return 1
              if (!aIsOther && bIsOther) return -1
              const aIsCustom = a[0].startsWith('personalizada:')
              const bIsCustom = b[0].startsWith('personalizada:')
              if (aIsCustom && !bIsCustom) return 1
              if (!aIsCustom && bIsCustom) return -1
              return 0
            })
            return entries
          })()

          const setExistenteCategoria = (index: number, categoria: string) => {
            setExistentesCategorias((prev) => {
              const next = [...prev]
              next[index] = categoria
              return next
            })
            setExistentesCustomInputVisible(null)
            setExistentesCustomInputValue('')
          }

          const confirmExistenteCustomCategoria = (index: number) => {
            const trimmed = existentesCustomInputValue.trim()
            if (!trimmed) return
            setExistenteCategoria(index, `personalizada:${trimmed}`)
          }

          return (
            <div className="border-t border-[#E8E4DF] px-5 py-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
                  <Image src={imagenesExistentes[0].url} alt="" width={14} height={14} className="h-3.5 w-3.5 rounded object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">Fotos actuales</h3>
                  <p className="text-[10px] text-[#9E9892]">{imagenesExistentes.length} foto{imagenesExistentes.length !== 1 ? 's' : ''} — clasifica cada una en su sección</p>
                </div>
              </div>
              <div className="space-y-2">
                {groupedExistentes.map(([catKey, group]) => {
                  const { parsed, indices } = group
                  const GroupIcon = parsed.icon
                  const isCollapsed = existentesCollapsedGroups.has(catKey)
                  const isUnassigned = catKey === 'otro'
                  return (
                    <div key={catKey} className="overflow-hidden rounded-xl border border-[#E8E4DF]">
                      <button
                        type="button"
                        onClick={() => setExistentesCollapsedGroups((prev) => {
                          const next = new Set(prev)
                          if (next.has(catKey)) next.delete(catKey)
                          else next.add(catKey)
                          return next
                        })}
                        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#FDFCFA] ${isUnassigned ? 'bg-[#FDFCFA]' : 'bg-white'}`}
                      >
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${parsed.color}`}>
                          <GroupIcon className="h-3 w-3" />
                          {isUnassigned ? 'Sin clasificar' : parsed.label}
                        </span>
                        <span className="text-[10px] text-[#9E9892]">{indices.length} {indices.length === 1 ? 'foto' : 'fotos'}</span>
                        <ChevronDown className={`ml-auto h-4 w-4 text-[#9E9892] transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                      </button>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[#F4F1EC] p-3 space-y-2.5">
                              {indices.map((imgIdx) => {
                                const img = imagenesExistentes[imgIdx]
                                const isCustomizing = existentesCustomInputVisible === imgIdx
                                return (
                                  <div key={img.id} className="group rounded-lg bg-[#FDFCFA] p-2 transition-all hover:bg-white">
                                    <div className="flex gap-3">
                                      <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg">
                                        <Image src={img.url} alt="" width={72} height={72} className="h-[72px] w-[72px] object-cover" />
                                        {img.es_principal && (
                                          <span className="absolute bottom-0.5 left-0.5 rounded bg-[#1B4332] px-1.5 py-px text-[9px] font-bold text-white">Principal</span>
                                        )}
                                      </div>
                                      <div className="flex flex-1 flex-col justify-center gap-1.5">
                                        <div className="flex flex-wrap gap-1">
                                          {CATEGORIAS_IMAGEN.map((c) => {
                                            const isActive = (existentesCategorias[imgIdx] || 'otro') === c.value
                                            return (
                                              <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setExistenteCategoria(imgIdx, c.value)}
                                                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium transition-all ${isActive ? `${c.color} ring-1 ring-inset` : 'bg-white text-[#9E9892] hover:bg-[#F4F1EC]'}`}
                                              >
                                                <c.icon className="h-2.5 w-2.5" />
                                                {c.label}
                                              </button>
                                            )
                                          })}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isCustomizing) {
                                                setExistentesCustomInputVisible(null)
                                              } else {
                                                setExistentesCustomInputVisible(imgIdx)
                                                setExistentesCustomInputValue('')
                                              }
                                            }}
                                            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium transition-all ${
                                              (existentesCategorias[imgIdx] || 'otro').startsWith('personalizada:')
                                                ? `${CUSTOM_COLOR} ring-1 ring-inset`
                                                : isCustomizing
                                                  ? 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200'
                                                  : 'bg-white text-[#9E9892] hover:bg-[#F4F1EC]'
                                            }`}
                                          >
                                            <HelpCircle className="h-2.5 w-2.5" />
                                            Personalizar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <AnimatePresence>
                                      {isCustomizing && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="flex items-center gap-2 pt-2">
                                            <input
                                              type="text"
                                              value={existentesCustomInputValue}
                                              onChange={(e) => setExistentesCustomInputValue(e.target.value)}
                                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmExistenteCustomCategoria(imgIdx) } }}
                                              placeholder="Ej: Terraza, Garage, Lobby..."
                                              maxLength={30}
                                              className="h-7 flex-1 rounded-md border border-[#E8E4DF] bg-white px-2 text-[11px] text-[#1A1A1A] placeholder:text-[#C4BFBA] focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]/20"
                                              autoFocus
                                            />
                                            <button
                                              type="button"
                                              onClick={() => confirmExistenteCustomCategoria(imgIdx)}
                                              disabled={!existentesCustomInputValue.trim()}
                                              className="flex h-7 items-center gap-1 rounded-md bg-[#1B4332] px-2.5 text-[10px] font-medium text-white transition-colors hover:bg-[#2D6A4F] disabled:opacity-40"
                                            >
                                              <Check className="h-3 w-3" />
                                              Aplicar
                                            </button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ====== NEW IMAGES ====== */}
        <div className="border-t border-[#E8E4DF] px-5 py-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D8F3DC]">
              <Upload className="h-3.5 w-3.5 text-[#1B4332]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Agregar fotos</h3>
              <p className="text-[10px] text-[#9E9892]">Sube fotos nuevas y clasifica cada una en su sección</p>
            </div>
            {previews.length > 0 && (
              <span className="ml-auto rounded-full bg-[#1B4332] px-2 py-0.5 text-[10px] font-bold text-white">
                {previews.length}/{MAX_IMAGENES_PROPIEDAD}
              </span>
            )}
          </div>
          <div
            onClick={() => !optimizando && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); !optimizando && handleImagenes(e.dataTransfer.files) }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
              optimizando
                ? 'border-[#1B4332] cursor-wait opacity-60 bg-[#D8F3DC]/30'
                : 'border-[#E8E4DF] bg-[#FDFCFA] hover:border-[#1B4332] hover:bg-[#F8F6F3]'
            }`}
          >
            {optimizando ? (
              <>
                <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#1B4332]" />
                <p className="text-sm font-medium text-[#6B6560]">Optimizando imágenes...</p>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-[#9E9892]" />
                <p className="text-sm font-medium text-[#6B6560]">Arrastra imágenes aquí o haz clic para seleccionar</p>
                <p className="mt-1 text-[10px] text-[#9E9892]">Se optimizarán automáticamente (máx. {MAX_IMAGENES_PROPIEDAD})</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImagenes(e.target.files)} />
          {groupedImages.length > 0 && (
            <div className="mt-4 space-y-2">
              {groupedImages.map(([catKey, group]) => {
                const { parsed, indices } = group
                const GroupIcon = parsed.icon
                const isCollapsed = collapsedGroups.has(catKey)
                const isUnassigned = catKey === 'otro'
                return (
                  <div key={catKey} className="overflow-hidden rounded-xl border border-[#E8E4DF]">
                    <button
                      type="button"
                      onClick={() => toggleGroup(catKey)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#FDFCFA] ${
                        isUnassigned ? 'bg-[#FDFCFA]' : 'bg-white'
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${parsed.color}`}>
                        <GroupIcon className="h-3 w-3" />
                        {isUnassigned ? 'Sin clasificar' : parsed.label}
                      </span>
                      <span className="text-[10px] text-[#9E9892]">{indices.length} {indices.length === 1 ? 'foto' : 'fotos'}</span>
                      <ChevronDown className={`ml-auto h-4 w-4 text-[#9E9892] transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#F4F1EC] p-3 space-y-2.5">
                            {indices.map((imgIdx) => {
                              const isCustomizing = customInputVisible === imgIdx
                              return (
                                <div key={previews[imgIdx]} className="group rounded-lg bg-[#FDFCFA] p-2 transition-all hover:bg-white">
                                  <div className="flex gap-3">
                                    <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-lg">
                                      <Image src={previews[imgIdx]} alt="" width={72} height={72} className="h-[72px] w-[72px] object-cover" />
                                      {imgIdx === 0 && imagenesExistentes.length === 0 && (
                                        <span className="absolute bottom-0.5 left-0.5 rounded bg-[#1B4332] px-1.5 py-px text-[9px] font-bold text-white">Principal</span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeImagen(imgIdx)}
                                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <div className="flex flex-1 flex-col justify-center gap-1.5">
                                      <div className="flex flex-wrap gap-1">
                                        {CATEGORIAS_IMAGEN.map((c) => {
                                          const isActive = (imagenCategorias[imgIdx] || 'otro') === c.value
                                          return (
                                            <button
                                              key={c.value}
                                              type="button"
                                              onClick={() => setCategoriaImagen(imgIdx, c.value)}
                                              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium transition-all ${
                                                isActive
                                                  ? `${c.color} ring-1 ring-inset`
                                                  : 'bg-white text-[#9E9892] hover:bg-[#F4F1EC]'
                                              }`}
                                            >
                                              <c.icon className="h-2.5 w-2.5" />
                                              {c.label}
                                            </button>
                                          )
                                        })}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isCustomizing) {
                                              setCustomInputVisible(null)
                                            } else {
                                              setCustomInputVisible(imgIdx)
                                              setCustomInputValue('')
                                            }
                                          }}
                                          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium transition-all ${
                                            (imagenCategorias[imgIdx] || 'otro').startsWith('personalizada:')
                                              ? `${CUSTOM_COLOR} ring-1 ring-inset`
                                              : isCustomizing
                                                ? 'bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-200'
                                                : 'bg-white text-[#9E9892] hover:bg-[#F4F1EC]'
                                          }`}
                                        >
                                          <HelpCircle className="h-2.5 w-2.5" />
                                          Personalizar
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <AnimatePresence>
                                    {isCustomizing && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="flex items-center gap-2 pt-2">
                                          <input
                                            type="text"
                                            value={customInputValue}
                                            onChange={(e) => setCustomInputValue(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmCustomCategoria(imgIdx) } }}
                                            placeholder="Ej: Terraza, Garage, Lobby..."
                                            maxLength={30}
                                            className="h-7 flex-1 rounded-md border border-[#E8E4DF] bg-white px-2 text-[11px] text-[#1A1A1A] placeholder:text-[#C4BFBA] focus:border-[#1B4332] focus:outline-none focus:ring-1 focus:ring-[#1B4332]/20"
                                            autoFocus
                                          />
                                          <button
                                            type="button"
                                            onClick={() => confirmCustomCategoria(imgIdx)}
                                            disabled={!customInputValue.trim()}
                                            className="flex h-7 items-center gap-1 rounded-md bg-[#1B4332] px-2.5 text-[10px] font-medium text-white transition-colors hover:bg-[#2D6A4F] disabled:opacity-40"
                                          >
                                            <Check className="h-3 w-3" />
                                            Aplicar
                                          </button>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ====== SUBMIT ====== */}
      <motion.div variants={fadeUp} className="mt-6">
        <Button
          type="button"
          onClick={handleGuardar}
          disabled={enviando}
          className="h-12 w-full bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
        >
          {enviando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando cambios...</>
          ) : (
            <><Check className="mr-2 h-4 w-4" />Guardar cambios</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
