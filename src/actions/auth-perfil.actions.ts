'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { goPost, GoAPIError } from '@/lib/go-api-client'
import { redirect } from 'next/navigation'

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

  try {
    await goPost('/api/v1/auth/completar-perfil', {
      nombre,
      apellido,
      cedula: numeroDocumento,
      tipoDocumento,
      telefono,
      codigoPais,
    })
  } catch (err) {
    if (err instanceof GoAPIError) {
      console.error('[completarPerfilGoogle] Error:', err.message)
      if (err.code === 'DUPLICATE_CEDULA' || err.message?.toLowerCase().includes('documento')) {
        return { error: 'Ya existe un usuario con ese número de documento' }
      }
      return { error: err.message || 'Error al guardar tus datos. Intenta de nuevo.' }
    }
    console.error('[completarPerfilGoogle] Error:', err)
    return { error: 'Error al guardar tus datos. Intenta de nuevo.' }
  }

  redirect('/')
}
