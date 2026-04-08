'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { registroSchema, loginSchema, recuperacionSchema } from '@/lib/validations'
import { isDevPhone } from '@/lib/constants'

function normalizarCedula(valor: string): string {
  const limpio = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  if (/^[VEPGJ]/.test(limpio)) return limpio.charAt(0) + '-' + limpio.slice(1)
  return 'V-' + limpio
}

export async function enviarOtpEmail(email: string) {
  console.log('[enviarOtpEmail] Enviando OTP a:', email)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
  })

  if (error) {
    console.error('[enviarOtpEmail] Error:', JSON.stringify({ message: error.message, status: error.status }))
    return { error: `No pudimos enviar el código (${error.message}). Verifica tu correo e intenta de nuevo.` }
  }

  console.log('[enviarOtpEmail] OTP enviado exitosamente a:', email)
  return { exito: true }
}

export async function enviarOtpSms(telefono: string, codigoPais: string) {
  const telefonoLimpio = telefono.replace(/\D/g, '')
  const telefonoCompleto = `${codigoPais}${telefonoLimpio}`

  console.log('[enviarOtpSms] Enviando OTP a:', telefonoCompleto)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    phone: telefonoCompleto,
  })

  if (error) {
    console.error('[enviarOtpSms] Error completo:', JSON.stringify({ message: error.message, status: error.status, name: error.name }))
    return { error: `No pudimos enviar el código SMS (${error.message}). Verifica el número e intenta de nuevo.` }
  }

  console.log('[enviarOtpSms] OTP enviado exitosamente a:', telefonoCompleto)
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
      tipoDocumento: formData.get('tipoDocumento') as 'CEDULA' | 'PASAPORTE',
      numeroDocumento: formData.get('numeroDocumento') as string,
      telefono: formData.get('telefono') as string,
      codigoPais: (formData.get('codigoPais') as string) || '+58',
    }

    const validacion = registroSchema.safeParse(datos)
    if (!validacion.success) {
      return { error: validacion.error.issues[0].message }
    }

    const otp = formData.get('otp') as string
    if (!otp || otp.length < 6) {
      return { error: 'Ingresa el código de verificación' }
    }

    const supabase = await createClient()

    const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
      email: datos.email,
      token: otp,
      type: 'email',
    })

    if (otpError) {
      console.error('[registro] OTP error:', otpError.message)
      return { error: 'Código de verificación inválido. Intenta de nuevo.' }
    }

    const userId = otpData.user?.id
    if (!userId) {
      console.error('[registro] No se obtuvo user ID del OTP')
      return { error: 'Error de verificación. Intenta de nuevo.' }
    }

    const admin = createAdminClient()
    const telefonoCompleto = `${datos.codigoPais}${datos.telefono.replace(/\D/g, '')}`

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: datos.password,
      email_confirm: true,
      user_metadata: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: telefonoCompleto,
      },
    })

    if (updateError) {
      console.error('[registro] updateError:', updateError.message)
      return { error: updateError.message }
    }

    /*
     * ⚠️ DEV_PHONE_EXCEPTION — ELIMINAR ANTES DE PRODUCCIÓN
     */
    const devException = isDevPhone(datos.telefono)
    const documento = datos.tipoDocumento === 'CEDULA'
      ? normalizarCedula(datos.numeroDocumento)
      : datos.numeroDocumento.toUpperCase()

    if (devException) {
      const { data: existingCedula } = await admin
        .from('usuarios')
        .select('id')
        .eq('cedula', documento)
        .maybeSingle()

      const { error: perfilError } = await admin.from('usuarios').insert({
        id: userId,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: telefonoCompleto,
        cedula: existingCedula ? null : documento,
        verificado: false,
      })
      if (perfilError) console.error('[registro] Error creando perfil (dev):', perfilError.message)
    } else {
      const { error: perfilError } = await admin.from('usuarios').insert({
        id: userId,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: telefonoCompleto,
        cedula: documento,
        verificado: false,
      })
      if (perfilError) console.error('[registro] Error creando perfil:', perfilError.message)
    }

    await supabase.auth.signOut()

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

  const admin = createAdminClient()
  const { data: usuario } = await admin
    .from('usuarios')
    .select('rol')
    .eq('email', datos.email)
    .single()

  if (!usuario || usuario.rol !== 'ADMIN') {
    await supabase.auth.signOut()
    return { error: 'No tienes permisos de administrador.' }
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

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(datos.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/recuperar-contrasena`,
  })

  if (error) {
    return { error: 'No pudimos enviar el correo. Intenta de nuevo.' }
  }

  return { exito: true, mensaje: 'Te enviamos un correo para restablecer tu contraseña.' }
}
