'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { registroSchema, loginSchema, recuperacionSchema } from '@/lib/validations'
import { goPost, goFetch, GoAPIError } from '@/lib/go-api-client'

export async function enviarOtpEmail(email: string) {
  console.log('[enviarOtpEmail] Enviando OTP via backend')

  try {
    await goFetch('/api/v1/auth/otp/email', {
      method: 'POST',
      body: { email },
    })
  } catch (err) {
    if (err instanceof GoAPIError) {
      if (err.code === 'EMAIL_EXISTS') {
        return { error: 'Este correo ya está registrado. Inicia sesión o usa otro correo.' }
      }
      return { error: 'No pudimos enviar el código. Verifica tu correo e intenta de nuevo.' }
    }
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }

  console.log('[enviarOtpEmail] OTP enviado exitosamente')
  return { exito: true }
}

export async function enviarOtpSms(telefono: string, codigoPais: string) {
  console.log('[enviarOtpSms] Enviando OTP via backend')

  try {
    await goFetch('/api/v1/auth/otp/sms', {
      method: 'POST',
      body: { telefono, codigoPais },
    })
  } catch (err) {
    if (err instanceof GoAPIError) {
      return { error: 'No pudimos enviar el código SMS. Verifica el número e intenta de nuevo.' }
    }
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }

  console.log('[enviarOtpSms] OTP enviado exitosamente')
  return { exito: true }
}

export async function verificarOtpYRegistrar(formData: FormData) {
  try {
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
      otp: formData.get('otp') as string,
    }

    const validacion = registroSchema.safeParse(datos)
    if (!validacion.success) {
      return { error: validacion.error.issues[0].message }
    }

    if (!datos.otp || datos.otp.length < 6) {
      return { error: 'Ingresa el código de verificación' }
    }

    const result = await goFetch<{ ok: boolean; userId: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: datos,
    })

    if (!result.ok) {
      return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
    }

    const supabase = await createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: datos.email,
      password: datos.password,
    })

    if (loginError) {
      console.error('[registro] Auto-login error:', loginError.message)
      return { exito: true, requiereLogin: true }
    }

    return { exito: true }
  } catch (err) {
    if (err instanceof GoAPIError) {
      if (err.code === 'OTP_INVALID') {
        return { error: 'Código de verificación inválido. Intenta de nuevo.' }
      }
      if (err.code === 'EMAIL_EXISTS' || err.code === 'DUPLICATE') {
        return { error: 'Este correo ya está registrado. Inicia sesión o usa otro correo.' }
      }
      if (err.code === 'INVALID_PASSWORD') {
        return { error: err.message }
      }
      if (err.code === 'PASSWORD_MISMATCH') {
        return { error: 'Las contraseñas no coinciden.' }
      }
      return { error: err.message || 'No se pudo completar el registro.' }
    }
    console.error('[registro] Error completo:', err)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

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

export async function iniciarSesionAdmin(formData: FormData) {
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

  try {
    await goPost('/api/v1/auth/login-admin', {
      email: datos.email,
      password: datos.password,
    })
  } catch (err) {
    await supabase.auth.signOut()
    if (err instanceof GoAPIError) {
      return { error: 'No tienes permisos de administrador.' }
    }
    return { error: 'Error al verificar permisos de administrador.' }
  }

  redirect('/admin')
}

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function recuperarContrasena(formData: FormData) {
  const datos = {
    email: formData.get('email') as string,
  }

  const validacion = recuperacionSchema.safeParse(datos)
  if (!validacion.success) {
    return { error: validacion.error.issues[0].message }
  }

  try {
    await goFetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { email: datos.email },
    })
  } catch (err) {
    if (err instanceof GoAPIError) {
      console.error('[recuperarContrasena] Backend error:', { code: err.code, status: err.status, message: err.message })
      if (err.code === 'RATE_LIMITED') {
        return { error: 'Demasiados intentos. Espera un momento e intenta de nuevo.' }
      }
      return { error: err.message || 'No pudimos enviar el correo. Intenta de nuevo.' }
    }
    console.error('[recuperarContrasena] Error:', err)
    return { error: 'No pudimos enviar el correo. Intenta de nuevo.' }
  }

  return { exito: true, mensaje: 'Te enviamos un correo para restablecer tu contraseña.' }
}

export async function restablecerContrasena(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  try {
    const { goPut } = await import('@/lib/go-api-client')
    await goPut('/api/v1/auth/recovery-password', { password })
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      const goErr = err as { code?: string; status: number; message: string }
      console.error('[restablecerContrasena] Backend error:', { code: goErr.code, status: goErr.status, message: goErr.message })
      if (goErr.status === 401) {
        return { error: 'Sesión inválida. Solicita un nuevo enlace de recuperación.' }
      }
      return { error: goErr.message || 'No pudimos actualizar la contraseña. Intenta de nuevo.' }
    }
    console.error('[restablecerContrasena] Error:', err)
    return { error: 'No pudimos actualizar la contraseña. Intenta de nuevo.' }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()

  return { exito: true }
}
