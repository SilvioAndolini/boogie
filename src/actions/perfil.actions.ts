'use server'

import { getUsuarioAutenticado } from '@/lib/auth'
import { perfilSchema } from '@/lib/validations'
import { goGet, goPost, goPut } from '@/lib/go-api-client'
import { revalidatePath } from 'next/cache'

const AVATAR_MAX_SIZE = 2 * 1024 * 1024
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function getPerfilUsuario() {
  const user = await getUsuarioAutenticado()
  if (!user) {
    console.error('[getPerfilUsuario] No hay usuario autenticado')
    return { error: 'No autenticado' }
  }

  try {
    const perfil = await goGet('/api/v1/auth/me')
    return { perfil }
  } catch (err) {
    console.error('[getPerfilUsuario] Go API error:', err instanceof Error ? err.message : err)
    return { error: 'Error al cargar perfil' }
  }
}

export async function actualizarPerfil(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const datos = {
    nombre: formData.get('nombre') as string,
    apellido: formData.get('apellido') as string,
    telefono: (formData.get('telefono') as string) || undefined,
    bio: (formData.get('bio') as string) || undefined,
    metodoPagoPreferido: (formData.get('metodoPagoPreferido') as string) || undefined,
    tiktok: (formData.get('tiktok') as string) || undefined,
    instagram: (formData.get('instagram') as string) || undefined,
  }

  const validacion = perfilSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  try {
    await goPut('/api/v1/auth/perfil', datos)
    revalidatePath('/dashboard/perfil')
    return { exito: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al guardar los cambios' }
  }
}

export async function cambiarContrasena(formData: FormData) {
  const passwordNueva = formData.get('passwordNueva') as string
  const passwordActual = formData.get('passwordActual') as string

  if (!passwordNueva || passwordNueva.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  try {
    await goPost('/api/v1/auth/password', { passwordNueva })
    return { exito: true }
  } catch (err: unknown) {
    return { error: err.message || 'Error al cambiar la contraseña' }
  }
}

export async function subirAvatar(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const file = formData.get('avatar') as File | null
  if (!file) return { error: 'No se seleccionó ninguna imagen' }

  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Formato no permitido. Usa JPG, PNG o WebP' }
  }

  if (file.size > AVATAR_MAX_SIZE) {
    return { error: 'La imagen no debe superar 2 MB' }
  }

  try {
    const result = await goPost<{ ok: boolean; url: string }>('/api/v1/auth/avatar', formData)
    revalidatePath('/dashboard/perfil')
    return { exito: true, url: result.url }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al subir la imagen' }
  }
}
