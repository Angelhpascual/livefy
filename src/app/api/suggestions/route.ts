import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

const MAX_TITLE_LENGTH = 120
const MAX_ARTIST_LENGTH = 120
const MAX_SESSION_ID_LENGTH = 128

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimit({ key: `suggestions:${ip}`, limit: 5, windowMs: 3_600_000 })) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { title?: string; artist?: string; sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { title, artist, sessionId } = body

  if (!title?.trim() || !sessionId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cleanTitle = title.trim()
  const cleanArtist = artist?.trim() || null

  if (cleanTitle.length > MAX_TITLE_LENGTH || (cleanArtist && cleanArtist.length > MAX_ARTIST_LENGTH)) {
    return NextResponse.json({ error: 'Suggestion too long' }, { status: 400 })
  }

  if (sessionId.length > MAX_SESSION_ID_LENGTH) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Get active event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('active', true)
    .single()

  const { error } = await supabase.from('suggestions').insert({
    title: cleanTitle,
    artist: cleanArtist,
    session_id: sessionId,
    event_id: event?.id ?? null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
