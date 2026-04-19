import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RUTAS_PUBLICAS = [
  '/',
  '/propiedades',
  '/canchas',
  '/zonas',
  '/como-funciona',
  '/login',
  '/registro',
  '/recuperar-contrasena',
  '/admin-login',
  '/guia-anfitrion',
]

function esRutaPublica(pathname: string): boolean {
  if (pathname.startsWith('/auth/')) return true
  if (pathname === '/completar-perfil') return true
  return RUTAS_PUBLICAS.some(ruta => {
    if (ruta === pathname) return true
    if (ruta === '/propiedades' && pathname.startsWith('/propiedades')) return true
    if (ruta === '/canchas' && pathname.startsWith('/canchas')) return true
    if (ruta === '/zonas' && pathname.startsWith('/zonas')) return true
    return false
  })
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[middleware] Supabase credentials not configured, skipping auth')
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    if (user && pathname.startsWith('/admin-login')) {
      const rol = user.app_metadata?.rol
      if (rol === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (user && (pathname.startsWith('/login') || pathname.startsWith('/registro'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (user && pathname !== '/completar-perfil') {
      const cedula = user.user_metadata?.cedula
      const telefono = user.user_metadata?.telefono
      if (!cedula || !telefono) {
        return NextResponse.redirect(new URL('/completar-perfil', request.url))
      }
    }

    if (!user && !esRutaPublica(pathname) && !pathname.startsWith('/api/')) {
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin-login', request.url))
      }
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (user && pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
      const rol = user.app_metadata?.rol
      if (rol !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  } catch (error) {
    console.error('[middleware] Error during auth check:', error)
    return NextResponse.next({ request })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
