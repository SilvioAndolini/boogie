'use server'

import { goGet, goPost, goPut, goPatch, goDelete, GoAPIError } from '@/lib/go-api-client'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getCupones() {
  try {
    return await goGet<Array<Record<string, unknown>>>('/api/v1/admin/cupones')
  } catch {
    return []
  }
}

export async function getCuponPorId(id: string) {
  try {
    return await goGet<Record<string, unknown> | null>(`/api/v1/admin/cupones/${id}`)
  } catch {
    return null
  }
}

export async function crearCupon(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    await goPost('/api/v1/admin/cupones', data)
    revalidatePath('/admin/cupones')
    return { success: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al crear el cupón' }
  }
}

export async function editarCupon(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    await goPut('/api/v1/admin/cupones', data)
    revalidatePath('/admin/cupones')
    return { success: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar el cupón' }
  }
}

export async function toggleCuponActivo(id: string, activo: boolean) {
  try {
    await goPatch(`/api/v1/admin/cupones/${id}/activo`, { activo })
    revalidatePath('/admin/cupones')
    return { success: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cambiar estado' }
  }
}

export async function eliminarCupon(id: string) {
  try {
    await goDelete(`/api/v1/admin/cupones/${id}`)
    revalidatePath('/admin/cupones')
    return { success: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al eliminar cupón' }
  }
}

export async function getCuponesUsos(cuponId?: string) {
  try {
    const qs = cuponId ? `?cuponId=${cuponId}` : ''
    return await goGet<Array<Record<string, unknown>>>(`/api/v1/admin/cupon-usos${qs}`)
  } catch {
    return []
  }
}

export async function getComisiones() {
  try {
    return await goGet<{ huesped: number; anfitrion: number }>('/api/v1/admin/comisiones')
  } catch {
    return { huesped: 0.06, anfitrion: 0.03 }
  }
}

export async function actualizarComisiones(formData: FormData) {
  try {
    const comisionHuesped = formData.get('comisionHuesped')
    const comisionAnfitrion = formData.get('comisionAnfitrion')
    await goPut('/api/v1/admin/comisiones', { comisionHuesped, comisionAnfitrion })
    revalidatePath('/admin/configuracion')
    return { success: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar comisiones' }
  }
}

export async function getCuponesActivosUsuario(usuarioId: string) {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await admin
    .from('cupones')
    .select('*')
    .eq('activo', true)
    .lte('fecha_inicio', now)
    .gte('fecha_fin', now)
    .order('fecha_creacion', { ascending: false })

  if (error) return []

  const cupones = data || []
  const result = []

  for (const cupon of cupones) {
    const { data: usos } = await admin
      .from('cupon_usos')
      .select('id')
      .eq('cupon_id', cupon.id)
      .eq('usuario_id', usuarioId)

    const vecesUsado = usos?.length || 0
    if (cupon.max_usos_por_usuario && vecesUsado >= cupon.max_usos_por_usuario) continue
    if (cupon.max_usos && cupon.usos_actuales >= cupon.max_usos) continue

    result.push({ ...cupon, vecesUsado })
  }

  return result
}
