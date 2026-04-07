import { getReservasRecibidas } from '@/actions/reserva.actions'
import { ReservasRecibidasClient } from './reservas-recibidas-client'

export default async function ReservasRecibidasPage() {
  const reservas = await getReservasRecibidas()

  return <ReservasRecibidasClient reservas={reservas} />
}
