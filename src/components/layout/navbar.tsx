import { getCotizacionEuro } from '@/lib/services/exchange-rate'
import { createClient } from '@/lib/supabase/server'
import { NavbarInner } from './navbar-inner'
import { NavbarSearchSlot } from './navbar-search-slot'

export async function Navbar() {
  let cotizacion = null
  let usuario = null

  try {
    const [cotizacionResult, supabase] = await Promise.all([
      getCotizacionEuro(),
      createClient(),
    ])

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      usuario = {
        id: user.id,
        nombre: user.user_metadata?.nombre || '',
        apellido: user.user_metadata?.apellido || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      }
    }

    if (cotizacionResult) {
      cotizacion = {
        tasa: cotizacionResult.tasa,
        fuente: cotizacionResult.fuente,
      }
    }
  } catch (err) {
    console.error('[Navbar] Error loading data:', err)
  }

  return (
    <NavbarInner cotizacionEuro={cotizacion} usuario={usuario}>
      <NavbarSearchSlot />
    </NavbarInner>
  )
}