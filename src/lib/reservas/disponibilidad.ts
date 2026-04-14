import { goGet } from '@/lib/go-api-client'
import type { VerificacionDisponibilidad } from '@/types/reserva'

export interface FechaOcupada {
  inicio: string
  fin: string
  estado: string
}

export async function obtenerFechasOcupadas(
  propiedadId: string
): Promise<{ inicio: Date; fin: Date; estado: string }[]> {
  try {
    const data = await goGet<FechaOcupada[]>(
      `/api/v1/reservas/fechas-ocupadas?propiedadId=${propiedadId}`
    )
    if (!data) return []
    return data.map((r) => {
      const inicio = new Date(r.inicio)
      const fin = new Date(r.fin)
      inicio.setHours(0, 0, 0, 0)
      fin.setHours(0, 0, 0, 0)
      return { inicio, fin, estado: r.estado }
    })
  } catch {
    return []
  }
}

export async function verificarDisponibilidad(
  propiedadId: string,
  fechaEntrada: Date,
  fechaSalida: Date
): Promise<VerificacionDisponibilidad> {
  try {
    const data = await goGet<{ disponible: boolean }>(
      `/api/v1/reservas/disponibilidad?propiedadId=${propiedadId}&fechaEntrada=${fechaEntrada.toISOString()}&fechaSalida=${fechaSalida.toISOString()}`
    )
    if (!data || !data.disponible) {
      return { disponible: false }
    }
    return { disponible: true }
  } catch {
    return { disponible: false }
  }
}
