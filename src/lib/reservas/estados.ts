import type { EstadoReserva } from '@/types'

const TRANSICIONES_PERMITIDAS: Record<EstadoReserva, EstadoReserva[]> = {
  PENDIENTE_PAGO: ['PENDIENTE_CONFIRMACION', 'ANULADA', 'CANCELADA_HUESPED'],
  PENDIENTE_CONFIRMACION: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA_HUESPED'],
  PENDIENTE: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA_HUESPED'],
  CONFIRMADA: ['EN_CURSO', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION'],
  EN_CURSO: ['COMPLETADA'],
  COMPLETADA: [],
  CANCELADA_HUESPED: [],
  CANCELADA_ANFITRION: [],
  RECHAZADA: [],
  ANULADA: [],
}

export function puedeTransicionar(
  estadoActual: EstadoReserva,
  estadoNuevo: EstadoReserva
): boolean {
  return TRANSICIONES_PERMITIDAS[estadoActual]?.includes(estadoNuevo) ?? false
}

export function obtenerErrorTransicion(
  estadoActual: EstadoReserva,
  estadoNuevo: EstadoReserva
): string {
  if (!puedeTransicionar(estadoActual, estadoNuevo)) {
    return `No es posible cambiar del estado '${estadoActual}' al estado '${estadoNuevo}'`
  }
  return ''
}

export function esEstadoFinal(estado: EstadoReserva): boolean {
  return (
    estado === 'COMPLETADA' ||
    estado === 'CANCELADA_HUESPED' ||
    estado === 'CANCELADA_ANFITRION' ||
    estado === 'RECHAZADA' ||
    estado === 'ANULADA'
  )
}

export function sePuedeCancelar(estado: EstadoReserva): boolean {
  return estado === 'PENDIENTE_PAGO' || estado === 'PENDIENTE' || estado === 'PENDIENTE_CONFIRMACION' || estado === 'CONFIRMADA'
}
