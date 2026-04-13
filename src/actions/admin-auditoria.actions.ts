'use server'

import { goApi, GoAPIError } from '@/lib/go-api-client'

type AuditResult = {
  data?: Array<{ id: string; admin_id: string; accion: string; entidad: string; entidad_id: string; detalles: unknown; ip: string; user_agent: string; created_at: string; usuarios: { nombre: string; apellido: string; email: string } }>;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  error?: string;
}

export async function getAuditLogAdmin(filtros?: {
  entidad?: string
  adminId?: string
  fechaInicio?: string
  fechaFin?: string
  pagina?: number
}): Promise<AuditResult> {
  try {
    const params = new URLSearchParams()
    if (filtros?.entidad && filtros.entidad !== 'TODOS') params.set('entidad', filtros.entidad)
    if (filtros?.adminId) params.set('adminId', filtros.adminId)
    if (filtros?.fechaInicio) params.set('fechaInicio', filtros.fechaInicio)
    if (filtros?.fechaFin) params.set('fechaFin', filtros.fechaFin)
    if (filtros?.pagina) params.set('pagina', String(filtros.pagina))
    const qs = params.toString()
    const outer = await goApi<Record<string, unknown>>(qs ? `/api/v1/admin/auditoria?${qs}` : '/api/v1/admin/auditoria', { raw: true })
    const raw = (outer?.data ?? outer) as Record<string, unknown>
    return {
      data: (raw?.data ?? []) as AuditResult['data'],
      total: (raw?.total ?? 0) as number,
      pagina: (raw?.pagina ?? 1) as number,
      totalPaginas: (raw?.totalPaginas ?? 0) as number,
    }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar auditoría' }
  }
}
