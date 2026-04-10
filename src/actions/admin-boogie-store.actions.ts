'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import type { EntidadAuditable } from '@/lib/admin-auth'

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
    console.error('[subirImagenStore] Error:', err)
    return { error: 'Error al subir la imagen' }
  }
}

export async function getProductosStoreAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return []

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('store_productos')
      .select('*')
      .order('orden', { ascending: true })

    if (!data) return []
    return data
  } catch (err) {
    console.error('[getProductosStoreAdmin] Error:', err)
    return []
  }
}

export async function getServiciosStoreAdmin() {
  const auth = await requireAdmin()
  if (auth.error) return []

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('store_servicios')
      .select('*')
      .order('orden', { ascending: true })

    if (!data) return []
    return data
  } catch (err) {
    console.error('[getServiciosStoreAdmin] Error:', err)
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
    const admin = createAdminClient()
    const { error } = await admin.from('store_productos').insert({
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      precio: datos.precio,
      moneda: datos.moneda || 'USD',
      imagen_url: datos.imagenUrl || null,
      categoria: datos.categoria,
      orden: datos.orden || 0,
      activo: true,
    })

    if (error) return { error: 'Error al crear el producto' }

    await logAdminAction({
      accion: 'CREAR',
      entidad: 'store_producto' as EntidadAuditable,
      detalles: { nombre: datos.nombre, precio: datos.precio },
    })

    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    console.error('[crearProductoStore] Error:', err)
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
    const admin = createAdminClient()
    const updateData: Record<string, unknown> = {}
    if (datos.nombre !== undefined) updateData.nombre = datos.nombre
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion
    if (datos.precio !== undefined) updateData.precio = datos.precio
    if (datos.moneda !== undefined) updateData.moneda = datos.moneda
    if (datos.imagenUrl !== undefined) updateData.imagen_url = datos.imagenUrl
    if (datos.categoria !== undefined) updateData.categoria = datos.categoria
    if (datos.activo !== undefined) updateData.activo = datos.activo
    if (datos.orden !== undefined) updateData.orden = datos.orden

    const { error } = await admin.from('store_productos').update(updateData).eq('id', id)

    if (error) return { error: 'Error al actualizar el producto' }

    await logAdminAction({
      accion: 'ACTUALIZAR',
      entidad: 'store_producto' as EntidadAuditable,
      entidadId: id,
      detalles: datos,
    })

    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    console.error('[actualizarProductoStore] Error:', err)
    return { error: 'Error al actualizar el producto' }
  }
}

export async function eliminarProductoStore(id: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('store_productos').delete().eq('id', id)

    if (error) return { error: 'Error al eliminar el producto' }

    await logAdminAction({
      accion: 'ELIMINAR',
      entidad: 'store_producto' as EntidadAuditable,
      entidadId: id,
    })

    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    console.error('[eliminarProductoStore] Error:', err)
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
    const admin = createAdminClient()
    const { error } = await admin.from('store_servicios').insert({
      nombre: datos.nombre,
      descripcion: datos.descripcion || null,
      precio: datos.precio,
      moneda: datos.moneda || 'USD',
      tipo_precio: datos.tipoPrecio,
      imagen_url: datos.imagenUrl || null,
      categoria: datos.categoria,
      orden: datos.orden || 0,
      activo: true,
    })

    if (error) return { error: 'Error al crear el servicio' }

    await logAdminAction({
      accion: 'CREAR',
      entidad: 'store_servicio' as EntidadAuditable,
      detalles: { nombre: datos.nombre, precio: datos.precio },
    })

    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    console.error('[crearServicioStore] Error:', err)
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
    const admin = createAdminClient()
    const updateData: Record<string, unknown> = {}
    if (datos.nombre !== undefined) updateData.nombre = datos.nombre
    if (datos.descripcion !== undefined) updateData.descripcion = datos.descripcion
    if (datos.precio !== undefined) updateData.precio = datos.precio
    if (datos.moneda !== undefined) updateData.moneda = datos.moneda
    if (datos.tipoPrecio !== undefined) updateData.tipo_precio = datos.tipoPrecio
    if (datos.imagenUrl !== undefined) updateData.imagen_url = datos.imagenUrl
    if (datos.categoria !== undefined) updateData.categoria = datos.categoria
    if (datos.activo !== undefined) updateData.activo = datos.activo
    if (datos.orden !== undefined) updateData.orden = datos.orden

    const { error } = await admin.from('store_servicios').update(updateData).eq('id', id)

    if (error) return { error: 'Error al actualizar el servicio' }

    await logAdminAction({
      accion: 'ACTUALIZAR',
      entidad: 'store_servicio' as EntidadAuditable,
      entidadId: id,
      detalles: datos,
    })

    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    console.error('[actualizarServicioStore] Error:', err)
    return { error: 'Error al actualizar el servicio' }
  }
}

export async function eliminarServicioStore(id: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('store_servicios').delete().eq('id', id)

    if (error) return { error: 'Error al eliminar el servicio' }

    await logAdminAction({
      accion: 'ELIMINAR',
      entidad: 'store_servicio' as EntidadAuditable,
      entidadId: id,
    })

    revalidatePath('/admin/boogie-store')
    return { exito: true }
  } catch (err) {
    console.error('[eliminarServicioStore] Error:', err)
    return { error: 'Error al eliminar el servicio' }
  }
}
