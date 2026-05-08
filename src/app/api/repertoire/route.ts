import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Song, SetlistEntry } from '@/types'

// Returns all songs merged with their setlist_entry for the active event.
// Songs without an entry get a virtual entry with 0 votes and status 'pending'.
export async function GET() {
  const supabase = createAdminClient()

  // Get active event
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('active', true)
    .single()

  if (!event) return NextResponse.json([], { status: 200 })

  // Get all songs
  const { data: songs, error: songsError } = await supabase
    .from('songs')
    .select('*')
    .order('artist', { ascending: true })

  if (songsError) return NextResponse.json({ error: songsError.message }, { status: 500 })

  // Get existing setlist entries for this event
  const { data: entries } = await supabase
    .from('setlist_entries')
    .select('*')
    .eq('event_id', event.id)

  const entryBySongId = new Map((entries ?? []).map((e) => [e.song_id, e]))

  // Merge: every song gets an entry (real or virtual)
  const merged: SetlistEntry[] = (songs as Song[]).map((song, i) => {
    const entry = entryBySongId.get(song.id)
    if (entry) return { ...entry, song }
    // Virtual entry — not in DB yet, created on first vote
    return {
      id: `virtual-${song.id}`,
      event_id: event.id,
      song_id: song.id,
      position: 1000 + i,
      status: 'pending' as const,
      tier: 'free' as const,
      votes: 0,
      dedication: null,
      bizum_confirmed: false,
      requester_session: null,
      created_at: song.created_at,
      song,
    }
  })

  // Sort: real entries with votes first (by votes desc), then virtual entries alphabetically
  merged.sort((a, b) => {
    const aReal = !a.id.startsWith('virtual-')
    const bReal = !b.id.startsWith('virtual-')
    if (aReal && !bReal) return -1
    if (!aReal && bReal) return 1
    if (aReal && bReal) return b.votes - a.votes
    return (a.song?.artist ?? '').localeCompare(b.song?.artist ?? '')
  })

  return NextResponse.json(merged)
}
