'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home, MapPin, Sparkles, Check, Upload, X, Loader2, DollarSign, Clock, Pencil } from 'lucide-react'
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
import { ESTADOS_VENEZUELA, TIPOS_PROPIEDAD, POLITICAS_CANCELACION, MAX_IMAGENES_PROPIEDAD } from '@/lib/constants'
import { crearPropiedad } from '@/actions/propiedad.actions'
import { optimizeImage } from '@/lib/image-optimize'
import { LocationPickerMap, type AddressData } from '@/components/propiedades/location-picker'

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

const STEP_KEY = 'boogie-nueva-paso'
const FORM_KEY = 'boogie-nueva-form'
const AMEN_KEY = 'boogie-nueva-amenidades'

function clearFormStorage() {
  sessionStorage.removeItem(STEP_KEY)
  sessionStorage.removeItem(FORM_KEY)
  sessionStorage.removeItem(AMEN_KEY)
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function NuevaPropiedadPage() {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [amenidadesSeleccionadas, setAmenidadesSeleccionadas] = useState<string[]>([])
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [optimizando, setOptimizando] = useState(false)
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [addressData, setAddressData] = useState<AddressData | null>(null)
  const [seccionExpandida, setSeccionExpandida] = useState<SeccionId>('info')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)
  const [initialized, setInitialized] = useState(false)

  const {
    register,
    setValue,
    trigger,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propiedadSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      tipoPropiedad: 'APARTAMENTO' as const,
      precioPorNoche: 0,
      moneda: 'USD' as const,
      capacidadMaxima: 1,
      habitaciones: 1,
      banos: 1,
      camas: 1,
      direccion: '',
      ciudad: '',
      estado: '',
      zona: '',
      latitud: undefined as unknown as number,
      longitud: undefined as unknown as number,
      amenidades: [] as string[],
      reglas: '',
      politicaCancelacion: 'MODERADA' as const,
      horarioCheckIn: '14:00',
      horarioCheckOut: '11:00',
      estanciaMinima: 1,
    },
  })

  useEffect(() => {
    const sub = watch((values) => {
      if (initializedRef.current) {
        sessionStorage.setItem(FORM_KEY, JSON.stringify(values))
      }
    })

    try {
      const savedForm = sessionStorage.getItem(FORM_KEY)
      if (savedForm) reset(JSON.parse(savedForm))

      const savedAmenidades = sessionStorage.getItem(AMEN_KEY)
      if (savedAmenidades) {
        const parsed = JSON.parse(savedAmenidades)
        setAmenidadesSeleccionadas(parsed)
        setValue('amenidades', parsed)
      }
    } catch {}

    initializedRef.current = true
    setInitialized(true)
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    if (!initialized) return
    sessionStorage.setItem(AMEN_KEY, JSON.stringify(amenidadesSeleccionadas))
    setValue('amenidades', amenidadesSeleccionadas)
  }, [amenidadesSeleccionadas, setValue, initialized])

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
    if (imagenes.length >= MAX_IMAGENES_PROPIEDAD) {
      toast.error(`Máximo ${MAX_IMAGENES_PROPIEDAD} imágenes`)
      return
    }
    setOptimizando(true)
    const nuevas: File[] = []
    const nuevasPreview: string[] = []
    const filesArray = Array.from(files).slice(0, MAX_IMAGENES_PROPIEDAD - imagenes.length)
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
    setOptimizando(false)
  }, [imagenes.length])

  const removeImagen = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImagenes((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCrearBoogie = async () => {
    const esValido = await trigger()
    if (!esValido) {
      const firstError = Object.keys(errors)[0]
      if (firstError) {
        const seccionMap: Record<string, SeccionId> = {
          titulo: 'info', descripcion: 'info', tipoPropiedad: 'info',
          precioPorNoche: 'precios', moneda: 'precios',
          capacidadMaxima: 'precios', habitaciones: 'precios', banos: 'precios', camas: 'precios',
          direccion: 'ubicacion', ciudad: 'ubicacion', estado: 'ubicacion', zona: 'ubicacion',
          reglas: 'politicas', politicaCancelacion: 'politicas',
          horarioCheckIn: 'politicas', horarioCheckOut: 'politicas', estanciaMinima: 'politicas',
        }
        setSeccionExpandida(seccionMap[firstError] || 'info')
      }
      toast.error('Por favor completa todos los campos requeridos')
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

      const result = await crearPropiedad(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }

      clearFormStorage()
      toast.success('Boogie creado correctamente')
      router.push('/dashboard/mis-propiedades')
    } catch (error: any) {
      toast.error('Error al crear el boogie')
      console.error('Error al crear boogie:', error)
    } finally {
      setEnviando(false)
    }
  }

  const ic = "h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"

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
            <h1 className="text-2xl font-bold tracking-tight text-white">Nuevo boogie</h1>
            <p className="text-sm text-white/60">Completa la información para publicar tu alojamiento</p>
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

        {SECCIONES.map((sec) => (
          <div key={sec.id} className="border-b border-[#E8E4DF] last:border-b-0">
            <button
              type="button"
              onClick={() => setSeccionExpandida(seccionExpandida === sec.id ? '' as SeccionId : sec.id)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-[#FDFCFA] transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8F3DC]">
                <sec.icon className="h-4 w-4 text-[#1B4332]" />
              </div>
              <span className="flex-1 text-sm font-semibold text-[#1A1A1A]">{sec.label}</span>
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
                        <Input placeholder="Ej: Apartamento moderno en Chacao" {...register('titulo')} className={ic} />
                        {errors.titulo && <p className="text-xs text-[#C1121F]">{errors.titulo.message as string}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Descripción</label>
                        <Textarea placeholder="Describe tu boogie..." rows={4} {...register('descripcion')} className="border-[#E8E4DF] bg-[#FDFCFA] text-sm" />
                        {errors.descripcion && <p className="text-xs text-[#C1121F]">{errors.descripcion.message as string}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                           <Label className="text-xs font-semibold text-[#6B6560]">Tipo de boogie</Label>
                           <Select onValueChange={(v) => setValue('tipoPropiedad', v as any)} defaultValue="APARTAMENTO">
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
                          <Input type="number" min={1} {...register('capacidadMaxima', { valueAsNumber: true })} className={ic} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Habitaciones</label>
                          <Input type="number" min={0} {...register('habitaciones', { valueAsNumber: true })} className={ic} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Baños</label>
                          <Input type="number" min={1} {...register('banos', { valueAsNumber: true })} className={ic} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Camas</label>
                          <Input type="number" min={1} {...register('camas', { valueAsNumber: true })} className={ic} />
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
                          <p className="text-sm text-[#1A1A1A]">{addressData?.direccion || watch('direccion') || '—'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Ciudad</span>
                            <p className="text-sm text-[#1A1A1A]">{addressData?.ciudad || watch('ciudad') || '—'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Estado</span>
                            <p className="text-sm text-[#1A1A1A]">{addressData?.estado || watch('estado') || '—'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9E9892]">Zona</span>
                          <p className="text-sm text-[#1A1A1A]">{addressData?.zona || watch('zona') || '—'}</p>
                        </div>
                      </div>
                      <input type="hidden" {...register('direccion')} />
                      <input type="hidden" {...register('ciudad')} />
                      <input type="hidden" {...register('estado')} />
                      <input type="hidden" {...register('zona')} />
                      {(errors.direccion || errors.ciudad || errors.estado) && (
                        <p className="text-xs text-[#C1121F]">Selecciona una ubicación en el mapa</p>
                      )}
                    </>)}

                    {sec.id === 'precios' && (<>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Precio por noche</label>
                          <Input type="number" step="0.01" min={1} placeholder="0.00" {...register('precioPorNoche', { valueAsNumber: true })} className={ic} />
                          {errors.precioPorNoche && <p className="text-xs text-[#C1121F]">{errors.precioPorNoche.message as string}</p>}
                        </div>
                         <div className="space-y-1.5">
                           <Label className="text-xs font-semibold text-[#6B6560]">Moneda</Label>
                           <Select onValueChange={(v) => setValue('moneda', v as 'USD' | 'VES')} defaultValue="USD">
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
                         <Select onValueChange={(v) => setValue('politicaCancelacion', v as any)} defaultValue="MODERADA">
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
                          <Input type="time" {...register('horarioCheckIn')} className={ic} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#6B6560]">Check-out</label>
                          <Input type="time" {...register('horarioCheckOut')} className={ic} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#6B6560]">Estancia mínima (noches)</label>
                        <Input type="number" min={1} {...register('estanciaMinima', { valueAsNumber: true })} className={ic} />
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
        ))}

        {/* ====== IMÁGENES ====== */}
        <div className="border-t border-[#E8E4DF] px-5 py-5">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Imágenes</h3>
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
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {previews.map((src, i) => (
                <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-[#E8E4DF]">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-[#1B4332] px-1.5 py-0.5 text-[10px] font-medium text-white">Principal</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImagen(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ====== SUBMIT ====== */}
      <motion.div variants={fadeUp} className="mt-6">
        <Button
          type="button"
          onClick={handleCrearBoogie}
          disabled={enviando}
          className="h-12 w-full bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
        >
          {enviando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando boogie...</>
          ) : (
            <><Check className="mr-2 h-4 w-4" />Crear boogie</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
