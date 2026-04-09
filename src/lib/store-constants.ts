export type CategoriaStoreProducto = 'HIGIENE' | 'CUIDADO_PERSONAL' | 'CONSUMIBLES' | 'SNACKS' | 'BEBIDAS' | 'OTRO'
export type CategoriaStoreServicio = 'GASTRONOMIA' | 'UTILIDADES' | 'TRANSPORTE' | 'LIMPIEZA' | 'OTRO'
export type TipoPrecio = 'FIJO' | 'POR_NOCHE'

export const CATEGORIAS_STORE_PRODUCTO: Record<CategoriaStoreProducto, string> = {
  HIGIENE: 'Higiene',
  CUIDADO_PERSONAL: 'Cuidado Personal',
  CONSUMIBLES: 'Consumibles',
  SNACKS: 'Snacks',
  BEBIDAS: 'Bebidas',
  OTRO: 'Otro',
} as const

export const CATEGORIAS_STORE_SERVICIO: Record<CategoriaStoreServicio, string> = {
  GASTRONOMIA: 'Gastronomía',
  UTILIDADES: 'Utilidades',
  TRANSPORTE: 'Transporte',
  LIMPIEZA: 'Limpieza',
  OTRO: 'Otro',
} as const

export const TIPOS_PRECIO_LABELS: Record<TipoPrecio, string> = {
  FIJO: 'Precio fijo',
  POR_NOCHE: 'Por noche',
} as const

export interface StoreProducto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: 'USD' | 'VES'
  imagenUrl: string | null
  categoria: CategoriaStoreProducto
  activo: boolean
  orden: number
}

export interface StoreServicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  moneda: 'USD' | 'VES'
  tipoPrecio: TipoPrecio
  imagenUrl: string | null
  categoria: CategoriaStoreServicio
  activo: boolean
  orden: number
}

export interface CartItem {
  id: string
  tipo: 'producto' | 'servicio'
  nombre: string
  precio: number
  moneda: 'USD' | 'VES'
  cantidad: number
  tipoPrecio?: TipoPrecio
  imagenUrl?: string | null
}
