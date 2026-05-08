import { NextRequest, NextResponse } from 'next/server'

const SESSION_TOKEN = 'livefy_session'

export function isValidSession(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_TOKEN)
  return cookie?.value === process.env.ADMIN_SESSION_TOKEN
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')
  const isLoginPage = pathname === '/admin/login'
  const isLoginApi = pathname === '/api/admin/login'

  if (!isAdminPage && !isAdminApi) return NextResponse.next()

  // Login endpoints are always accessible
  if (isLoginPage || isLoginApi) {
    if (isLoginPage && isValidSession(request)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // All other /admin and /api/admin routes require auth
  if (!isValidSession(request)) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
