import type { PoliticaCancelacion } from '@/types'
import type { ReembolsoCalculado } from '@/types/reserva'

export async function calcularReembolsoCompleto(
  totalReserva: number,
  comisionPlataforma: number,
  politica: PoliticaCancelacion,
  fechaEntrada: Date
): Promise<ReembolsoCalculado> {
  try {
    const params = new URLSearchParams({
      total: String(totalReserva),
      comision: String(comisionPlataforma),
      politica,
      fechaEntrada: fechaEntrada.toISOString(),
    })
    const res = await fetch(`/api/reservas/calcular-reembolso?${params}`)
    if (res.ok) {
      const body = await res.json()
      const data = body?.data ?? body
      return data as ReembolsoCalculado
    }
  } catch {}
  return {
    totalReserva,
    comisionPlataforma,
    montoReembolsable: 0,
    montoNoReembolsable: totalReserva,
    porcentajeReembolso: 0,
    politicaAplicable: politica,
    diasAntesCheckIn: 0,
    mensaje: 'No aplica para reembolso segun la politica de cancelacion',
  }
}
