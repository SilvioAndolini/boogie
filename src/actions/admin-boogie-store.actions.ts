'use server'

import * as Sentry from '@sentry/nextjs'

import { goGet, goPost, goPatch, goDelete, goApi, GoAPIError } from '@/lib/go-api-client'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function subirImagenStore(formData: FormData): Promise<{ url?: string; error?: string }> {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    const result = await goApi<{ ok: boolean; url: string }>('/api/v1/admin/store/upload-imagen', {
      method: 'POST',
      body: formData,
      raw: true,
    })
    return { url: result.url }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al subir la imagen' }
  }
}

export async function getProductosStoreAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return []

  try {
    return await goGet('/api/v1/admin/tienda/productos')
  } catch {
    return []
  }
}

export async function getServiciosStoreAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return []

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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    await goPost('/api/v1/admin/store/productos', datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    await goPatch(`/api/v1/admin/store/productos/${id}`, datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar el producto' }
  }
}

export async function eliminarProductoStore(id: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    await goDelete(`/api/v1/admin/store/productos/${id}`)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    await goPost('/api/v1/admin/store/servicios', datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    await goPatch(`/api/v1/admin/store/servicios/${id}`, datos)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar el servicio' }
  }
}

export async function eliminarServicioStore(id: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    await goDelete(`/api/v1/admin/store/servicios/${id}`)
    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al eliminar el servicio' }
  }
}
