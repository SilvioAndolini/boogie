import type { EstadoReserva } from '@/types'

const TRANSICIONES_PERMITIDAS: Record<EstadoReserva, EstadoReserva[]> = {
  PENDIENTE: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA_HUESPED'],
  CONFIRMADA: ['EN_CURSO', 'CANCELADA_HUESPED', 'CANCELADA_ANFITRION'],
  EN_CURSO: ['COMPLETADA'],
  COMPLETADA: [],
  CANCELADA_HUESPED: [],
  CANCELADA_ANFITRION: [],
  RECHAZADA: [],
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
    estado === 'RECHAZADA'
  )
}

export function sePuedeCancelar(estado: EstadoReserva): boolean {
  return estado === 'PENDIENTE' || estado === 'CONFIRMADA'
}
