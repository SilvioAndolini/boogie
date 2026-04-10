// Constantes globales de la aplicación Boogie

export const APP_NAME = 'Boogie'
export const APP_DESCRIPTION = 'Tu hogar lejos de casa en Venezuela'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/*
 * ============================================================================
 * ⚠️  EXCEPCIÓN DE DESARROLLO — ELIMINAR ANTES DE PRODUCCIÓN
 * ============================================================================
 * El siguiente teléfono se usa para testing durante desarrollo.
 * Permite que este número se registre múltiples veces con distintos emails,
 * saltando las restricciones de unicidad de teléfono en Supabase Auth.
 *
 * PARA PRODUCCIÓN:
 *   1. Eliminar esta constante y todas sus referencias
 *   2. Buscar "DEV_PHONE_EXCEPTION" en el código y eliminar cada bloque
 *   3. El teléfono DEBE ser único por cuenta Auth en producción
 * ============================================================================
 */
export const DEV_PHONE_EXCEPTION = '04241543664'
export function isDevPhone(phone: string): boolean {
  if (!DEV_PHONE_EXCEPTION) return false
  const clean = phone.replace(/\D/g, '')
  const exception = DEV_PHONE_EXCEPTION.replace(/\D/g, '')
  return clean === exception
}

// Comisiones de la plataforma
export const COMISION_PLATAFORMA_HUESPED = Number(process.env.COMISION_PLATAFORMA_HUESPED) || 0.06
export const COMISION_PLATAFORMA_ANFITRION = Number(process.env.COMISION_PLATAFORMA_ANFITRION) || 0.03

export const PLANES_SUSCRIPCION = {
  FREE: {
    nombre: 'Boogie Free',
    maxBoogies: 5,
    descripcion: 'Uso estándar de la plataforma',
  },
  ULTRA: {
    nombre: 'Boogie Ultra',
    maxBoogies: Infinity,
    descripcion: 'Boogies ilimitados, prioridad en búsquedas, producción audiovisual profesional',
  },
} as const

export const MAX_BOOGIES_FREE = 5

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
  CRIPTO: 'Criptomonedas (USDT)',
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
