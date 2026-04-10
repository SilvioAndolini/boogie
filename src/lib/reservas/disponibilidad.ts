import { createAdminClient } from '@/lib/supabase/admin'
import type { VerificacionDisponibilidad } from '@/types/reserva'

export async function obtenerFechasOcupadas(
  propiedadId: string
): Promise<{ inicio: Date; fin: Date }[]> {
  const supabase = createAdminClient()
  const rangos: { inicio: Date; fin: Date }[] = []

  const { data: reservas } = await supabase
    .from('reservas')
    .select('fecha_entrada, fecha_salida')
    .eq('propiedad_id', propiedadId)
    .in('estado', ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'])

  if (reservas) {
    for (const r of reservas) {
      const inicio = new Date(r.fecha_entrada)
      const fin = new Date(r.fecha_salida)
      inicio.setHours(0, 0, 0, 0)
      fin.setHours(0, 0, 0, 0)
      rangos.push({ inicio, fin })
    }
  }

  const { data: bloqueadas } = await supabase
    .from('fechas_bloqueadas')
    .select('fecha_inicio, fecha_fin')
    .eq('propiedad_id', propiedadId)

  if (bloqueadas) {
    for (const b of bloqueadas) {
      const inicio = new Date(b.fecha_inicio)
      const fin = new Date(b.fecha_fin)
      inicio.setHours(0, 0, 0, 0)
      fin.setHours(0, 0, 0, 0)
      rangos.push({ inicio, fin })
    }
  }

  return rangos
}

export async function verificarDisponibilidad(
  propiedadId: string,
  fechaEntrada: Date,
  fechaSalida: Date
): Promise<VerificacionDisponibilidad> {
  const supabase = createAdminClient()

  const { data: reservasConflicto } = await supabase
    .from('reservas')
    .select('id')
    .eq('propiedad_id', propiedadId)
    .in('estado', ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO'])
    .lt('fecha_entrada', fechaSalida.toISOString())
    .gt('fecha_salida', fechaEntrada.toISOString())
    .limit(1)

  if (reservasConflicto && reservasConflicto.length > 0) {
    return {
      disponible: false,
      conflicto: {
        tipo: 'RESERVA_EXISTENTE',
        reservaId: reservasConflicto[0].id,
      },
    }
  }

  const { data: fechasBloqueadas } = await supabase
    .from('fechas_bloqueadas')
    .select('id')
    .eq('propiedad_id', propiedadId)
    .lt('fecha_inicio', fechaSalida.toISOString())
    .gt('fecha_fin', fechaEntrada.toISOString())
    .limit(1)

  if (fechasBloqueadas && fechasBloqueadas.length > 0) {
    return {
      disponible: false,
      conflicto: {
        tipo: 'FECHA_BLOQUEADA',
        fechaBloqueadaId: fechasBloqueadas[0].id,
      },
    }
  }

  return { disponible: true }
}
