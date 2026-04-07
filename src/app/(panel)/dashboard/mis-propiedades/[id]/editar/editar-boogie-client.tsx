'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Home, MapPin, Sparkles, Check, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { propiedadSchema } from '@/lib/validations'
import { ESTADOS_VENEZUELA, TIPOS_PROPIEDAD, POLITICAS_CANCELACION, MAX_IMAGENES_PROPIEDAD } from '@/lib/constants'
import { actualizarPropiedad } from '@/actions/propiedad.actions'
import { optimizeImage } from '@/lib/image-optimize'

const PASOS = [
  { numero: 1, titulo: 'Información básica', icono: Home },
  { numero: 2, titulo: 'Ubicación', icono: MapPin },
  { numero: 3, titulo: 'Detalles finales', icono: Sparkles },
]

const AMENIDADES = [
  'Wi-Fi', 'Aire acondicionado', 'Piscina', 'Estacionamiento',
  'Cocina equipada', 'Lavadora', 'TV / Smart TV', 'Agua caliente',
  'Seguridad 24h', 'Jardín', 'Parrilla', 'Balcón',
  'Vista al mar', 'Acceso a playa', 'Pet friendly', 'Gimnasio',
]

export default function EditarBoogieClient({ boogie }: { boogie: Record<string, unknown> }) {
  const router = useRouter()
  const boogieId = boogie.id as string
  const [pasoActual, setPasoActual] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [amenidadesSeleccionadas, setAmenidadesSeleccionadas] = useState<string[]>(
    (boogie.amenidades as string[]) || []
  )
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [optimizando, setOptimizando] = useState(false)
  const imagenesExistentes = (boogie.imagenes as { id: string; url: string; orden: number; es_principal: boolean }[]) || []
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    setValue,
    trigger,
    getValues,
    formState: { errors },
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
      amenidades: (boogie.amenidades as string[]) || [],
      reglas: (boogie.reglas as string) || '',
      politicaCancelacion: ((boogie.politica_cancelacion as string) || 'MODERADA') as 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA',
      horarioCheckIn: (boogie.horario_checkin as string) || '14:00',
      horarioCheckOut: (boogie.horario_checkout as string) || '11:00',
      estanciaMinima: (boogie.estancia_minima as number) || 1,
    },
  })

  const camposPorPaso: Record<number, string[]> = {
    1: ['titulo', 'descripcion', 'tipoPropiedad', 'precioPorNoche', 'capacidadMaxima', 'habitaciones', 'banos', 'camas'],
    2: ['direccion', 'ciudad', 'estado'],
    3: [],
  }

  const avanzarPaso = async () => {
    const campos = camposPorPaso[pasoActual]
    if (campos.length > 0) {
      const esValido = await trigger(campos as any)
      if (!esValido) return
    }
    setPasoActual((prev) => Math.min(prev + 1, PASOS.length))
  }

  const retrocederPaso = () => {
    setPasoActual((prev) => Math.max(prev - 1, 1))
  }

  const toggleAmenidad = (amenidad: string) => {
    setAmenidadesSeleccionadas((prev) =>
      prev.includes(amenidad)
        ? prev.filter((a) => a !== amenidad)
        : [...prev, amenidad]
    )
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
    setOptimizando(false)
  }, [imagenes.length, imagenesExistentes.length])

  const removeNuevaImagen = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setImagenes((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    const esValido = await trigger()
    if (!esValido) {
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-[#6B6560]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Editar boogie</h1>
          <p className="text-sm text-[#6B6560]">Modifica los detalles de tu alojamiento</p>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        {PASOS.map((paso, index) => {
          const Icono = paso.icono
          const activo = paso.numero === pasoActual
          const completado = paso.numero < pasoActual
          return (
            <div key={paso.numero} className="flex items-center">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activo ? 'bg-[#1B4332] text-white' :
                completado ? 'bg-[#D8F3DC] text-[#1B4332]' :
                'bg-[#F8F6F3] text-[#9E9892]'
              }`}>
                <Icono className="h-4 w-4" />
                <span className="hidden sm:inline">{paso.titulo}</span>
                <span className="sm:hidden">{paso.numero}</span>
              </div>
              {index < PASOS.length - 1 && (
                <div className={`mx-2 h-px w-8 ${completado ? 'bg-[#52B788]' : 'bg-[#E8E4DF]'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div>
        {pasoActual === 1 && (
          <motion.div key="paso1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Home className="h-5 w-5 text-[#52B788]" />
                  Información básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="titulo">
                    <span className="flex items-center gap-1.5">Título <span className="text-[#C1121F]">*</span></span>
                  </Label>
                  <Input id="titulo" placeholder="Ej: Apartamento moderno en Chacao" {...register('titulo')} />
                  {errors.titulo && <p className="text-xs text-[#C1121F]">{errors.titulo.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">
                    <span className="flex items-center gap-1.5">Descripción <span className="text-[#C1121F]">*</span></span>
                  </Label>
                  <Textarea id="descripcion" placeholder="Describe tu boogie..." className="min-h-[100px]" {...register('descripcion')} />
                  {errors.descripcion && <p className="text-xs text-[#C1121F]">{errors.descripcion.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipoPropiedad">Tipo de boogie</Label>
                    <Select onValueChange={(value) => setValue('tipoPropiedad', value as any)} defaultValue={boogie.tipo_propiedad as string}>
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E4DF] bg-white text-sm">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPOS_PROPIEDAD).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precioPorNoche">
                      <span className="flex items-center gap-1.5">Precio por noche <span className="text-[#C1121F]">*</span></span>
                    </Label>
                    <Input id="precioPorNoche" type="number" placeholder="0.00" {...register('precioPorNoche', { valueAsNumber: true })} />
                    {errors.precioPorNoche && <p className="text-xs text-[#C1121F]">{errors.precioPorNoche.message as string}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacidadMaxima">Huéspedes</Label>
                    <Input id="capacidadMaxima" type="number" min={1} {...register('capacidadMaxima', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habitaciones">Habitaciones</Label>
                    <Input id="habitaciones" type="number" min={0} {...register('habitaciones', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banos">Baños</Label>
                    <Input id="banos" type="number" min={0} {...register('banos', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="camas">Camas</Label>
                    <Input id="camas" type="number" min={0} {...register('camas', { valueAsNumber: true })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pasoActual === 2 && (
          <motion.div key="paso2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-[#52B788]" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="direccion">
                    <span className="flex items-center gap-1.5">Dirección <span className="text-[#C1121F]">*</span></span>
                  </Label>
                  <Input id="direccion" placeholder="Calle, edificio, número" {...register('direccion')} />
                  {errors.direccion && <p className="text-xs text-[#C1121F]">{errors.direccion.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">
                      <span className="flex items-center gap-1.5">Ciudad <span className="text-[#C1121F]">*</span></span>
                    </Label>
                    <Input id="ciudad" placeholder="Ciudad" {...register('ciudad')} />
                    {errors.ciudad && <p className="text-xs text-[#C1121F]">{errors.ciudad.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">
                      <span className="flex items-center gap-1.5">Estado <span className="text-[#C1121F]">*</span></span>
                    </Label>
                    <Select onValueChange={(value) => setValue('estado', value as string)} defaultValue={boogie.estado as string}>
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E4DF] bg-white text-sm">
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_VENEZUELA.map((estado) => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.estado && <p className="text-xs text-[#C1121F]">{errors.estado.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zona">Zona (opcional)</Label>
                  <Input id="zona" placeholder="Barrio, urbanización" {...register('zona')} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pasoActual === 3 && (
          <motion.div key="paso3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-[#52B788]" />
                  Detalles finales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-medium text-[#1A1A1A]">Amenidades</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENIDADES.map((amenidad) => (
                      <button
                        key={amenidad}
                        type="button"
                        onClick={() => toggleAmenidad(amenidad)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          amenidadesSeleccionadas.includes(amenidad)
                            ? 'border-[#1B4332] bg-[#D8F3DC] text-[#1B4332]'
                            : 'border-[#E8E4DF] text-[#6B6560] hover:border-[#52B788] hover:bg-[#F8F6F3]'
                        }`}
                      >
                        {amenidadesSeleccionadas.includes(amenidad) && <Check className="mr-1 inline h-3 w-3" />}
                        {amenidad}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#E8E4DF] pt-5">
                  <p className="mb-3 text-sm font-medium text-[#1A1A1A]">Imágenes</p>
                  {imagenesExistentes.length > 0 && (
                    <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {imagenesExistentes.map((img) => (
                        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-[#E8E4DF]">
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                          {img.es_principal && (
                            <span className="absolute bottom-1 left-1 rounded bg-[#1B4332] px-1.5 py-0.5 text-[10px] font-medium text-white">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    onClick={() => !optimizando && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); !optimizando && handleImagenes(e.dataTransfer.files) }}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#FDFCFA] p-8 transition-colors ${
                      optimizando 
                        ? 'border-[#52B788] cursor-wait opacity-60' 
                        : 'border-[#E8E4DF] hover:border-[#52B788] hover:bg-[#F8F6F3]'
                    }`}
                  >
                    {optimizando ? (
                      <>
                        <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#52B788]" />
                        <p className="text-sm font-medium text-[#6B6560]">Optimizando imágenes...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="mb-2 h-8 w-8 text-[#9E9892]" />
                        <p className="text-sm font-medium text-[#6B6560]">Arrastra imágenes aquí o haz clic para seleccionar</p>
                        <p className="mt-1 text-xs text-[#9E9892]">Se optimizarán automáticamente (máx. {MAX_IMAGENES_PROPIEDAD} imágenes)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImagenes(e.target.files)}
                  />
                  {previews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {previews.map((src, i) => (
                        <div key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-[#E8E4DF]">
                          <img src={src} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNuevaImagen(i)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E8E4DF] pt-5">
                  <p className="mb-3 text-sm font-medium text-[#1A1A1A]">Reglas y políticas</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reglas">Reglas del boogie</Label>
                      <Textarea id="reglas" placeholder="Ej: No fumar, no mascotas, no fiestas..." {...register('reglas')} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="politicaCancelacion">Política de cancelación</Label>
                        <Select onValueChange={(value) => setValue('politicaCancelacion', value as 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA')} defaultValue={(boogie.politica_cancelacion as string) || 'MODERADA'}>
                          <SelectTrigger className="h-10 w-full rounded-lg border-[#E8E4DF] bg-white text-sm">
                            <SelectValue placeholder="Selecciona una política" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(POLITICAS_CANCELACION).map(([key, data]) => (
                              <SelectItem key={key} value={key}>{data.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estanciaMinima">Estancia mínima (noches)</Label>
                        <Input id="estanciaMinima" type="number" min={1} {...register('estanciaMinima', { valueAsNumber: true })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="horarioCheckIn">Horario Check-in</Label>
                        <Input id="horarioCheckIn" type="time" {...register('horarioCheckIn')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="horarioCheckOut">Horario Check-out</Label>
                        <Input id="horarioCheckOut" type="time" {...register('horarioCheckOut')} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={retrocederPaso}
            disabled={pasoActual === 1}
            className="border-[#E8E4DF] text-[#6B6560]"
          >
            Anterior
          </Button>

          {pasoActual < PASOS.length ? (
            <Button type="button" onClick={avanzarPaso} className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
              Siguiente
            </Button>
          ) : (
            <Button type="button" onClick={handleGuardar} disabled={enviando} className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]">
              {enviando ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
