import { getMisReservas } from '@/actions/reserva.actions'
import { MisReservasClient } from './mis-reservas-client'
import type { EstadoReserva } from '@/types'
import type { ReservaConPropiedad } from '@/types/reserva'

export default async function MisReservasPage() {
  const reservas = await getMisReservas()

  const proximas: ReservaConPropiedad[] = []
  const en_curso: ReservaConPropiedad[] = []
  const completadas: ReservaConPropiedad[] = []
  const canceladas: ReservaConPropiedad[] = []

  for (const r of reservas) {
    switch (r.estado as EstadoReserva) {
      case 'PENDIENTE':
      case 'CONFIRMADA':
        proximas.push(r)
        break
      case 'EN_CURSO':
        en_curso.push(r)
        break
      case 'COMPLETADA':
        completadas.push(r)
        break
      case 'CANCELADA_HUESPED':
      case 'CANCELADA_ANFITRION':
      case 'RECHAZADA':
        canceladas.push(r)
        break
    }
  }

  return <MisReservasClient reservas={{ proximas, en_curso, completadas, canceladas }} />
}
