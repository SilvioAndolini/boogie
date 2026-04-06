// Cálculos de precios para la aplicación Boogie

import { COMISION_PLATAFORMA_HUESPED, COMISION_PLATAFORMA_ANFITRION } from './constants'
import { calcularNoches } from './format'

/**
 * Calcula el desglose de precios de una reserva
 */
export function calcularPrecioReserva(
  precioPorNoche: number,
  fechaEntrada: Date,
  fechaSalida: Date
) {
  const noches = calcularNoches(fechaEntrada, fechaSalida)
  const subtotal = precioPorNoche * noches
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
  }
}

/**
 * Calcula el reembolso según la política de cancelación
 */
export function calcularReembolso(
  total: number,
  fechaEntrada: Date,
  politica: 'FLEXIBLE' | 'MODERADA' | 'ESTRICTA'
): { reembolso: number; porcentaje: number } {
  const hoy = new Date()
  const diasAntes = Math.ceil(
    (fechaEntrada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  )

  switch (politica) {
    case 'FLEXIBLE':
      if (diasAntes >= 1) return { reembolso: total, porcentaje: 100 }
      return { reembolso: 0, porcentaje: 0 }
    case 'MODERADA':
      if (diasAntes >= 5) return { reembolso: total, porcentaje: 100 }
      if (diasAntes >= 1) return { reembolso: total * 0.5, porcentaje: 50 }
      return { reembolso: 0, porcentaje: 0 }
    case 'ESTRICTA':
      if (diasAntes >= 14) return { reembolso: total, porcentaje: 100 }
      if (diasAntes >= 7) return { reembolso: total * 0.5, porcentaje: 50 }
      return { reembolso: 0, porcentaje: 0 }
  }
}
