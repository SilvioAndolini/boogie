'use server'

import { goGet, goApi, goPatch, goDelete, GoAPIError } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

export async function getPropiedadesAdmin(filters: {
  estado?: string
  ciudad?: string
  busqueda?: string
  pagina?: number
  limite?: number
}) {
  try {
    const params = new URLSearchParams()
    if (filters.estado) params.set('estado', filters.estado)
    if (filters.ciudad) params.set('ciudad', filters.ciudad)
    if (filters.busqueda) params.set('busqueda', filters.busqueda)
    if (filters.pagina) params.set('pagina', String(filters.pagina))
    if (filters.limite) params.set('limite', String(filters.limite))
    const qs = params.toString()
    const outer = await goApi<Record<string, unknown>>(qs ? `/api/v1/admin/propiedades?${qs}` : '/api/v1/admin/propiedades', { raw: true })
    const obj: Record<string, unknown> = (outer?.data as Record<string, unknown>) ?? outer
    return {
      propiedades: ((obj?.data as Array<Record<string, unknown>>) ?? []),
      total: (obj?.total as number) ?? 0,
      paginas: (obj?.totalPaginas as number) ?? 0,
    }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar propiedades' }
  }
}

export async function getCiudadesPropiedades() {
  try {
    return await goGet<string[]>('/api/v1/admin/propiedades/ciudades')
  } catch {
    return []
  }
}

export async function getPropiedadDetalleAdmin(id: string) {
  try {
    const data = await goGet<Record<string, unknown>>(`/api/v1/admin/propiedades/${id}`)
    return { propiedad: data, reservas: [] }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Propiedad no encontrada' }
  }
}

export async function actualizarPropiedadAdmin(formData: FormData) {
  const propiedadId = formData.get('propiedadId') as string
  const estadoPublicacion = (formData.get('estadoPublicacion') as string) || undefined
  const destacada = formData.get('destacada') === 'true' ? true : formData.get('destacada') === 'false' ? false : undefined
  const motivo = (formData.get('motivo') as string) || undefined

  try {
    await goPatch('/api/v1/admin/propiedades', { propiedadId, estadoPublicacion, destacada, motivo })
    revalidatePath('/admin/propiedades')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar propiedad' }
  }
}

export async function eliminarPropiedadAdmin(formData: FormData) {
  const propiedadId = formData.get('propiedadId') as string
  if (!propiedadId) return { error: 'ID de propiedad requerido' }

  try {
    await goDelete(`/api/v1/admin/propiedades/${propiedadId}`)
    revalidatePath('/admin/propiedades')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al eliminar propiedad' }
  }
}

export async function getPropiedadIngresos(propiedadId: string) {
  try {
    return await goGet<Record<string, unknown>>(`/api/v1/admin/propiedades/${propiedadId}/ingresos`)
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar ingresos' }
  }
}
