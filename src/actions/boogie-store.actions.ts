'use server'

import * as Sentry from '@sentry/nextjs'

import { goGet } from '@/lib/go-api-client'
import type { StoreProducto, StoreServicio, CategoriaStoreProducto, CategoriaStoreServicio } from '@/lib/store-constants'

export async function getProductosStore(): Promise<StoreProducto[]> {
  try {
    const data = await goGet<Record<string, unknown>[]>('/api/v1/tienda/productos')
    if (!data) return []
    return data.map((p) => ({
      id: p.id as string,
      nombre: p.nombre as string,
      descripcion: (p.descripcion as string) || null,
      precio: Number(p.precio),
      moneda: (p.moneda as 'USD' | 'VES') || 'USD',
      imagenUrl: (p.imagen_url as string) || null,
      categoria: p.categoria as CategoriaStoreProducto,
      activo: p.activo as boolean,
      orden: p.orden as number,
    }))
  } catch (err) {
      Sentry.captureException(err)
    console.error('[getProductosStore] Error:', err)
    return []
  }
}

export async function getServiciosStore(): Promise<StoreServicio[]> {
  try {
    const data = await goGet<Record<string, unknown>[]>('/api/v1/tienda/servicios')
    if (!data) return []
    return data.map((s) => ({
      id: s.id as string,
      nombre: s.nombre as string,
      descripcion: (s.descripcion as string) || null,
      precio: Number(s.precio),
      moneda: (s.moneda as 'USD' | 'VES') || 'USD',
      tipoPrecio: s.tipo_precio as 'FIJO' | 'POR_NOCHE',
      imagenUrl: (s.imagen_url as string) || null,
      categoria: s.categoria as CategoriaStoreServicio,
      activo: s.activo as boolean,
      orden: s.orden as number,
    }))
  } catch (err) {
      Sentry.captureException(err)
    console.error('[getServiciosStore] Error:', err)
    return []
  }
}
