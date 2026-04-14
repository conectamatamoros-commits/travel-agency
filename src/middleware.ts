import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ✅ RUTAS PÚBLICAS (No requieren autenticación)
  const publicRoutes = [
    '/',                    // Home pública
    '/login',              // Login
    '/viaje',              // Detalle de viajes (/viaje/*)
    '/api',                // APIs
    '/_next',              // Assets de Next.js
    '/favicon.ico',        // Favicon
    '/eventos',            // Imágenes de eventos
    '/blanco con negro.png' // Logo
  ]

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    // Si está autenticado y va a /login, redirigir al admin
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return supabaseResponse
  }

  // 🔐 RUTAS PROTEGIDAS (Requieren autenticación)
  // Todo lo que empiece con /admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // No autenticado, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}