import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/access-denied']
const SUPER_ADMIN_ONLY = ['/settings', '/audit-logs']
const TEACHER_ALLOWED = ['/my']
const TEACHER_HOME = '/my/earnings'

// NEXT_PUBLIC_USER_ENV picks which roles this deployment serves: 'admin' → ops team only
// (admin/super_admin), 'partner' → teachers only. Unset → no restriction
// (both, as before) so existing deployments aren't broken by this var's absence.
const NEXT_PUBLIC_USER_ENV = process.env.NEXT_PUBLIC_USER_ENV

function isRoleAllowedForDeployment(role: string | undefined) {
  if (NEXT_PUBLIC_USER_ENV === 'admin' || !NEXT_PUBLIC_USER_ENV) return role === 'admin' || role === 'super_admin'
  if (NEXT_PUBLIC_USER_ENV === 'partner') return role === 'teacher'
  return false
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isSuperAdminRoute(pathname: string) {
  return SUPER_ADMIN_ONLY.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isTeacherAllowedRoute(pathname: string) {
  return TEACHER_ALLOWED.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicRoute = isPublicRoute(pathname)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (publicRoute) return NextResponse.next()
    return NextResponse.redirect(new URL('/access-denied', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        supabaseResponse = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !publicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    const role = user.app_metadata?.role
    if (!isRoleAllowedForDeployment(role)) {
      return NextResponse.redirect(new URL('/access-denied', request.url))
    }
    return NextResponse.redirect(new URL(role === 'teacher' ? TEACHER_HOME : '/', request.url))
  }

  if (user && !publicRoute) {
    const role = user.app_metadata?.role
    if (role !== 'admin' && role !== 'super_admin' && role !== 'teacher') {
      return NextResponse.redirect(new URL('/access-denied', request.url))
    }
    if (!isRoleAllowedForDeployment(role)) {
      return NextResponse.redirect(new URL('/access-denied', request.url))
    }
    if (role === 'teacher' && !isTeacherAllowedRoute(pathname)) {
      return NextResponse.redirect(new URL(TEACHER_HOME, request.url))
    }
    if (role !== 'teacher' && isSuperAdminRoute(pathname) && role !== 'super_admin') {
      const url = new URL('/access-denied', request.url)
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$).*)'],
}
