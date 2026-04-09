'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

function normalizarCedula(valor: string): string {
  const limpio = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (/^[VEPGJ]/.test(limpio)) return limpio.charAt(0) + '-' + limpio.slice(1)
  return 'V-' + limpio
}

export async function completarPerfilGoogle(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'Debes iniciar sesión' }

  const nombre = (formData.get('nombre') as string)?.trim()
  const apellido = (formData.get('apellido') as string)?.trim()
  const tipoDocumento = formData.get('tipoDocumento') as 'CEDULA' | 'PASAPORTE'
  const numeroDocumento = (formData.get('numeroDocumento') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim()
  const codigoPais = (formData.get('codigoPais') as string) || '+58'

  if (!nombre || nombre.length < 2) return { error: 'Ingresa tu nombre' }
  if (!apellido || apellido.length < 2) return { error: 'Ingresa tu apellido' }
  if (!numeroDocumento || numeroDocumento.length < 4) return { error: 'Ingresa tu número de documento' }
  if (!telefono || telefono.length < 7) return { error: 'Ingresa tu número de teléfono' }

  const documento = tipoDocumento === 'CEDULA'
    ? normalizarCedula(numeroDocumento)
    : numeroDocumento.toUpperCase()

  const telefonoCompleto = `${codigoPais}${telefono.replace(/\D/g, '')}`

  const admin = createAdminClient()

  const { data: existingCedula } = await admin
    .from('usuarios')
    .select('id')
    .eq('cedula', documento)
    .maybeSingle()

  if (existingCedula && existingCedula.id !== user.id) {
    return { error: 'Ya existe un usuario con ese número de documento' }
  }

  const { error: updateError } = await admin
    .from('usuarios')
    .update({
      nombre,
      apellido,
      cedula: documento,
      telefono: telefonoCompleto,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('[completarPerfilGoogle] Error:', updateError.message)
    return { error: 'Error al guardar tus datos. Intenta de nuevo.' }
  }

  redirect('/')
}
