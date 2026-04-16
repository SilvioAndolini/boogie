import { getReservasRecibidas, getModosReserva } from '@/actions/reserva.actions'
import { ReservasRecibidasClient } from './reservas-recibidas-client'

export default async function ReservasRecibidasPage() {
  const [reservas, propiedades] = await Promise.all([
    getReservasRecibidas(),
    getModosReserva(),
  ])

  return <ReservasRecibidasClient reservas={reservas} propiedades={propiedades} />
}
