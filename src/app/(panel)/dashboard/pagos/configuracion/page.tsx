'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, Plus, Trash2, Smartphone, Building2, DollarSign,
  Wallet, CheckCircle2, Loader2, Check, Settings, BarChart3,
  ArrowDownLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getWallet } from '@/actions/wallet.actions'
import { getMetodosPago, crearMetodoPago, eliminarMetodoPago } from '@/actions/metodo-pago.actions'

interface MetodoPagoConfig {
  tipo: string
  label: string
  icono: React.ElementType
  color: string
  sheen: string
  chipColor: string
  campos: Array<{ key: string; etiqueta: string; placeholder: string }>
}

interface MetodoGuardado {
  id: string
  tipo: string
  banco: string | null
  telefono: string | null
  cedula: string | null
  numero_cuenta: string | null
  titular: string | null
  email_zelle: string | null
  direccion_usdt: string | null
  activo: boolean
  principal: boolean
}

const METODOS_DISPONIBLES: MetodoPagoConfig[] = [
  {
    tipo: 'PAGO_MOVIL',
    label: 'Pago Móvil',
    icono: Smartphone,
    color: 'from-[#1e3a5f] via-[#2563eb] to-[#60a5fa]',
    sheen: 'from-white/[0.15] via-white/[0.05] to-transparent',
    chipColor: 'bg-[#fbbf24]',
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
    color: 'from-[#064e3b] via-[#059669] to-[#6ee7b7]',
    sheen: 'from-white/[0.12] via-white/[0.04] to-transparent',
    chipColor: 'bg-[#fbbf24]',
    campos: [
      { key: 'banco', etiqueta: 'Banco', placeholder: 'Ej: Banesco' },
      { key: 'cuenta', etiqueta: 'Número de cuenta', placeholder: 'Ej: 0134...' },
      { key: 'tipoCuenta', etiqueta: 'Tipo de cuenta', placeholder: 'Corriente / Ahorro' },
      { key: 'cedula', etiqueta: 'Cédula / RIF', placeholder: 'Ej: V-12345678' },
    ],
  },
  {
    tipo: 'USDT',
    label: 'USDT (Tether)',
    icono: Wallet,
    color: 'from-[#78350f] via-[#d97706] to-[#fcd34d]',
    sheen: 'from-white/[0.18] via-white/[0.06] to-transparent',
    chipColor: 'bg-white',
    campos: [
      { key: 'billetera', etiqueta: 'Dirección de billetera', placeholder: '0x...' },
      { key: 'red', etiqueta: 'Red', placeholder: 'Ej: TRC-20, ERC-20' },
    ],
  },
  {
    tipo: 'ZELLE',
    label: 'Zelle',
    icono: DollarSign,
    color: 'from-[#3b0764] via-[#7c3aed] to-[#c4b5fd]',
    sheen: 'from-white/[0.14] via-white/[0.05] to-transparent',
    chipColor: 'bg-[#fbbf24]',
    campos: [
      { key: 'email', etiqueta: 'Correo electrónico', placeholder: 'tu@email.com' },
      { key: 'nombreTitular', etiqueta: 'Nombre del titular', placeholder: 'Como aparece en Zelle' },
    ],
  },
]

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 12, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function ConfiguracionPagosPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<{ id: string; estado: string; saldo_usd: number } | null | undefined>(undefined)
  const [metodosGuardados, setMetodosGuardados] = useState<MetodoGuardado[]>([])
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    getWallet().then((res) => {
      if (res.wallet) setWallet(res.wallet as typeof wallet)
      else setWallet(null)
    })
    getMetodosPago().then((res) => {
      if ('metodos' in res && res.metodos) {
        setMetodosGuardados(res.metodos as MetodoGuardado[])
      }
    })
  }, [])

  const configMetodo = METODOS_DISPONIBLES.find((m) => m.tipo === metodoSeleccionado)

  const campoToDb: Record<string, Record<string, string>> = {
    PAGO_MOVIL: { banco: 'banco', telefono: 'telefono', cedula: 'cedula' },
    TRANSFERENCIA_BANCARIA: { banco: 'banco', cuenta: 'numero_cuenta', cedula: 'cedula' },
    USDT: { billetera: 'direccion_usdt' },
    ZELLE: { email: 'email_zelle', nombreTitular: 'titular' },
  }

  const getValorCampo = (metodo: MetodoGuardado, campoKey: string): string => {
    const dbKey = campoToDb[metodo.tipo]?.[campoKey]
    if (!dbKey) return '—'
    const val = (metodo as unknown as Record<string, unknown>)[dbKey] as string | null
    return val && val.length > 0 ? val : '—'
  }

  const onSubmit = async (data: Record<string, string>) => {
    if (!configMetodo) return
    setGuardando(true)

    const payload: Record<string, string> = { tipo: configMetodo.tipo }
    configMetodo.campos.forEach((c) => {
      if (data[c.key]) payload[c.key] = data[c.key]
    })

    const mapping: Record<string, Record<string, string>> = {
      PAGO_MOVIL: { banco: 'banco', telefono: 'telefono', cedula: 'cedula' },
      TRANSFERENCIA_BANCARIA: { banco: 'banco', cuenta: 'numero_cuenta', cedula: 'cedula' },
      USDT: { billetera: 'direccion_usdt' },
      ZELLE: { email: 'email_zelle', nombreTitular: 'titular' },
    }

    const mapped: Record<string, string> = { tipo: configMetodo.tipo }
    const fieldMap = mapping[configMetodo.tipo] || {}
    for (const [formKey, dbKey] of Object.entries(fieldMap)) {
      if (data[formKey]) mapped[dbKey] = data[formKey]
    }

    const res = await crearMetodoPago(mapped as Parameters<typeof crearMetodoPago>[0])
    if (res.error) {
      toast.error(res.error)
      setGuardando(false)
      return
    }

    if ('metodo' in res && res.metodo) {
      setMetodosGuardados((prev) => [...prev, res.metodo as MetodoGuardado])
    }

    reset()
    setMostrarFormulario(false)
    setMetodoSeleccionado('')
    setGuardando(false)
    toast.success(`${configMetodo.label} configurado correctamente`)
  }

  const handleEliminar = async (id: string) => {
    const metodo = metodosGuardados.find((m) => m.id === id)
    const config = METODOS_DISPONIBLES.find((m) => m.tipo === metodo?.tipo)
    const res = await eliminarMetodoPago(id)
    if (res.error) {
      toast.error(res.error)
      return
    }
    setMetodosGuardados((prev) => prev.filter((m) => m.id !== id))
    toast.success(`${config?.label || 'Método'} eliminado`)
  }

  const ic = "h-11 border-[#E8E4DF] bg-[#FDFCFA] text-sm focus-visible:border-[#1B4332] focus-visible:ring-[#1B4332]/20"

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl">

      {/* ====== HERO HEADER ====== */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-4 h-20 w-20 rounded-full bg-white/[0.03]" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <Settings className="h-5 w-5 text-white/70" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Configuración de pagos</h1>
            <p className="text-sm text-white/60">Gestiona tus métodos de cobro para recibir pagos</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">Configurados</p>
            <p className="text-2xl font-extrabold text-white tabular-nums">{metodosGuardados.length + (wallet ? 1 : 0)}</p>
          </div>
        </div>
      </motion.div>

      {/* ====== MÉTODOS CONFIGURADOS (Wallet + demás) ====== */}
      {(wallet || metodosGuardados.length > 0) && (
        <motion.div variants={fadeUp} className="mb-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9E9892] px-1">Métodos configurados</h2>
          <AnimatePresence>
            {/* Wallet card first */}
            {wallet && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] aspect-[1.586/1] max-h-[220px] shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent" />
                  <div className="absolute -right-16 -top-16 h-48 w-48 rotate-12 rounded-full bg-white/[0.07]" />
                  <div className="absolute -bottom-10 -left-10 h-32 w-32 rotate-12 rounded-full bg-black/[0.08]" />
                  <div className="absolute -left-8 top-0 h-full w-24 rotate-12 bg-gradient-to-b from-white/[0.06] via-white/[0.12] to-white/[0.03]" />

                  <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
                          <Wallet className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                          Boogie Wallet
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Recargar"
                          onClick={() => router.push('/dashboard/pagos/configuracion/wallet/recargar')}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/15 hover:text-white"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Estadísticas"
                          onClick={() => router.push('/dashboard/pagos/configuracion/wallet')}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/15 hover:text-white"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-10 items-center justify-center rounded-sm bg-[#fbbf24] shadow-inner">
                        <div className="h-4 w-6 rounded-[1px] border border-black/15 bg-gradient-to-b from-white/40 via-transparent to-white/20" />
                      </div>
                      <div className="h-3 w-6 rounded-full border border-white/20 bg-white/[0.06]" />
                      <div className="h-3 w-6 rounded-full border border-white/20 bg-white/[0.06]" />
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Saldo disponible</p>
                        <p className="text-2xl font-extrabold text-white tabular-nums">
                          ${wallet.saldo_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="ml-1 text-xs font-semibold text-white/50">USD</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 rounded-full bg-[#22c55e]/20 px-2 py-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#22c55e]">Activa</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Rest of payment methods */}
            {metodosGuardados.map((metodo, cardIdx) => {
              const config = METODOS_DISPONIBLES.find((m) => m.tipo === metodo.tipo)
              const IconoMetodo = config?.icono ?? CreditCard
              return (
                <motion.div
                  key={metodo.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.35, delay: cardIdx * 0.05 }}
                  className="group relative"
                >
                  {/* Credit card */}
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config?.color || 'from-[#1B4332] to-[#2D6A4F]'} aspect-[1.586/1] max-h-[220px] shadow-lg`}>
                    {/* Metallic sheen overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config?.sheen || 'from-white/10 via-white/5 to-transparent'}`} />
                    {/* Light reflection stripe */}
                    <div className="absolute -right-16 -top-16 h-48 w-48 rotate-12 rounded-full bg-white/[0.07]" />
                    <div className="absolute -bottom-10 -left-10 h-32 w-32 rotate-12 rounded-full bg-black/[0.08]" />
                    {/* Diagonal holographic stripe */}
                    <div className="absolute -left-8 top-0 h-full w-24 rotate-12 bg-gradient-to-b from-white/[0.06] via-white/[0.12] to-white/[0.03]" />

                    <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                      {/* Top row: label + delete */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm`}>
                            <IconoMetodo className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                            {config?.label ?? metodo.tipo}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEliminar(metodo.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/15 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Chip */}
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-10 items-center justify-center rounded-sm ${config?.chipColor || 'bg-[#fbbf24]'} shadow-inner`}>
                          <div className="h-4 w-6 rounded-[1px] border border-black/15 bg-gradient-to-b from-white/40 via-transparent to-white/20" />
                        </div>
                        <div className="h-3 w-6 rounded-full border border-white/20 bg-white/[0.06]" />
                        <div className="h-3 w-6 rounded-full border border-white/20 bg-white/[0.06]" />
                      </div>

                      {/* Bottom row: info fields */}
                      <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {config?.campos.slice(0, 3).map((campo) => {
                            const val = getValorCampo(metodo, campo.key)
                            return (
                              <div key={campo.key} className="flex items-baseline gap-2">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-white/40 shrink-0">{campo.etiqueta}</span>
                                <span className="text-xs font-semibold text-white/90 truncate">
                                  {val !== '—' && val.length > 28 ? val.slice(0, 28) + '...' : val}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        {/* Contactless / NFC icon */}
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <svg className="h-5 w-5 text-white/25 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 16.5a5 5 0 0 1 0-9" /><path d="M12 18a8 8 0 0 1 0-12" /><path d="M15.5 19.5a11 11 0 0 1 0-15" /></svg>
                          <Badge className="bg-white/15 text-white/70 text-[8px] backdrop-blur-sm border-0 px-1.5 py-0">Activo</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ====== ESTADO VACÍO ====== */}
      {metodosGuardados.length === 0 && !wallet && !mostrarFormulario && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="rounded-2xl border border-dashed border-[#E8E4DF] bg-[#FDFCFA] p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F6F3]">
              <CreditCard className="h-7 w-7 text-[#9E9892]" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A1A]">No tienes métodos de pago</h3>
            <p className="mt-1 text-sm text-[#9E9892] max-w-sm mx-auto">
              Agrega al menos un método para recibir pagos por tus reservas
            </p>
          </div>
        </motion.div>
      )}

      {/* ====== ACTIVAR WALLET (si no está activa) ====== */}
      {wallet === null && !mostrarFormulario && (
        <motion.div variants={fadeUp} className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/dashboard/pagos/configuracion/wallet')}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-[#E8E4DF] bg-[#FDFCFA] p-5 text-left transition-all hover:border-[#1B4332]/40 hover:bg-[#D8F3DC]/20"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4F1EC] group-hover:bg-[#1B4332]/10">
              <Wallet className="h-6 w-6 text-[#9E9892] group-hover:text-[#1B4332]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#1A1A1A]">Activar Boogie Wallet</h3>
              <p className="text-xs text-[#9E9892]">Tu billetera digital para recibir pagos directamente</p>
            </div>
            <Plus className="h-5 w-5 text-[#9E9892] group-hover:text-[#1B4332]" />
          </button>
        </motion.div>
      )}

      {/* ====== BOTÓN AGREGAR ====== */}
      {!mostrarFormulario && (
        <motion.div variants={fadeUp}>
          <Button
            className="h-12 w-full bg-[#1B4332] text-base text-white hover:bg-[#2D6A4F]"
            onClick={() => setMostrarFormulario(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar método de pago
          </Button>
        </motion.div>
      )}

      {/* ====== FORMULARIO NUEVO MÉTODO ====== */}
      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-2xl border border-[#E8E4DF] bg-gradient-to-b from-[#1B4332]/5 via-white to-white overflow-hidden">

              {/* Selector de tipo */}
              <div className="p-5">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">Selecciona un método</h3>
                <div className="grid grid-cols-2 gap-2">
                  {METODOS_DISPONIBLES.map((metodo) => {
                    const IconoMetodo = metodo.icono
                    const seleccionado = metodoSeleccionado === metodo.tipo
                    return (
                      <button
                        key={metodo.tipo}
                        type="button"
                        onClick={() => { setMetodoSeleccionado(metodo.tipo); reset() }}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          seleccionado
                            ? 'border-[#1B4332] bg-[#D8F3DC]/50 ring-1 ring-[#1B4332]/20'
                            : 'border-[#E8E4DF] bg-white hover:border-[#D4CFC9] hover:bg-[#FDFCFA]'
                        }`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          seleccionado ? 'bg-[#1B4332]' : 'bg-[#F4F1EC]'
                        }`}>
                          <IconoMetodo className={`h-4 w-4 ${seleccionado ? 'text-white' : 'text-[#6B6560]'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${seleccionado ? 'text-[#1B4332]' : 'text-[#4A4540]'}`}>
                          {metodo.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Campos dinámicos */}
              <AnimatePresence mode="wait">
                {configMetodo && (
                  <motion.div
                    key={configMetodo.tipo}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <div className="border-t border-[#F4F1EC] px-5 py-5 space-y-4">
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${configMetodo.color}`}>
                            <configMetodo.icono className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="text-sm font-bold text-[#1A1A1A]">{configMetodo.label}</h4>
                        </div>

                        {configMetodo.campos.map((campo) => (
                          <div key={campo.key} className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#6B6560]">{campo.etiqueta}</label>
                            <Input
                              placeholder={campo.placeholder}
                              className={ic}
                              {...register(campo.key, { required: `El campo ${campo.etiqueta.toLowerCase()} es requerido` })}
                            />
                            {errors[campo.key] && (
                              <p className="text-xs text-[#C1121F]">{String(errors[campo.key]?.message)}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-[#F4F1EC] px-5 py-4 flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 border-[#E8E4DF] h-11"
                          onClick={() => {
                            setMostrarFormulario(false)
                            setMetodoSeleccionado('')
                            reset()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-[#1B4332] text-white hover:bg-[#2D6A4F] h-11"
                          disabled={guardando}
                        >
                          {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Guardar método
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
