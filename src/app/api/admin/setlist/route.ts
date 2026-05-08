import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient as createClient } from '@/lib/supabase/admin'
import type { SetlistEntry } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('active', true)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'No active event' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('setlist_entries')
    .select('*, song:songs(*)')
    .eq('event_id', event.id)
    .order('position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as SetlistEntry[])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json() as { songId: string }
  const { songId } = body

  if (!songId) {
    return NextResponse.json({ error: 'songId is required' }, { status: 400 })
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('active', true)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'No active event' }, { status: 404 })
  }

  const { data: maxData } = await supabase
    .from('setlist_entries')
    .select('position')
    .eq('event_id', event.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (maxData?.position ?? 0) + 1

  const { data, error } = await supabase
    .from('setlist_entries')
    .insert({
      event_id: event.id,
      song_id: songId,
      position: nextPosition,
      status: 'pending',
      tier: 'free',
      votes: 0,
      bizum_confirmed: false,
    })
    .select('*, song:songs(*)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data as SetlistEntry, { status: 201 })
}
