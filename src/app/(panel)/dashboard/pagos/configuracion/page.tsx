// Página de Configuración de Métodos de Pago
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  CreditCard,
  Plus,
  Trash2,
  Smartphone,
  Building2,
  DollarSign,
  Wallet,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Tipos de métodos de pago disponibles
interface MetodoPagoConfig {
  tipo: string
  label: string
  icono: React.ElementType
  campos: Array<{ key: string; etiqueta: string; placeholder: string }>
}

const METODOS_DISPONIBLES: MetodoPagoConfig[] = [
  {
    tipo: 'PAGO_MOVIL',
    label: 'Pago Móvil',
    icono: Smartphone,
    campos: [
      { key: 'banco', etiqueta: 'Banco', placeholder: 'Ej: Banesco' },
      { key: 'telefono', etiqueta: 'Teléfono', placeholder: 'Ej: 04121234567' },
      { key: 'cedula', etiqueta: 'Cédula / RIF', placeholder: 'Ej: V-12345678' },
    ],
  },
  {
    tipo: 'TRANSFERENCIA_BANCARIA',
    label: 'Transferencia Bancaria',
    icono: Building2,
    campos: [
      { key: 'banco', etiqueta: 'Banco', placeholder: 'Ej: Banesco' },
      { key: 'cuenta', etiqueta: 'Número de cuenta', placeholder: 'Ej: 0134...' },
      { key: 'tipoCuenta', etiqueta: 'Tipo de cuenta', placeholder: 'Corriente / Ahorro' },
      { key: 'cedula', etiqueta: 'Cédula / RIF', placeholder: 'Ej: V-12345678' },
    ],
  },
  {
    tipo: 'ZELLE',
    label: 'Zelle',
    icono: DollarSign,
    campos: [
      { key: 'email', etiqueta: 'Correo electrónico', placeholder: 'tu@email.com' },
      { key: 'nombreTitular', etiqueta: 'Nombre del titular', placeholder: 'Como aparece en Zelle' },
    ],
  },
  {
    tipo: 'USDT',
    label: 'USDT (Tether)',
    icono: Wallet,
    campos: [
      { key: 'billetera', etiqueta: 'Dirección de billetera', placeholder: '0x...' },
      { key: 'red', etiqueta: 'Red', placeholder: 'Ej: TRC-20, ERC-20' },
    ],
  },
]

// Datos de ejemplo de métodos ya configurados
interface MetodoGuardado {
  id: string
  tipo: string
  resumen: string
}

export default function ConfiguracionPagosPage() {
  const [metodosGuardados, setMetodosGuardados] = useState<MetodoGuardado[]>([])
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Obtener la configuración del método seleccionado
  const configMetodo = METODOS_DISPONIBLES.find((m) => m.tipo === metodoSeleccionado)

  // Manejar envío del formulario
  const onSubmit = (data: Record<string, string>) => {
    if (!configMetodo) return

    const nuevoMetodo: MetodoGuardado = {
      id: Date.now().toString(),
      tipo: configMetodo.tipo,
      resumen: Object.values(data).filter(Boolean).join(' / '),
    }

    setMetodosGuardados((prev) => [...prev, nuevoMetodo])
    reset()
    setMostrarFormulario(false)
    setMetodoSeleccionado('')
  }

  // Eliminar método guardado
  const eliminarMetodo = (id: string) => {
    setMetodosGuardados((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Configuración de pagos
          </h1>
          <p className="text-sm text-[#6B6560]">
            Agrega y gestiona tus métodos de cobro
          </p>
        </div>
      </div>

      {/* Métodos configurados */}
      {metodosGuardados.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B6560]">
            Métodos configurados
          </h2>
          {metodosGuardados.map((metodo) => {
            const config = METODOS_DISPONIBLES.find((m) => m.tipo === metodo.tipo)
            const IconoMetodo = config?.icono ?? CreditCard
            return (
              <Card key={metodo.id} className="border-[#E8E4DF]">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D8F3DC]">
                      <IconoMetodo className="h-5 w-5 text-[#1B4332]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {config?.label ?? metodo.tipo}
                      </p>
                      <p className="text-xs text-[#6B6560]">{metodo.resumen}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-[#9E9892] hover:text-[#C1121F]"
                    onClick={() => eliminarMetodo(metodo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Botón para agregar nuevo método */}
      {!mostrarFormulario && (
        <Button
          className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
          onClick={() => setMostrarFormulario(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Agregar método de pago
        </Button>
      )}

      {/* Formulario para nuevo método */}
      {mostrarFormulario && (
        <Card className="border-[#E8E4DF]">
          <CardHeader>
            <CardTitle className="text-lg">Nuevo método de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selección de tipo */}
            <div className="space-y-2">
              <Label>Tipo de método</Label>
              <Select
                value={metodoSeleccionado}
                onValueChange={(valor: string | null) => {
                  setMetodoSeleccionado(valor ?? '')
                  reset()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_DISPONIBLES.map((metodo) => {
                    const IconoMetodo = metodo.icono
                    return (
                      <SelectItem key={metodo.tipo} value={metodo.tipo}>
                        <span className="flex items-center gap-2">
                          <IconoMetodo className="h-4 w-4" />
                          {metodo.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Campos dinámicos del método seleccionado */}
            {configMetodo && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {configMetodo.campos.map((campo) => (
                  <div key={campo.key} className="space-y-2">
                    <Label htmlFor={campo.key}>{campo.etiqueta}</Label>
                    <Input
                      id={campo.key}
                      placeholder={campo.placeholder}
                      {...register(campo.key, { required: `El campo ${campo.etiqueta.toLowerCase()} es requerido` })}
                    />
                    {errors[campo.key] && (
                      <p className="text-xs text-[#C1121F]">
                        {String(errors[campo.key]?.message)}
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Guardar método
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#E8E4DF]"
                    onClick={() => {
                      setMostrarFormulario(false)
                      setMetodoSeleccionado('')
                      reset()
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado vacío cuando no hay métodos */}
      {metodosGuardados.length === 0 && !mostrarFormulario && (
        <Card className="border-[#E8E4DF]">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F3]">
              <CreditCard className="h-6 w-6 text-[#9E9892]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              No tienes métodos de pago configurados
            </h3>
            <p className="mt-1 text-xs text-[#9E9892]">
              Agrega al menos un método para recibir pagos por tus reservas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
