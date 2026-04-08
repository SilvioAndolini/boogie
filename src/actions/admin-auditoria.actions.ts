'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { adminAuditFilterSchema } from '@/lib/admin-validations'

export async function getAuditLogAdmin(filtros?: {
  entidad?: string
  adminId?: string
  fechaInicio?: string
  fechaFin?: string
  pagina?: number
}) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const parsed = adminAuditFilterSchema.safeParse(filtros || {})
  const pagina = parsed.success ? parsed.data.pagina : 1
  const limite = 50
  const offset = (pagina - 1) * limite

  const admin = createAdminClient()

  let query = admin
    .from('admin_audit_log')
    .select(`
      id, admin_id, accion, entidad, entidad_id, detalles, ip, user_agent, created_at,
      usuarios (nombre, apellido, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1)

  if (filtros?.entidad && filtros.entidad !== 'TODOS') {
    query = query.eq('entidad', filtros.entidad)
  }

  if (filtros?.adminId) {
    query = query.eq('admin_id', filtros.adminId)
  }

  if (filtros?.fechaInicio) {
    query = query.gte('created_at', filtros.fechaInicio)
  }

  if (filtros?.fechaFin) {
    query = query.lte('created_at', filtros.fechaFin + 'T23:59:59')
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[getAuditLogAdmin] Error:', error.message)
    return { error: 'Error al cargar auditoría' }
  }

  return {
    logs: data,
    total: count ?? 0,
    pagina,
    totalPaginas: Math.ceil((count ?? 0) / limite),
  }
}
