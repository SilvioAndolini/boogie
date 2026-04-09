import { getCotizacionEuro } from '@/lib/services/exchange-rate'
import { createClient } from '@/lib/supabase/server'
import { NavbarInner } from './navbar-inner'
import { NavbarSearchSlot } from './navbar-search-slot'

export async function Navbar() {
  const [cotizacion, supabase] = await Promise.all([
    getCotizacionEuro(),
    createClient(),
  ])

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const usuario = user
    ? {
        id: user.id,
        nombre: user.user_metadata?.nombre || '',
        apellido: user.user_metadata?.apellido || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      }
    : null

  const cotizacionData = cotizacion
    ? {
        tasa: cotizacion.tasa,
        fuente: cotizacion.fuente,
      }
    : null

  return (
    <NavbarInner cotizacionEuro={cotizacionData} usuario={usuario}>
      <NavbarSearchSlot />
    </NavbarInner>
  )
}