import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json() as { password?: string }
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
