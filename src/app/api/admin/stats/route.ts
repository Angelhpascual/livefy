import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  // Fetch all events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, date')
    .order('date', { ascending: false })

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 })
  }

  // Fetch all setlist entries with song info
  const { data: entries, error: entriesError } = await supabase
    .from('setlist_entries')
    .select('id, event_id, votes, tier, status, song:songs(title, artist)')

  if (entriesError) {
    return NextResponse.json({ error: entriesError.message }, { status: 500 })
  }

  type EntryRow = {
    id: string
    event_id: string
    votes: number
    tier: string
    status: string
    song: { title: string; artist: string } | { title: string; artist: string }[] | null
  }

  const typedEntries = (entries as unknown as EntryRow[]) ?? []

  function getSong(entry: EntryRow): { title: string; artist: string } | null {
    if (!entry.song) return null
    if (Array.isArray(entry.song)) return entry.song[0] ?? null
    return entry.song
  }

  // Build per-event stats
  const eventStats = (events ?? []).map((ev) => {
    const evEntries = typedEntries.filter((e) => e.event_id === ev.id)
    const totalVotes = evEntries.reduce((sum, e) => sum + (e.votes ?? 0), 0)
    const totalDedications = evEntries.filter((e) => e.tier !== 'free').length
    const songsPlayed = evEntries.filter((e) => e.status === 'played').length

    let topSong: { title: string; artist: string; votes: number } | null = null
    if (evEntries.length > 0) {
      const best = evEntries.reduce((a, b) => ((b.votes ?? 0) > (a.votes ?? 0) ? b : a))
      const bestSong = getSong(best)
      if (bestSong) {
        topSong = { title: bestSong.title, artist: bestSong.artist, votes: best.votes ?? 0 }
      }
    }

    return {
      id: ev.id,
      name: ev.name,
      date: ev.date,
      totalVotes,
      totalDedications,
      topSong,
      songsPlayed,
    }
  })

  // Build all-time stats
  const totalEvents = (events ?? []).length
  const totalVotes = typedEntries.reduce((sum, e) => sum + (e.votes ?? 0), 0)
  const totalDedications = typedEntries.filter((e) => e.tier !== 'free').length

  // Aggregate by song title+artist (since we don't have song_id easily)
  const songMap = new Map<string, { title: string; artist: string; votes: number; eventCount: number; events: Set<string> }>()
  for (const entry of typedEntries) {
    const song = getSong(entry)
    if (!song) continue
    const key = `${song.title}|||${song.artist}`
    const existing = songMap.get(key)
    if (existing) {
      existing.votes += entry.votes ?? 0
      existing.events.add(entry.event_id)
    } else {
      songMap.set(key, {
        title: song.title,
        artist: song.artist,
        votes: entry.votes ?? 0,
        eventCount: 1,
        events: new Set([entry.event_id]),
      })
    }
  }

  const topSongs = Array.from(songMap.values())
    .map((s) => ({ title: s.title, artist: s.artist, votes: s.votes, eventCount: s.events.size }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10)

  return NextResponse.json({
    events: eventStats,
    allTime: {
      totalEvents,
      totalVotes,
      totalDedications,
      topSongs,
    },
  })
}
