import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getRoleFromJwt } from '@/lib/auth/getRoleFromJwt'

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

  const isEducatorRoute = pathname.startsWith('/educator')
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/session') ||
    isEducatorRoute

  // Unauthenticated → bounce to /login with redirect query
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated but not an EDUCATOR → bounce educator routes to /dashboard.
  // FR-1.3: middleware does NOT hit the DB. Role is read from app_metadata
  // (which Supabase mirrors onto the user object). user_metadata is never
  // trusted for authorization (see getRoleFromJwt).
  if (isEducatorRoute && user) {
    const role = getRoleFromJwt({ app_metadata: user.app_metadata })
    if (role !== 'EDUCATOR') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/session/:path*', '/educator/:path*', '/login', '/register'],
}
