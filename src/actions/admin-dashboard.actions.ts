'use server'

import * as Sentry from '@sentry/nextjs'

import { goGet, GoAPIError } from '@/lib/go-api-client'
import { requireAdmin } from '@/lib/admin-auth'

export async function getAdminStats() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    return await goGet<Record<string, unknown>>('/api/v1/admin/dashboard')
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar estadísticas' }
  }
}

export async function getAdminChartsData() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    return await goGet<Record<string, unknown>>('/api/v1/admin/dashboard')
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar datos de gráficos' }
  }
}

export async function getAdminTablesData() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  try {
    return await goGet<Record<string, unknown>>('/api/v1/admin/dashboard')
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar datos de tablas' }
  }
}
