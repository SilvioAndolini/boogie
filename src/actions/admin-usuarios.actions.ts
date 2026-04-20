'use server'

import * as Sentry from '@sentry/nextjs'

import { goPost, GoAPIError } from '@/lib/go-api-client'
import { requireAdmin } from '@/lib/admin-auth'

export async function registrarUsuarioAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const datos = {
    nombre: formData.get('nombre') as string,
    apellido: formData.get('apellido') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    tipoDocumento: formData.get('tipoDocumento') as string,
    numeroDocumento: formData.get('numeroDocumento') as string,
    telefono: formData.get('telefono') as string,
    codigoPais: (formData.get('codigoPais') as string) || '+58',
    rol: formData.get('rol') as string,
  }

  try {
    await goPost('/api/v1/admin/usuarios', datos) as { ok?: boolean; mensaje?: string }
    return { exito: true }
  } catch (err) {
      Sentry.captureException(err)
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al registrar usuario' }
  }
}
