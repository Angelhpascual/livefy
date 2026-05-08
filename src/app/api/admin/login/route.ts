import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json() as { password?: string }
  const { password } = body

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('livefy_admin', password, {
    httpOnly: true,
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  })

  return response
}
