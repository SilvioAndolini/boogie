import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

function redirectWithCookies(request: NextRequest, destination: string, cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
  const url = request.nextUrl.clone()
  const dest = new URL(destination, request.url)
  url.pathname = dest.pathname
  url.search = dest.search
  const res = NextResponse.redirect(url)
  cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options as Record<string, unknown>))
  return res
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const next = sanitizeRedirectPath(searchParams.get('next') ?? '/dashboard')
  const type = searchParams.get('type')

  console.log('[auth/callback] Params:', { code: !!code, error: errorParam, next, type })

  if (errorParam) {
    console.error('[auth/callback] OAuth error:', errorParam)
    return NextResponse.redirect(new URL('/login?error=oauth', request.url))
  }

  if (!code) {
    console.error('[auth/callback] No code param')
    return NextResponse.redirect(new URL('/login?error=nocode', request.url))
  }

  const collectedCookies: Array<{ name: string; value: string; options?: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            collectedCookies.push({ name, value, options: options as Record<string, unknown> })
          })
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] Exchange error:', exchangeError.message)
    return NextResponse.redirect(new URL('/login?error=exchange', request.url))
  }

  if (type === 'recovery') {
    console.log('[auth/callback] Password recovery flow, redirecting to reset form')
    return redirectWithCookies(request, '/recuperar-contrasena?type=recovery', collectedCookies)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[auth/callback] GetUser error:', userError?.message)
    return redirectWithCookies(request, '/login?error=user', collectedCookies)
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
    return redirectWithCookies(request, '/completar-perfil', collectedCookies)
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
    return redirectWithCookies(request, '/completar-perfil', collectedCookies)
  }

  console.log('[auth/callback] Redirecting to:', next)
  return redirectWithCookies(request, next, collectedCookies)
}
