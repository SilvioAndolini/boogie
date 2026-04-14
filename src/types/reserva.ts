import type {
  EstadoReserva,
  EstadoPago,
  MetodoPagoEnum,
  Moneda,
  PoliticaCancelacion,
} from '@/types'

export type { EstadoReserva, EstadoPago, MetodoPagoEnum, Moneda, PoliticaCancelacion }

export interface ResultadoAccion<T = unknown> {
  exito: boolean
  datos?: T
  error?: {
    codigo: string
    mensaje: string
    detalle?: string
  }
}

export interface DesgloseNoche {
  fecha: Date
  precio: number
  tipo: 'BASE' | 'ESPECIAL'
  nombre?: string
}

export interface PrecioReserva {
  noches: number
  precioPorNoche: number
  subtotal: number
  comisionHuesped: number
  comisionAnfitrion: number
  total: number
  moneda: Moneda
}

export interface ReembolsoCalculado {
  totalReserva: number
  comisionPlataforma: number
  montoReembolsable: number
  montoNoReembolsable: number
  porcentajeReembolso: number
  politicaAplicable: PoliticaCancelacion
  diasAntesCheckIn: number
  mensaje: string
}

export interface VerificacionDisponibilidad {
  disponible: boolean
  conflicto?: {
    tipo: 'RESERVA_EXISTENTE' | 'FECHA_BLOQUEADA'
    reservaId?: string
    fechaBloqueadaId?: string
  }
}

export interface ReservaConPropiedad {
  id: string
  codigo: string
  fechaEntrada: string
  fechaSalida: string
  noches: number
  precioPorNoche: string
  subtotal: string
  comisionPlataforma: string
  total: string
  moneda: Moneda
  cantidadHuespedes: number
  estado: EstadoReserva
  notasHuesped: string | null
  fechaCreacion: string
  fechaConfirmacion: string | null
  fechaCancelacion: string | null
  propiedad: {
    id: string
    titulo: string
    direccion: string
    politicaCancelacion: PoliticaCancelacion
    imagenPrincipal?: string
  }
  huesped?: {
    id: string
    nombre: string
    apellido: string
    avatarUrl: string | null
  }
  pago?: {
    id: string
    monto: string
    metodoPago: MetodoPagoEnum
    estado: EstadoPago
    referencia: string | null
    fechaCreacion: string
  }
}

export const ESTADO_RESERVA_LABELS: Record<EstadoReserva, string> = {
  PENDIENTE_PAGO: 'Esperando Pago',
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  CANCELADA_HUESPED: 'Cancelada por Huésped',
  CANCELADA_ANFITRION: 'Cancelada por Anfitrión',
  RECHAZADA: 'Rechazada',
  ANULADA: 'Anulada',
} as const

export const ESTADO_RESERVA_COLORS: Record<EstadoReserva, string> = {
  PENDIENTE_PAGO: 'bg-[#FFF7ED] text-[#C2410C]',
  PENDIENTE: 'bg-[#FEF3C7] text-[#92400E]',
  CONFIRMADA: 'bg-[#D8F3DC] text-[#1B4332]',
  EN_CURSO: 'bg-[#E8F4FD] text-[#457B9D]',
  COMPLETADA: 'bg-[#D8F3DC] text-[#2D6A4F]',
  CANCELADA_HUESPED: 'bg-[#FEE2E2] text-[#C1121F]',
  CANCELADA_ANFITRION: 'bg-[#FEE2E2] text-[#C1121F]',
  RECHAZADA: 'bg-[#FEE2E2] text-[#C1121F]',
  ANULADA: 'bg-[#F3F4F6] text-[#6B7280]',
} as const

export const ESTADO_PAGO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  EN_VERIFICACION: 'En verificación',
  VERIFICADO: 'Verificado',
  ACREDITADO: 'Acreditado',
  RECHAZADO: 'Rechazado',
  REEMBOLSADO: 'Reembolsado',
} as const
