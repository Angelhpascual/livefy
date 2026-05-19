import { NextRequest, NextResponse } from 'next/server'

const SESSION_TOKEN = 'livefy_session'

export function isValidSession(request: NextRequest): boolean {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN
  if (!expectedToken) return false

  const cookie = request.cookies.get(SESSION_TOKEN)
  return cookie?.value === expectedToken
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')
  const isSongMutation = pathname.startsWith('/api/songs') && request.method !== 'GET'
  const isLoginPage = pathname === '/admin/login'
  const isLoginApi = pathname === '/api/admin/login'

  if (!isAdminPage && !isAdminApi && !isSongMutation) return NextResponse.next()

  // Login endpoints are always accessible
  if (isLoginPage || isLoginApi) {
    if (isLoginPage && isValidSession(request)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // All other /admin and /api/admin routes require auth
  if (!isValidSession(request)) {
    if (isAdminApi || isSongMutation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/songs/:path*'],
}
