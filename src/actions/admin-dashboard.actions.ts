'use server'

import { goGet, GoAPIError } from '@/lib/go-api-client'

export async function getAdminStats() {
  try {
    return await goGet<Record<string, unknown>>('/api/v1/admin/dashboard')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar estadísticas' }
  }
}

export async function getAdminChartsData() {
  try {
    return await goGet<Record<string, unknown>>('/api/v1/admin/dashboard')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar datos de gráficos' }
  }
}

export async function getAdminTablesData() {
  try {
    return await goGet<Record<string, unknown>>('/api/v1/admin/dashboard')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar datos de tablas' }
  }
}
