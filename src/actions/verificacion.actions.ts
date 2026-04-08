'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getVerificacionUsuario() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('verificaciones_documento')
    .select('*')
    .eq('usuario_id', user.id)
    .order('fecha_creacion', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getVerificacionUsuario] Error:', error.message)
    return { error: 'Error al consultar verificación' }
  }

  return { verificacion: data }
}

export async function iniciarVerificacionMetaMap() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('verificaciones_documento')
    .select('id, estado')
    .eq('usuario_id', user.id)
    .in('estado', ['PENDIENTE', 'EN_PROCESO', 'APROBADA'])
    .maybeSingle()

  if (existente) {
    if (existente.estado === 'APROBADA') return { error: 'Ya estás verificado' }
    return { error: 'Ya tienes una verificación en proceso' }
  }

  const { data, error } = await admin
    .from('verificaciones_documento')
    .insert({
      usuario_id: user.id,
      metodo: 'METAMAP',
      estado: 'PENDIENTE',
    })
    .select()
    .single()

  if (error) {
    console.error('[iniciarVerificacionMetaMap] Error:', error.message)
    return { error: 'Error al crear verificación' }
  }

  return { verificacion: data }
}

export async function subirDocumentoManual(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const fotoFrontal = formData.get('fotoFrontal') as File | null
  const fotoTrasera = formData.get('fotoTrasera') as File | null
  const fotoSelfie = formData.get('fotoSelfie') as File | null

  if (!fotoFrontal || !fotoTrasera || !fotoSelfie) {
    return { error: 'Debes subir las 3 fotos del documento' }
  }

  const admin = createAdminClient()

  const { data: existente } = await admin
    .from('verificaciones_documento')
    .select('id, estado')
    .eq('usuario_id', user.id)
    .in('estado', ['PENDIENTE', 'EN_PROCESO', 'APROBADA'])
    .maybeSingle()

  if (existente) {
    if (existente.estado === 'APROBADA') return { error: 'Ya estás verificado' }
    return { error: 'Ya tienes una verificación en proceso' }
  }

  const timestamp = Date.now()
  const uploadImage = async (file: File, suffix: string) => {
    const ext = file.name.split('.').pop() || 'webp'
    const path = `verificaciones/${user.id}/${timestamp}_${suffix}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage
      .from('imagenes')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[subirDocumentoManual] Upload error:', uploadError.message)
      return null
    }

    const { data: urlData } = admin.storage.from('imagenes').getPublicUrl(path)
    return urlData.publicUrl
  }

  const [fotoFrontalUrl, fotoTraseraUrl, fotoSelfieUrl] = await Promise.all([
    uploadImage(fotoFrontal, 'frontal'),
    uploadImage(fotoTrasera, 'trasera'),
    uploadImage(fotoSelfie, 'selfie'),
  ])

  if (!fotoFrontalUrl || !fotoTraseraUrl || !fotoSelfieUrl) {
    return { error: 'Error al subir las imágenes. Intenta de nuevo.' }
  }

  const { data, error } = await admin
    .from('verificaciones_documento')
    .insert({
      usuario_id: user.id,
      metodo: 'MANUAL',
      estado: 'PENDIENTE',
      foto_frontal_url: fotoFrontalUrl,
      foto_trasera_url: fotoTraseraUrl,
      foto_selfie_url: fotoSelfieUrl,
    })
    .select()
    .single()

  if (error) {
    console.error('[subirDocumentoManual] Insert error:', error.message)
    return { error: 'Error al registrar verificación' }
  }

  revalidatePath('/dashboard/verificar-identidad')
  return { verificacion: data }
}

export async function getVerificacionesPendientes() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    return { error: 'Sin permisos de administrador' }
  }

  const { data, error } = await admin
    .from('verificaciones_documento')
    .select(`
      *,
      usuario:usuarios!verificaciones_documento_usuario_id_fkey (
        id, nombre, apellido, email, cedula, telefono
      )
    `)
    .order('fecha_creacion', { ascending: false })

  if (error) {
    console.error('[getVerificacionesPendientes] Error:', error.message)
    return { error: 'Error al cargar verificaciones' }
  }

  return { verificaciones: data }
}

export async function revisarVerificacion(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    return { error: 'Sin permisos de administrador' }
  }

  const verificacionId = formData.get('verificacionId') as string
  const accion = formData.get('accion') as 'APROBADA' | 'RECHAZADA'
  const motivoRechazo = formData.get('motivoRechazo') as string | null

  if (!verificacionId || !accion) {
    return { error: 'Datos incompletos' }
  }

  if (accion === 'RECHAZADA' && !motivoRechazo) {
    return { error: 'Debes indicar el motivo del rechazo' }
  }

  const updateData: Record<string, unknown> = {
    estado: accion,
    revisado_por: user.id,
    fecha_revision: new Date().toISOString(),
    fecha_actualizacion: new Date().toISOString(),
  }

  if (accion === 'RECHAZADA') {
    updateData.motivo_rechazo = motivoRechazo
  }

  const { error } = await admin
    .from('verificaciones_documento')
    .update(updateData)
    .eq('id', verificacionId)

  if (error) {
    console.error('[revisarVerificacion] Error:', error.message)
    return { error: 'Error al actualizar verificación' }
  }

  if (accion === 'APROBADA') {
    const { data: verificacion } = await admin
      .from('verificaciones_documento')
      .select('usuario_id')
      .eq('id', verificacionId)
      .single()

    if (verificacion) {
      await admin
        .from('usuarios')
        .update({ verificado: true })
        .eq('id', verificacion.usuario_id)
    }
  }

  revalidatePath('/admin/verificaciones')
  return { exito: true }
}

export async function getUsuariosAdmin() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    return { error: 'Sin permisos de administrador' }
  }

  const { data, error } = await admin
    .from('usuarios')
    .select('*')
    .order('fecha_registro', { ascending: false })

  if (error) {
    console.error('[getUsuariosAdmin] Error:', error.message)
    return { error: 'Error al cargar usuarios' }
  }

  return { usuarios: data }
}

export async function actualizarRolUsuario(formData: FormData) {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    return { error: 'Sin permisos de administrador' }
  }

  const usuarioId = formData.get('usuarioId') as string
  const nuevoRol = formData.get('rol') as string
  const activo = formData.get('activo') as string | null

  if (!usuarioId) return { error: 'ID de usuario requerido' }

  const updateData: Record<string, unknown> = {}
  if (nuevoRol) updateData.rol = nuevoRol
  if (activo !== null) updateData.activo = activo === 'true'

  const { error } = await admin
    .from('usuarios')
    .update(updateData)
    .eq('id', usuarioId)

  if (error) {
    console.error('[actualizarRolUsuario] Error:', error.message)
    return { error: 'Error al actualizar usuario' }
  }

  revalidatePath('/admin/usuarios')
  return { exito: true }
}
