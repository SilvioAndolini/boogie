import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function sanitizeRedirectPath(path: string): string {
  if (!path.startsWith('/')) return '/dashboard'
  if (path.startsWith('//')) return '/dashboard'
  if (path.includes('\n') || path.includes('\r')) return '/dashboard'
  try {
    const testUrl = new URL(path, 'https://localhost')
    if (testUrl.origin !== 'https://localhost') return '/dashboard'
  } catch {
    return '/dashboard'
  }
  return path
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const next = sanitizeRedirectPath(searchParams.get('next') ?? '/dashboard')
  const type = searchParams.get('type')

  console.log('[auth/callback] Params:', { code: !!code, error: errorParam, next, type })

  if (errorParam) {
    console.error('[auth/callback] OAuth error:', errorParam)
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  if (!code) {
    console.error('[auth/callback] No code param')
    return NextResponse.redirect(`${origin}/login?error=nocode`)
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] Exchange error:', exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=exchange`)
  }

  if (type === 'recovery') {
    console.log('[auth/callback] Password recovery flow, redirecting to reset form')
    return NextResponse.redirect(`${origin}/recuperar-contrasena?type=recovery`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[auth/callback] GetUser error:', userError?.message)
    return NextResponse.redirect(`${origin}/login?error=user`)
  }

  console.log('[auth/callback] User authenticated')

  const admin = createAdminClient()
  const { data: existingProfile, error: profileQueryError } = await admin
    .from('usuarios')
    .select('id, cedula, telefono')
    .eq('id', user.id)
    .maybeSingle()

  if (profileQueryError) {
    console.error('[auth/callback] Profile query error:', profileQueryError.message)
  }

  if (!existingProfile) {
    const nombre = user.user_metadata?.given_name || user.user_metadata?.nombre || ''
    const apellido = user.user_metadata?.family_name || user.user_metadata?.apellido || ''

    console.log('[auth/callback] Creating profile')

    const { error: profileError } = await admin.from('usuarios').insert({
      id: user.id,
      email: user.email || '',
      nombre: nombre || '',
      apellido: apellido || '',
      telefono: null,
      cedula: null,
      verificado: false,
      rol: 'BOOGER',
      plan_suscripcion: 'FREE',
    })

    if (profileError) {
      console.error('[auth/callback] Profile insert error:', profileError.message)
    }

    const { error: appMetaError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { rol: 'BOOGER' },
    })
    if (appMetaError) {
      console.warn('[auth/callback] app_metadata sync failed:', appMetaError.message)
    }

    console.log('[auth/callback] Redirecting to completar-perfil')
    return NextResponse.redirect(`${origin}/completar-perfil`)
  }

  if (!existingProfile.cedula || !existingProfile.telefono) {
    const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { rol: 'BOOGER' },
    })
    if (metaError) {
      console.warn('[auth/callback] app_metadata sync failed:', metaError.message)
    }
  }

  const perfilIncompleto = !existingProfile.cedula || !existingProfile.telefono
  if (perfilIncompleto) {
    console.log('[auth/callback] Profile incomplete, redirecting to completar-perfil')
    return NextResponse.redirect(`${origin}/completar-perfil`)
  }

  console.log('[auth/callback] Redirecting to:', next)
  return NextResponse.redirect(`${origin}${next}`)
}
