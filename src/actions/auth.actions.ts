// Acciones del servidor para autenticación
'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { registroSchema, loginSchema, recuperacionSchema } from '@/lib/validations'

export async function registrarUsuario(formData: FormData) {
  try {
    const datos = {
      nombre: formData.get('nombre') as string,
      apellido: formData.get('apellido') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
      telefono: (formData.get('telefono') as string) || undefined,
    }

    const validacion = registroSchema.safeParse(datos)
    if (!validacion.success) {
      return { error: validacion.error.issues[0].message }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          telefono: datos.telefono,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user) {
      const admin = createAdminClient()
      const { error: perfilError } = await admin.from('usuarios').insert({
        id: data.user.id,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: datos.telefono,
      })
      if (perfilError) {
        console.error('[registro] Error creando perfil:', perfilError.message)
      }
    }

    redirect('/verificar-email')
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error('[registro] Error completo:', err)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export async function iniciarSesion(formData: FormData) {
  const datos = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validacion = loginSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: datos.email,
    password: datos.password,
  })

  if (error) {
    return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
  }

  redirect('/dashboard')
}

/**
 * Cierra la sesión del usuario
 */
export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Envía correo de recuperación de contraseña
 */
export async function recuperarContrasena(formData: FormData) {
  const datos = {
    email: formData.get('email') as string,
  }

  const validacion = recuperacionSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(datos.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/recuperar-contrasena`,
  })

  if (error) {
    return { error: 'No pudimos enviar el correo. Intenta de nuevo.' }
  }

  return { exito: true, mensaje: 'Te enviamos un correo para restablecer tu contraseña.' }
}
