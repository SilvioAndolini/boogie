'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Home, MapPin, Sparkles, ImagePlus, Check } from 'lucide-react'
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
import { ESTADOS_VENEZUELA, TIPOS_PROPIEDAD, POLITICAS_CANCELACION } from '@/lib/constants'
import { crearPropiedad } from '@/actions/propiedad.actions'

const PASOS = [
  { numero: 1, titulo: 'Información básica', icono: Home },
  { numero: 2, titulo: 'Ubicación', icono: MapPin },
  { numero: 3, titulo: 'Amenidades', icono: Sparkles },
  { numero: 4, titulo: 'Detalles finales', icono: ImagePlus },
]

const AMENIDADES = [
  'Wi-Fi', 'Aire acondicionado', 'Piscina', 'Estacionamiento',
  'Cocina equipada', 'Lavadora', 'TV / Smart TV', 'Agua caliente',
  'Seguridad 24h', 'Jardín', 'Parrilla', 'Balcón',
  'Vista al mar', 'Acceso a playa', 'Pet friendly', 'Gimnasio',
]

const STEP_KEY = 'boogie-nueva-paso'
const FORM_KEY = 'boogie-nueva-form'
const AMEN_KEY = 'boogie-nueva-amenidades'

function clearFormStorage() {
  sessionStorage.removeItem(STEP_KEY)
  sessionStorage.removeItem(FORM_KEY)
  sessionStorage.removeItem(AMEN_KEY)
}

export default function NuevaPropiedadPage() {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [amenidadesSeleccionadas, setAmenidadesSeleccionadas] = useState<string[]>([])
  const initializedRef = useRef(false)
  const [initialized, setInitialized] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(propiedadSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      tipoPropiedad: 'APARTAMENTO',
      precioPorNoche: 0,
      moneda: 'USD',
      capacidadMaxima: 1,
      habitaciones: 1,
      banos: 1,
      camas: 1,
      direccion: '',
      ciudad: '',
      estado: '',
      zona: '',
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
      const savedPaso = sessionStorage.getItem(STEP_KEY)
      if (savedPaso) {
        const paso = parseInt(savedPaso, 10)
        if (paso >= 1 && paso <= 4) setPasoActual(paso)
      }

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
    sessionStorage.setItem(STEP_KEY, pasoActual.toString())
  }, [pasoActual, initialized])

  useEffect(() => {
    if (!initialized) return
    sessionStorage.setItem(AMEN_KEY, JSON.stringify(amenidadesSeleccionadas))
    setValue('amenidades', amenidadesSeleccionadas)
  }, [amenidadesSeleccionadas, setValue, initialized])

  const camposPorPaso: Record<number, string[]> = {
    1: ['titulo', 'descripcion', 'tipoPropiedad', 'precioPorNoche', 'capacidadMaxima', 'habitaciones', 'banos', 'camas'],
    2: ['direccion', 'ciudad', 'estado'],
    3: [],
    4: ['politicaCancelacion', 'horarioCheckIn', 'horarioCheckOut'],
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

  const onSubmit = async (data: any) => {
    setEnviando(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'amenidades') return
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      amenidadesSeleccionadas.forEach((a) => formData.append('amenidades', a))

      const result = await crearPropiedad(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      clearFormStorage()
    } catch (error: any) {
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        clearFormStorage()
        throw error
      }
      toast.error('Error al crear la propiedad')
      console.error('Error al crear propiedad:', error)
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
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Nueva propiedad</h1>
          <p className="text-sm text-[#6B6560]">Publica tu alojamiento en Boogie</p>
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

      <form onSubmit={handleSubmit(onSubmit)}>
        {pasoActual === 1 && (
          <motion.div
            key="paso1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                    <span className="flex items-center gap-1.5">
                      Título <span className="text-[#C1121F]">*</span>
                    </span>
                  </Label>
                  <Input
                    id="titulo"
                    placeholder="Ej: Apartamento moderno en Chacao"
                    {...register('titulo')}
                  />
                  {errors.titulo && <p className="text-xs text-[#C1121F]">{errors.titulo.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">
                    <span className="flex items-center gap-1.5">
                      Descripción <span className="text-[#C1121F]">*</span>
                    </span>
                  </Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Describe tu propiedad..."
                    className="min-h-[100px]"
                    {...register('descripcion')}
                  />
                  {errors.descripcion && <p className="text-xs text-[#C1121F]">{errors.descripcion.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipoPropiedad">Tipo de propiedad</Label>
                    <Select onValueChange={(value) => setValue('tipoPropiedad', value as 'APARTAMENTO' | 'CASA' | 'VILLA' | 'CABANA' | 'ESTUDIO' | 'HABITACION' | 'LOFT' | 'PENTHOUSE' | 'FINCA' | 'OTRO')} defaultValue="APARTAMENTO">
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
                      <span className="flex items-center gap-1.5">
                        Precio por noche <span className="text-[#C1121F]">*</span>
                      </span>
                    </Label>
                    <Input
                      id="precioPorNoche"
                      type="number"
                      placeholder="0.00"
                      {...register('precioPorNoche', { valueAsNumber: true })}
                    />
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
          <motion.div
            key="paso2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                    <span className="flex items-center gap-1.5">
                      Dirección <span className="text-[#C1121F]">*</span>
                    </span>
                  </Label>
                  <Input id="direccion" placeholder="Calle, edificio, número" {...register('direccion')} />
                  {errors.direccion && <p className="text-xs text-[#C1121F]">{errors.direccion.message as string}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">
                      <span className="flex items-center gap-1.5">
                        Ciudad <span className="text-[#C1121F]">*</span>
                      </span>
                    </Label>
                    <Input id="ciudad" placeholder="Ciudad" {...register('ciudad')} />
                    {errors.ciudad && <p className="text-xs text-[#C1121F]">{errors.ciudad.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">
                      <span className="flex items-center gap-1.5">
                        Estado <span className="text-[#C1121F]">*</span>
                      </span>
                    </Label>
                    <Select onValueChange={(value) => setValue('estado', value as string)}>
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
          <motion.div
            key="paso3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-[#52B788]" />
                  Amenidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-[#6B6560]">Selecciona las amenidades disponibles en tu propiedad</p>
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pasoActual === 4 && (
          <motion.div
            key="paso4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-[#E8E4DF]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImagePlus className="h-5 w-5 text-[#52B788]" />
                  Detalles finales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reglas">Reglas de la propiedad</Label>
                  <Textarea
                    id="reglas"
                    placeholder="Ej: No fumar, no mascotas, no fiestas..."
                    {...register('reglas')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="politicaCancelacion">Política de cancelación</Label>
                    <Select onValueChange={(value) => setValue('politicaCancelacion', value as 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA')} defaultValue="MODERADA">
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
            <Button
              type="button"
              onClick={avanzarPaso}
              className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={enviando}
              className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
            >
              {enviando ? 'Publicando...' : 'Publicar boogie'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
