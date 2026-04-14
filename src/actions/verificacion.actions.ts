'use server'

import { goApi, goGet, goPost, goPatch, goDelete, GoAPIError } from '@/lib/go-api-client'
import { getUsuarioAutenticado } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getVerificacionUsuario() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const verificacion = await goGet<Record<string, unknown>>('/api/v1/verificacion')
    return { verificacion }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al consultar verificación' }
  }
}

export async function iniciarVerificacionMetaMap() {
  const user = await getUsuarioAutenticado()
  if (!user) return { error: 'No autenticado' }

  try {
    const verificacion = await goPost<Record<string, unknown>>('/api/v1/verificacion/iniciar-metamap')
    return { verificacion }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al crear verificación' }
  }
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
  const timestamp = Date.now()

  const uploadImage = async (file: File, suffix: string) => {
    const ext = file.name.split('.').pop() || 'webp'
    const path = `verificaciones/${user.id}/${timestamp}_${suffix}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await admin.storage
      .from('imagenes')
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (uploadError) return null
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

  try {
    const verificacion = await goPost<Record<string, unknown>>('/api/v1/verificacion/subir-documento', {
      fotoFrontalUrl,
      fotoTraseraUrl,
      fotoSelfieUrl,
    })
    revalidatePath('/dashboard/verificar-identidad')
    return { verificacion }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al registrar verificación' }
  }
}

export async function getVerificacionesPendientes() {
  try {
    const verificaciones = await goGet<Array<Record<string, unknown>>>('/api/v1/admin/verificaciones')
    return { verificaciones }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar verificaciones' }
  }
}

export async function revisarVerificacion(formData: FormData) {
  const verificacionId = formData.get('verificacionId') as string
  const accion = formData.get('accion') as string
  const motivoRechazo = (formData.get('motivoRechazo') as string) || undefined

  try {
    await goPost(`/api/v1/admin/verificaciones/${verificacionId}/revisar`, {
      accion,
      motivoRechazo,
    })
    revalidatePath('/admin/verificaciones')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar verificación' }
  }
}

type UsuariosResult = {
  data?: Array<Record<string, unknown>>;
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  error?: string;
}

type AdminCountsResult = {
  verificacionesPendientes?: number;
  reservasPendientes?: number;
  pagosPendientes?: number;
  error?: string;
}

export async function getUsuariosAdmin(): Promise<UsuariosResult> {
  try {
    const outer = await goApi<Record<string, unknown>>('/api/v1/admin/usuarios', { raw: true })
    const raw = (outer?.data ?? outer) as Record<string, unknown>
    return {
      data: (raw?.data ?? []) as Array<Record<string, unknown>>,
      total: (raw?.total ?? 0) as number,
      pagina: (raw?.pagina ?? 1) as number,
      totalPaginas: (raw?.totalPaginas ?? 0) as number,
    }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar usuarios' }
  }
}

export async function actualizarRolUsuario(formData: FormData) {
  const usuarioId = formData.get('usuarioId') as string
  const rol = (formData.get('rol') as string) || undefined
  const activo = (formData.get('activo') as string) || undefined
  const plan = (formData.get('plan') as string) || undefined
  const reputacion = (formData.get('reputacion') as string) || undefined
  const reputacion_manual = (formData.get('reputacion_manual') as string) || undefined

  const body: Record<string, unknown> = {}
  if (rol) body.rol = rol
  if (activo !== undefined) body.activo = activo === 'true'
  if (plan) body.plan = plan
  if (reputacion) body.reputacion = parseFloat(reputacion)
  if (reputacion_manual) body.reputacion_manual = reputacion_manual

  try {
    await goPatch(`/api/v1/admin/usuarios/${usuarioId}`, body)
    revalidatePath('/admin/usuarios')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al actualizar usuario' }
  }
}

export async function eliminarUsuarioAdmin(formData: FormData) {
  const usuarioId = formData.get('usuarioId') as string
  if (!usuarioId) return { error: 'ID de usuario requerido' }

  try {
    await goDelete(`/api/v1/admin/usuarios/${usuarioId}`)
    revalidatePath('/admin/usuarios')
    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al eliminar usuario' }
  }
}

export async function getAdminCounts(): Promise<AdminCountsResult> {
  try {
    return await goGet<{
      verificacionesPendientes: number;
      reservasPendientes: number;
      pagosPendientes: number;
    }>('/api/v1/admin/counts')
  } catch (err) {
    if (err instanceof GoAPIError) return { error: err.message }
    return { error: 'Error al cargar conteos' }
  }
}
