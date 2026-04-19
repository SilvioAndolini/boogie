'use server'

import { goGet, goPost, goPut, goPatch, goDelete, goApi, GoAPIError } from '@/lib/go-api-client'
import { requireAdmin } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

export async function getCupones() {
  const auth = await requireAdmin()
  if (auth.error) return []

  try {
    return await goGet<Array<Record<string, unknown>>>('/api/v1/admin/cupones')
  } catch {
    return []
  }
}

export async function getCuponPorId(id: string) {
  const auth = await requireAdmin()
  if (auth.error) return null

  try {
    return await goGet<Record<string, unknown> | null>(`/api/v1/admin/cupones/${id}`)
  } catch {
    return null
  }
}

export async function crearCupon(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

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
  const auth = await requireAdmin()
  if (auth.error) return []

  try {
    const qs = cuponId ? `?cuponId=${cuponId}` : ''
    return await goGet<Array<Record<string, unknown>>>(`/api/v1/admin/cupon-usos${qs}`)
  } catch {
    return []
  }
}

export async function getComisiones() {
  const auth = await requireAdmin()
  if (auth.error) return { huesped: 0, anfitrion: 0, error: auth.error }

  try {
    return await goGet<{ huesped: number; anfitrion: number }>('/api/v1/admin/comisiones')
  } catch {
    return { huesped: 0.06, anfitrion: 0.03 }
  }
}

export async function actualizarComisiones(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

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

export async function getCuponesActivosUsuario(_usuarioId: string) {
  const auth = await requireAdmin()
  if (auth.error) return []

  try {
    return await goApi<Array<Record<string, unknown>>>('/api/v1/cupones/activos')
  } catch {
    return []
  }
}

export async function validarCupon(codigo: string, propiedadId: string, montoTotal: number, noches: number) {
  try {
    return await goPost<Record<string, unknown>>('/api/v1/cupones/validar', {
      codigo,
      propiedadId,
      montoTotal,
      noches,
    })
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al validar cupón' }
  }
}
