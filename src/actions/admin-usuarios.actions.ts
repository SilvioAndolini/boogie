'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { adminRegistroUsuarioSchema } from '@/lib/admin-validations'

function normalizarCedula(valor: string): string {
  const limpio = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (/^[VEPGJ]/.test(limpio)) return limpio.charAt(0) + '-' + limpio.slice(1)
  return 'V-' + limpio
}

export async function registrarUsuarioAdmin(formData: FormData) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) return { error: adminCheck.error }

  const datos = {
    nombre: formData.get('nombre') as string,
    apellido: formData.get('apellido') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    tipoDocumento: formData.get('tipoDocumento') as 'CEDULA' | 'PASAPORTE',
    numeroDocumento: formData.get('numeroDocumento') as string,
    telefono: formData.get('telefono') as string,
    codigoPais: (formData.get('codigoPais') as string) || '+58',
    rol: formData.get('rol') as 'BOOGER' | 'ANFITRION' | 'AMBOS' | 'ADMIN',
  }

  const validacion = adminRegistroUsuarioSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const admin = createAdminClient()

  const { data: existingUser } = await admin
    .from('usuarios')
    .select('id')
    .eq('email', datos.email)
    .maybeSingle()

  if (existingUser) {
    return { error: 'Ya existe un usuario con ese correo electrónico.' }
  }

  const documento = datos.tipoDocumento === 'CEDULA'
    ? normalizarCedula(datos.numeroDocumento)
    : datos.numeroDocumento.toUpperCase()

  const { data: existingCedula } = await admin
    .from('usuarios')
    .select('id')
    .eq('cedula', documento)
    .maybeSingle()

  if (existingCedula) {
    return { error: 'Ya existe un usuario con ese número de documento.' }
  }

  const telefonoCompleto = `${datos.codigoPais}${datos.telefono.replace(/\D/g, '')}`

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: datos.email,
    password: datos.password,
    email_confirm: true,
    user_metadata: {
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: telefonoCompleto,
    },
  })

  if (authError) {
    console.error('[registrarUsuarioAdmin] Auth error:', authError.message)
    return { error: `Error creando usuario: ${authError.message}` }
  }

  const userId = authData.user?.id
  if (!userId) {
    return { error: 'Error inesperado creando el usuario.' }
  }

  const { error: perfilError } = await admin.from('usuarios').insert({
    id: userId,
    email: datos.email,
    nombre: datos.nombre,
    apellido: datos.apellido,
    telefono: telefonoCompleto,
    cedula: documento,
    verificado: false,
    rol: datos.rol,
  })

  if (perfilError) {
    console.error('[registrarUsuarioAdmin] Perfil error:', perfilError.message)
    await admin.auth.admin.deleteUser(userId)
    return { error: 'Error creando el perfil del usuario.' }
  }

  await logAdminAction({
    accion: 'REGISTRAR_USUARIO',
    entidad: 'usuario',
    entidadId: userId,
    detalles: {
      email: datos.email,
      nombre: `${datos.nombre} ${datos.apellido}`,
      cedula: documento,
      rol: datos.rol,
    },
  })

  return { exito: true, usuarioId: userId }
}
