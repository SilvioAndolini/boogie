// Middleware de autenticación y protección de rutas de Boogie
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const RUTAS_PUBLICAS = [
  '/',
  '/propiedades',
  '/zonas',
  '/como-funciona',
  '/login',
  '/registro',
  '/recuperar-contrasena',
  '/verificar-email',
]

// Verifica si una ruta coincide con un patrón público
function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some(ruta => {
    if (ruta === pathname) return true
    // Permitir rutas dinámicas bajo propiedades y zonas
    if (ruta === '/propiedades' && pathname.startsWith('/propiedades')) return true
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

    // Refrescar la sesión del usuario
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Redirigir usuarios autenticados lejos de páginas de auth
    if (user && (pathname.startsWith('/login') || pathname.startsWith('/registro'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Proteger rutas del panel y API
    if (!user && !esRutaPublica(pathname) && !pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    // Si hay cualquier error con Supabase, permitir acceso para no romper la app
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
