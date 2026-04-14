'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUsuarioAutenticado } from '@/lib/auth'
import { perfilSchema } from '@/lib/validations'
import { goGet, goPost, goPut, useGoBackend } from '@/lib/go-api-client'
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

  if (useGoBackend('perfil')) {
    try {
      await goPut('/api/v1/auth/perfil', datos)
      revalidatePath('/dashboard/perfil')
      return { exito: true }
    } catch (err: any) {
      return { error: err.message || 'Error al guardar los cambios' }
    }
  }

  try {
    const admin = createAdminClient()
    await admin
      .from('usuarios')
      .update({
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: datos.telefono || null,
        bio: datos.bio || null,
        metodo_pago_preferido: datos.metodoPagoPreferido || null,
        tiktok: datos.tiktok || null,
        instagram: datos.instagram || null,
      })
      .eq('id', user.id)
  } catch (err) {
    console.error('[actualizarPerfil] Error:', err instanceof Error ? err.message : err)
    return { error: 'Error al guardar los cambios' }
  }

  const supabase = await createClient()
  await supabase.auth.updateUser({
    data: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono || '',
    },
  })

  revalidatePath('/dashboard/perfil')
  return { exito: true }
}

export async function cambiarContrasena(formData: FormData) {
  const passwordNueva = formData.get('passwordNueva') as string
  const passwordActual = formData.get('passwordActual') as string

  if (!passwordNueva || passwordNueva.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  if (useGoBackend('perfil')) {
    try {
      await goPost('/api/v1/auth/password', { passwordNueva })
      return { exito: true }
    } catch (err: any) {
      return { error: err.message || 'Error al cambiar la contraseña' }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: passwordNueva,
  })

  if (error) {
    console.error('[cambiarContrasena] Error:', error.message)
    return { error: error.message || 'Error al cambiar la contraseña' }
  }

  return { exito: true }
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

  if (useGoBackend('perfil')) {
    try {
      const result = await goPost<{ ok: boolean; url: string }>('/api/v1/auth/avatar', formData)
      revalidatePath('/dashboard/perfil')
      return { exito: true, url: result.url }
    } catch (err: any) {
      return { error: err.message || 'Error al subir la imagen' }
    }
  }

  const admin = createAdminClient()

  const existingAvatar = formData.get('avatarUrl') as string | null
  if (existingAvatar) {
    try {
      const parts = existingAvatar.split('/storage/v1/object/public/imagenes/')
      if (parts[1]) {
        await admin.storage.from('imagenes').remove([parts[1].split('?')[0]])
      }
    } catch {}
  }

  const ext = file.name.split('.').pop() || 'webp'
  const path = `avatares/${user.id}/${Date.now()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await admin.storage
    .from('imagenes')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[subirAvatar] Upload error:', uploadError.message)
    return { error: 'Error al subir la imagen' }
  }

  const { data: urlData } = admin.storage.from('imagenes').getPublicUrl(path)
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await admin
    .from('usuarios')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('[subirAvatar] DB update error:', updateError.message)
    return { error: 'Error al actualizar el avatar' }
  }

  const supabase = await createClient()
  await supabase.auth.updateUser({
    data: { avatar_url: urlData.publicUrl },
  })

  revalidatePath('/dashboard/perfil')
  return { exito: true, url: publicUrl }
}
