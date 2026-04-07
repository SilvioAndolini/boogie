import { calcularNoches } from '@/lib/format'
import { COMISION_PLATAFORMA_HUESPED, COMISION_PLATAFORMA_ANFITRION } from '@/lib/constants'
import type { PoliticaCancelacion, Moneda } from '@/types'
import type { ReembolsoCalculado, PrecioReserva } from '@/types/reserva'

export function calcularPrecioReserva(
  precioPorNoche: number,
  fechaEntrada: Date,
  fechaSalida: Date,
  moneda: Moneda = 'USD'
): PrecioReserva {
  const noches = calcularNoches(fechaEntrada, fechaSalida)
  const subtotal = Math.round(precioPorNoche * noches * 100) / 100
  const comisionHuesped = Math.round(subtotal * COMISION_PLATAFORMA_HUESPED * 100) / 100
  const comisionAnfitrion = Math.round(subtotal * COMISION_PLATAFORMA_ANFITRION * 100) / 100
  const total = Math.round((subtotal + comisionHuesped) * 100) / 100

  return {
    noches,
    precioPorNoche,
    subtotal,
    comisionHuesped,
    comisionAnfitrion,
    total,
    moneda,
  }
}

export function calcularReembolsoCompleto(
  totalReserva: number,
  comisionPlataforma: number,
  politica: PoliticaCancelacion,
  fechaEntrada: Date
): ReembolsoCalculado {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const fechaCheckIn = new Date(fechaEntrada)
  fechaCheckIn.setHours(14, 0, 0, 0)

  const diffTime = fechaCheckIn.getTime() - hoy.getTime()
  const diasAntes = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let porcentajeReembolso = 0
  let montoReembolsable = 0

  switch (politica) {
    case 'FLEXIBLE':
      if (diasAntes >= 1) {
        porcentajeReembolso = 100
        montoReembolsable = totalReserva - comisionPlataforma
      }
      break

    case 'MODERADA':
      if (diasAntes >= 5) {
        porcentajeReembolso = 100
        montoReembolsable = totalReserva - comisionPlataforma
      } else if (diasAntes >= 1) {
        porcentajeReembolso = 50
        montoReembolsable = (totalReserva * 0.5) - comisionPlataforma
      }
      break

    case 'ESTRICTA':
      if (diasAntes >= 14) {
        porcentajeReembolso = 100
        montoReembolsable = totalReserva - comisionPlataforma
      } else if (diasAntes >= 7) {
        porcentajeReembolso = 50
        montoReembolsable = (totalReserva * 0.5) - comisionPlataforma
      }
      break
  }

  montoReembolsable = Math.max(0, Math.round(montoReembolsable * 100) / 100)

  let mensaje = ''
  if (porcentajeReembolso === 100) {
    mensaje = `Reembolso completo de ${formatearMonto(montoReembolsable)}`
  } else if (porcentajeReembolso > 0) {
    mensaje = `Reembolso parcial del ${porcentajeReembolso}%: ${formatearMonto(montoReembolsable)}`
  } else {
    mensaje = 'No aplica para reembolso según la política de cancelación'
  }

  return {
    totalReserva,
    comisionPlataforma,
    montoReembolsable,
    montoNoReembolsable: Math.round((totalReserva - montoReembolsable) * 100) / 100,
    porcentajeReembolso,
    politicaAplicable: politica,
    diasAntesCheckIn: diasAntes,
    mensaje,
  }
}

function formatearMonto(monto: number): string {
  return `$${monto.toFixed(2)}`
}
