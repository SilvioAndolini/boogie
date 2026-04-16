// Tipos globales de la aplicación Boogie

export type Rol = 'BOOGER' | 'ANFITRION' | 'AMBOS' | 'ADMIN'
export type PlanSuscripcion = 'FREE' | 'ULTRA'
export type TipoPropiedad = 'APARTAMENTO' | 'CASA' | 'VILLA' | 'CABANA' | 'ESTUDIO' | 'HABITACION' | 'LOFT' | 'PENTHOUSE' | 'FINCA' | 'OTRO'
export type CategoriaPropiedad = 'ALOJAMIENTO' | 'DEPORTE'
export type TipoCancha = 'FUTBOL' | 'BALONCESTO' | 'TENIS' | 'PADDLE' | 'TENIS_DE_MESA' | 'MULTIDEPORTE'
export type Moneda = 'USD' | 'VES'
export type PoliticaCancelacion = 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA'
export type EstadoPublicacion = 'BORRADOR' | 'PENDIENTE_REVISION' | 'PUBLICADA' | 'PAUSADA' | 'SUSPENDIDA'
export type EstadoReserva = 'PENDIENTE_PAGO' | 'PENDIENTE' | 'PENDIENTE_CONFIRMACION' | 'CONFIRMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA_HUESPED' | 'CANCELADA_ANFITRION' | 'RECHAZADA' | 'ANULADA'
export type MetodoPagoEnum = 'TRANSFERENCIA_BANCARIA' | 'PAGO_MOVIL' | 'ZELLE' | 'EFECTIVO_FARMATODO' | 'USDT' | 'EFECTIVO' | 'CRIPTO' | 'WALLET'
export type EstadoPago = 'PENDIENTE' | 'EN_VERIFICACION' | 'VERIFICADO' | 'ACREDITADO' | 'RECHAZADO' | 'REEMBOLSADO'

// Interfaz genérica para respuestas paginadas de la API
export interface PaginacionRespuesta<T> {
  datos: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

// Interfaz para respuestas de API
export interface ApiRespuesta<T = unknown> {
  exito: boolean
  datos?: T
  error?: string
  mensaje?: string
}

// Tipo para los filtros de búsqueda
export interface FiltrosBusqueda {
  ubicacion?: string
  fechaEntrada?: Date
  fechaSalida?: Date
  huespedes?: number
  precioMin?: number
  precioMax?: number
  tipoPropiedad?: TipoPropiedad
  amenidades?: string[]
  pagina?: number
  ordenarPor?: 'precio_asc' | 'precio_desc' | 'rating' | 'recientes'
}
