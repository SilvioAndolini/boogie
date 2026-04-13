'use server'

import { goGet, goPost, goPatch, goDelete, GoAPIError } from '@/lib/go-api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function subirImagenStore(formData: FormData): Promise<{ url?: string; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const file = formData.get('imagen') as File | null
  if (!file) return { error: 'No se recibio la imagen' }

  try {
    const admin = createAdminClient()
    const ext = file.name.split('.').pop() || 'webp'
    const path = `store/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('imagenes')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) return { error: 'Error al subir la imagen' }

    const { data: urlData } = admin.storage.from('imagenes').getPublicUrl(path)
    return { url: urlData.publicUrl }
  } catch (err) {
    return { error: 'Error al subir la imagen' }
  }
}

export async function getProductosStoreAdmin() {
  try {
    return await goGet('/api/v1/admin/tienda/productos')
  } catch {
    return []
  }
}

export async function getServiciosStoreAdmin() {
  try {
    return await goGet('/api/v1/admin/tienda/servicios')
  } catch {
    return []
  }
}

export async function crearProductoStore(datos: {
  nombre: string
  descripcion?: string
  precio: number
  moneda: 'USD' | 'VES'
  imagenUrl?: string
  categoria: string
  orden?: number
}) {
  try {
    await goPost('/api/v1/admin/store/productos', datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al crear el producto' }
  }
}

export async function actualizarProductoStore(id: string, datos: {
  nombre?: string
  descripcion?: string
  precio?: number
  moneda?: 'USD' | 'VES'
  imagenUrl?: string
  categoria?: string
  activo?: boolean
  orden?: number
}) {
  try {
    await goPatch(`/api/v1/admin/store/productos/${id}`, datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar el producto' }
  }
}

export async function eliminarProductoStore(id: string) {
  try {
    await goDelete(`/api/v1/admin/store/productos/${id}`)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al eliminar el producto' }
  }
}

export async function crearServicioStore(datos: {
  nombre: string
  descripcion?: string
  precio: number
  moneda: 'USD' | 'VES'
  tipoPrecio: 'FIJO' | 'POR_NOCHE'
  imagenUrl?: string
  categoria: string
  orden?: number
}) {
  try {
    await goPost('/api/v1/admin/store/servicios', datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al crear el servicio' }
  }
}

export async function actualizarServicioStore(id: string, datos: {
  nombre?: string
  descripcion?: string
  precio?: number
  moneda?: 'USD' | 'VES'
  tipoPrecio?: 'FIJO' | 'POR_NOCHE'
  imagenUrl?: string
  categoria?: string
  activo?: boolean
  orden?: number
}) {
  try {
    await goPatch(`/api/v1/admin/store/servicios/${id}`, datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar el servicio' }
  }
}

export async function eliminarServicioStore(id: string) {
  try {
    await goDelete(`/api/v1/admin/store/servicios/${id}`)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al eliminar el servicio' }
  }
}
