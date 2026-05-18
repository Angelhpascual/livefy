import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!rateLimit({ key: `admin-login:${ip}`, limit: 5, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { password?: string }
  try {
    body = await request.json() as { password?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { password } = body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionToken = process.env.ADMIN_SESSION_TOKEN
  if (!sessionToken) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('livefy_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 86400 * 7, // 7 días
    sameSite: 'strict',
  })

  return response
}
