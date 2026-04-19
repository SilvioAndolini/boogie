import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('[auth/recovery] Params:', { code: !!code })

  if (!code) {
    console.error('[auth/recovery] No code param')
    return NextResponse.redirect(new URL('/recuperar-contrasena?error=nocode', request.url))
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
    console.error('[auth/recovery] Exchange error:', exchangeError.message)
    return NextResponse.redirect(new URL('/recuperar-contrasena?error=exchange', request.url))
  }

  console.log('[auth/recovery] Code exchanged, redirecting to reset form')
  return redirectWithCookies(request, '/recuperar-contrasena?type=recovery', collectedCookies)
}
