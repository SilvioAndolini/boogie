'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { StoreProducto, StoreServicio, CategoriaStoreProducto, CategoriaStoreServicio } from '@/lib/store-constants'

export async function getProductosStore(): Promise<StoreProducto[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('store_productos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (!data) return []
    return (data as Record<string, unknown>[]).map((p) => ({
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
    console.error('[getProductosStore] Error:', err)
    return []
  }
}

export async function getServiciosStore(): Promise<StoreServicio[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('store_servicios')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (!data) return []
    return (data as Record<string, unknown>[]).map((s) => ({
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
    console.error('[getServiciosStore] Error:', err)
    return []
  }
}
