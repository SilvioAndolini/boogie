'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Home, MapPin, Sparkles, ImagePlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { propiedadSchema } from '@/lib/validations'
import { ESTADOS_VENEZUELA, TIPOS_PROPIEDAD, POLITICAS_CANCELACION } from '@/lib/constants'

// Pasos del formulario
const PASOS = [
  { numero: 1, titulo: 'Información básica', icono: Home },
  { numero: 2, titulo: 'Ubicación', icono: MapPin },
  { numero: 3, titulo: 'Amenidades', icono: Sparkles },
  { numero: 4, titulo: 'Detalles finales', icono: ImagePlus },
]

// Amenidades disponibles
const AMENIDADES = [
  'Wi-Fi', 'Aire acondicionado', 'Piscina', 'Estacionamiento',
  'Cocina equipada', 'Lavadora', 'TV / Smart TV', 'Agua caliente',
  'Seguridad 24h', 'Jardín', 'Parrilla', 'Balcón',
  'Vista al mar', 'Acceso a playa', 'Pet friendly', 'Gimnasio',
]

export default function NuevaPropiedadPage() {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [amenidadesSeleccionadas, setAmenidadesSeleccionadas] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
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

  const onSubmit = async (data: any) => {
    setEnviando(true)
    try {
      console.log('Datos del formulario:', { ...data, amenidades: amenidadesSeleccionadas })
      // TODO: Llamar server action para crear propiedad
      router.push('/dashboard/mis-propiedades')
    } catch (error) {
      console.error('Error al crear propiedad:', error)
    } finally {
      setEnviando(false)
    }
  }

  const toggleAmenidad = (amenidad: string) => {
    setAmenidadesSeleccionadas((prev) =>
      prev.includes(amenidad)
        ? prev.filter((a) => a !== amenidad)
        : [...prev, amenidad]
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
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

      {/* Indicador de pasos */}
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

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Paso 1: Información básica */}
        {pasoActual === 1 && (
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-lg text-[#1A1A1A]">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo" className="text-sm font-medium text-[#1A1A1A]">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Apartamento moderno en Chacao"
                  className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]"
                  {...register('titulo')}
                />
                {errors.titulo && <p className="mt-1 text-xs text-[#C1121F]">{errors.titulo.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="descripcion" className="text-sm font-medium text-[#1A1A1A]">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe tu propiedad..."
                  className="mt-1 min-h-[100px] border-[#E8E4DF] bg-[#FEFCF9]"
                  {...register('descripcion')}
                />
                {errors.descripcion && <p className="mt-1 text-xs text-[#C1121F]">{errors.descripcion.message as string}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoPropiedad" className="text-sm font-medium text-[#1A1A1A]">Tipo</Label>
                  <select
                    id="tipoPropiedad"
                    className="mt-1 w-full rounded-lg border border-[#E8E4DF] bg-[#FEFCF9] p-2 text-sm"
                    {...register('tipoPropiedad')}
                  >
                    {Object.entries(TIPOS_PROPIEDAD).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="precioPorNoche" className="text-sm font-medium text-[#1A1A1A]">Precio por noche</Label>
                  <Input
                    id="precioPorNoche"
                    type="number"
                    placeholder="0.00"
                    className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]"
                    {...register('precioPorNoche', { valueAsNumber: true })}
                  />
                  {errors.precioPorNoche && <p className="mt-1 text-xs text-[#C1121F]">{errors.precioPorNoche.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="capacidadMaxima" className="text-sm font-medium text-[#1A1A1A]">Huéspedes</Label>
                  <Input id="capacidadMaxima" type="number" min={1} className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('capacidadMaxima', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="habitaciones" className="text-sm font-medium text-[#1A1A1A]">Habitaciones</Label>
                  <Input id="habitaciones" type="number" min={0} className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('habitaciones', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="banos" className="text-sm font-medium text-[#1A1A1A]">Baños</Label>
                  <Input id="banos" type="number" min={0} className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('banos', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="camas" className="text-sm font-medium text-[#1A1A1A]">Camas</Label>
                  <Input id="camas" type="number" min={0} className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('camas', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 2: Ubicación */}
        {pasoActual === 2 && (
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-lg text-[#1A1A1A]">Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="direccion" className="text-sm font-medium text-[#1A1A1A]">Dirección</Label>
                <Input id="direccion" placeholder="Calle, edificio, número" className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('direccion')} />
                {errors.direccion && <p className="mt-1 text-xs text-[#C1121F]">{errors.direccion.message as string}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ciudad" className="text-sm font-medium text-[#1A1A1A]">Ciudad</Label>
                  <Input id="ciudad" placeholder="Ciudad" className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('ciudad')} />
                  {errors.ciudad && <p className="mt-1 text-xs text-[#C1121F]">{errors.ciudad.message as string}</p>}
                </div>
                <div>
                  <Label htmlFor="estado" className="text-sm font-medium text-[#1A1A1A]">Estado</Label>
                  <select id="estado" className="mt-1 w-full rounded-lg border border-[#E8E4DF] bg-[#FEFCF9] p-2 text-sm" {...register('estado')}>
                    <option value="">Selecciona un estado</option>
                    {ESTADOS_VENEZUELA.map((estado) => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                  {errors.estado && <p className="mt-1 text-xs text-[#C1121F]">{errors.estado.message as string}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="zona" className="text-sm font-medium text-[#1A1A1A]">Zona (opcional)</Label>
                <Input id="zona" placeholder="Barrio, urbanización" className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('zona')} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Amenidades */}
        {pasoActual === 3 && (
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-lg text-[#1A1A1A]">Amenidades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[#6B6560]">Selecciona las amenidades disponibles en tu propiedad</p>
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
                    {amenidad}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 4: Detalles finales */}
        {pasoActual === 4 && (
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-lg text-[#1A1A1A]">Detalles finales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reglas" className="text-sm font-medium text-[#1A1A1A]">Reglas de la propiedad</Label>
                <Textarea
                  id="reglas"
                  placeholder="Ej: No fumar, no mascotas, no fiestas..."
                  className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]"
                  {...register('reglas')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="politicaCancelacion" className="text-sm font-medium text-[#1A1A1A]">Política de cancelación</Label>
                  <select id="politicaCancelacion" className="mt-1 w-full rounded-lg border border-[#E8E4DF] bg-[#FEFCF9] p-2 text-sm" {...register('politicaCancelacion')}>
                    {Object.entries(POLITICAS_CANCELACION).map(([key, data]: [string, any]) => (
                      <option key={key} value={key}>{data.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="estanciaMinima" className="text-sm font-medium text-[#1A1A1A]">Estancia mínima (noches)</Label>
                  <Input id="estanciaMinima" type="number" min={1} className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('estanciaMinima', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="horarioCheckIn" className="text-sm font-medium text-[#1A1A1A]">Horario Check-in</Label>
                  <Input id="horarioCheckIn" type="time" className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('horarioCheckIn')} />
                </div>
                <div>
                  <Label htmlFor="horarioCheckOut" className="text-sm font-medium text-[#1A1A1A]">Horario Check-out</Label>
                  <Input id="horarioCheckOut" type="time" className="mt-1 border-[#E8E4DF] bg-[#FEFCF9]" {...register('horarioCheckOut')} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de navegación */}
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
