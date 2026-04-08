'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUsuarioAutenticado } from '@/lib/auth'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { isCeoEmail } from '@/lib/admin-constants'
import { adminRevisarVerificacionSchema, adminActualizarRolSchema } from '@/lib/admin-validations'
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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()
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
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    verificacionId: formData.get('verificacionId') as string,
    accion: formData.get('accion') as string,
    motivoRechazo: (formData.get('motivoRechazo') as string) || undefined,
  }

  const parsed = adminRevisarVerificacionSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Datos inválidos'
    return { error: firstError }
  }

  const { verificacionId, accion, motivoRechazo } = parsed.data

  const admin = createAdminClient()

  const updateData: Record<string, unknown> = {
    estado: accion,
    revisado_por: auth.userId,
    fecha_revision: new Date().toISOString(),
    fecha_actualizacion: new Date().toISOString(),
  }

  if (accion === 'RECHAZADA') {
    updateData.motivo_rechazo = motivoRechazo
  }

  const { data: verifBefore } = await admin
    .from('verificaciones_documento')
    .select('usuario_id')
    .eq('id', verificacionId)
    .single()

  const { error } = await admin
    .from('verificaciones_documento')
    .update(updateData)
    .eq('id', verificacionId)

  if (error) {
    console.error('[revisarVerificacion] Error:', error.message)
    return { error: 'Error al actualizar verificación' }
  }

  if (accion === 'APROBADA' && verifBefore) {
    await admin
      .from('usuarios')
      .update({ verificado: true })
      .eq('id', verifBefore.usuario_id)
  }

  await logAdminAction({
    accion: `VERIFICACION_${accion}`,
    entidad: 'verificacion',
    entidadId: verificacionId,
    detalles: { usuarioVerificado: verifBefore?.usuario_id, motivoRechazo },
  })

  revalidatePath('/admin/verificaciones')
  return { exito: true }
}

export async function getUsuariosAdmin() {
  const auth = await requireAdmin()
  if (auth.error) {
    console.error('[getUsuariosAdmin] Auth error:', auth.error)
    return { error: auth.error }
  }

  const admin = createAdminClient()

  const { data: perfiles, error } = await admin
    .from('usuarios')
    .select('*')
    .order('fecha_registro', { ascending: false })

  if (error) {
    console.error('[getUsuariosAdmin] Error:', error.message)
    return { error: 'Error al cargar usuarios' }
  }

  const perfilIds = new Set((perfiles || []).map((p) => p.id))

  let page = 1
  let allAuthUsers: { id: string; email?: string; user_metadata?: { nombre?: string; apellido?: string; telefono?: string } }[] = []
  let hasMore = true
  while (hasMore) {
    const { data: pageData } = await admin.auth.admin.listUsers({ page, perPage: 100 })
    const users = pageData?.users || []
    allAuthUsers = allAuthUsers.concat(users)
    hasMore = users.length === 100
    page++
  }

  const huerfanosAuth = allAuthUsers.filter((u) => !perfilIds.has(u.id) && u.id !== auth.userId)

  if (huerfanosAuth.length > 0) {
    console.log('[getUsuariosAdmin] Recuperando perfiles huérfanos de Auth:', huerfanosAuth.map((u) => u.email))

    for (const authUser of huerfanosAuth) {
      const { error: insertError } = await admin.from('usuarios').insert({
        id: authUser.id,
        email: authUser.email || '',
        nombre: authUser.user_metadata?.nombre || 'Sin',
        apellido: authUser.user_metadata?.apellido || 'nombre',
        telefono: authUser.user_metadata?.telefono || null,
        cedula: null,
        verificado: false,
        rol: 'BOOGER',
      }).select()

      if (insertError) {
        console.error('[getUsuariosAdmin] Error recuperando perfil:', authUser.email, insertError.message)
      }
    }

    if (huerfanosAuth.some((u) => !perfilIds.has(u.id))) {
      await logAdminAction({
        accion: 'RECUPERAR_PERFILES_AUTH',
        entidad: 'usuario',
        detalles: { recuperados: huerfanosAuth.map((u) => ({ id: u.id, email: u.email })) },
      })
    }
  }

  const perfilSinAuth = (perfiles || []).filter((p) => !allAuthUsers.some((au) => au.id === p.id))

  if (perfilSinAuth.length > 0) {
    console.log('[getUsuariosAdmin] Eliminando perfiles sin Auth:', perfilSinAuth.map((p) => p.email))

    const { error: deleteError } = await admin
      .from('usuarios')
      .delete()
      .in('id', perfilSinAuth.map((p) => p.id))

    if (!deleteError) {
      await logAdminAction({
        accion: 'LIMPIEZA_HUERFANOS',
        entidad: 'usuario',
        detalles: { eliminados: perfilSinAuth.map((p) => ({ id: p.id, email: p.email })) },
      })
    }
  }

  const { data: perfilesFinales, error: errorFinal } = await admin
    .from('usuarios')
    .select('*')
    .order('fecha_registro', { ascending: false })

  if (errorFinal) {
    return { error: 'Error al cargar usuarios' }
  }

  console.log('[getUsuariosAdmin] Usuarios finales:', perfilesFinales?.length ?? 0)
  return { usuarios: perfilesFinales, isCeo: auth.isCeo }
}

export async function actualizarRolUsuario(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const raw = {
    usuarioId: formData.get('usuarioId') as string,
    rol: (formData.get('rol') as string) || undefined,
    activo: (formData.get('activo') as string) || undefined,
  }

  const parsed = adminActualizarRolSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Datos inválidos'
    return { error: firstError }
  }

  const { usuarioId, rol, activo } = parsed.data

  if (usuarioId === auth.userId && rol && rol !== 'ADMIN') {
    return { error: 'No puedes quitarte tu propio rol de administrador' }
  }

  const admin = createAdminClient()
  const { data: before } = await admin
    .from('usuarios')
    .select('rol, activo, email')
    .eq('id', usuarioId)
    .single()

  if (isCeoEmail(before?.email)) {
    return { error: 'No puedes modificar al CEO' }
  }

  if (before?.rol === 'ADMIN' && !auth.isCeo) {
    return { error: 'Solo el CEO puede modificar otros administradores' }
  }

  const updateData: Record<string, unknown> = {}
  if (rol) updateData.rol = rol
  if (activo !== undefined) updateData.activo = activo === 'true'

  const { error } = await admin
    .from('usuarios')
    .update(updateData)
    .eq('id', usuarioId)

  if (error) {
    console.error('[actualizarRolUsuario] Error:', error.message)
    return { error: 'Error al actualizar usuario' }
  }

  const accionDesc = []
  if (rol && rol !== before?.rol) accionDesc.push(`ROL:${before?.rol}→${rol}`)
  if (activo !== undefined) accionDesc.push(activo === 'true' ? 'REACTIVADO' : 'SUSPENDIDO')

  await logAdminAction({
    accion: accionDesc.join(', '),
    entidad: 'usuario',
    entidadId: usuarioId,
    detalles: { antes: before, despues: updateData },
  })

  revalidatePath('/admin/usuarios')
  return { exito: true }
}

export async function eliminarUsuarioAdmin(formData: FormData) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const usuarioId = formData.get('usuarioId') as string
  if (!usuarioId) return { error: 'ID de usuario requerido' }

  if (usuarioId === auth.userId) {
    return { error: 'No puedes eliminar tu propia cuenta' }
  }

  const admin = createAdminClient()

  const { data: perfil } = await admin
    .from('usuarios')
    .select('email, nombre, apellido, rol')
    .eq('id', usuarioId)
    .single()

  if (isCeoEmail(perfil?.email)) {
    return { error: 'No puedes eliminar al CEO' }
  }

  if (perfil?.rol === 'ADMIN' && !auth.isCeo) {
    return { error: 'Solo el CEO puede eliminar otros administradores' }
  }

  const { error: perfilError } = await admin
    .from('usuarios')
    .delete()
    .eq('id', usuarioId)

  if (perfilError) {
    console.error('[eliminarUsuarioAdmin] Error eliminando perfil:', perfilError.message)
    return { error: 'Error al eliminar el perfil' }
  }

  const { error: authError } = await admin.auth.admin.deleteUser(usuarioId)

  if (authError) {
    console.error('[eliminarUsuarioAdmin] Error eliminando auth user:', authError.message)
  }

  await logAdminAction({
    accion: 'ELIMINAR_USUARIO',
    entidad: 'usuario',
    entidadId: usuarioId,
    detalles: {
      email: perfil?.email,
      nombre: perfil ? `${perfil.nombre} ${perfil.apellido}` : null,
      rol: perfil?.rol,
      authEliminado: !authError,
    },
  })

  revalidatePath('/admin/usuarios')
  return { exito: true }
}

export async function getAdminCounts() {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const admin = createAdminClient()

  const [verifPendientes, reservasPendientes, pagosPendientes] = await Promise.all([
    admin.from('verificaciones_documento').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
    admin.from('reservas').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
    admin.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
  ])

  return {
    verificacionesPendientes: verifPendientes.count ?? 0,
    reservasPendientes: reservasPendientes.count ?? 0,
    pagosPendientes: pagosPendientes.count ?? 0,
  }
}
