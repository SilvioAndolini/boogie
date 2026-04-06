// Constantes globales de la aplicación Boogie

export const APP_NAME = 'Boogie'
export const APP_DESCRIPTION = 'Tu hogar lejos de casa en Venezuela'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Comisiones de la plataforma
export const COMISION_PLATAFORMA_HUESPED = Number(process.env.COMISION_PLATAFORMA_HUESPED) || 0.06
export const COMISION_PLATAFORMA_ANFITRION = Number(process.env.COMISION_PLATAFORMA_ANFITRION) || 0.03

// Paginación
export const PROPIEDADES_POR_PAGINA = 12
export const RESENAS_POR_PAGINA = 10

// Fechas
export const HORARIO_CHECKIN_DEFAULT = '14:00'
export const HORARIO_CHECKOUT_DEFAULT = '11:00'
export const ESTANCIA_MINIMA_DEFAULT = 1

// Máximos
export const MAX_IMAGENES_PROPIEDAD = 20
export const MAX_TAMANO_IMAGEN = 5 * 1024 * 1024 // 5MB
export const MAX_HUESPEDES_DEFAULT = 16

// Tipos de propiedad con sus etiquetas en castellano
export const TIPOS_PROPIEDAD = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  VILLA: 'Villa',
  CABANA: 'Cabaña',
  ESTUDIO: 'Estudio',
  HABITACION: 'Habitación',
  LOFT: 'Loft',
  PENTHOUSE: 'Penthouse',
  FINCA: 'Finca',
  OTRO: 'Otro',
} as const

// Métodos de pago con etiquetas
export const METODOS_PAGO = {
  TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
  PAGO_MOVIL: 'Pago Móvil',
  ZELLE: 'Zelle',
  EFECTIVO_FARMATODO: 'Efectivo (Farmatodo)',
  USDT: 'USDT (Tether)',
  TARJETA_INTERNACIONAL: 'Tarjeta Internacional',
  EFECTIVO: 'Efectivo',
} as const

// Políticas de cancelación
export const POLITICAS_CANCELACION = {
  FLEXIBLE: {
    nombre: 'Flexible',
    descripcion: 'Cancelación gratuita hasta 24 horas antes del check-in',
  },
  MODERADA: {
    nombre: 'Moderada',
    descripcion: 'Cancelación gratuita hasta 5 días antes del check-in',
  },
  ESTRICTA: {
    nombre: 'Estricta',
    descripcion: 'Cancelación gratuita hasta 14 días antes del check-in',
  },
} as const

// Estados de Venezuela
export const ESTADOS_VENEZUELA = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Táchira',
  'Trujillo',
  'Vargas',
  'Yaracuy',
  'Zulia',
] as const
