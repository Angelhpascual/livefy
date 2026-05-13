'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeChannel } from './useRealtimeChannel'
import type { SetlistEntry } from '@/types'

export function useNowPlaying(eventId: string): {
  nowPlaying: SetlistEntry | null
  loading: boolean
} {
  const [nowPlaying, setNowPlaying] = useState<SetlistEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchNowPlaying = useCallback(async () => {
    if (!eventId) { setNowPlaying(null); setLoading(false); return }
    const supabase = createClient()
    const { data, error } = await supabase
      .from('setlist_entries')
      .select('*, song:songs(*)')
      .eq('event_id', eventId)
      .eq('status', 'playing')
      .maybeSingle()

    if (error) console.error('[useNowPlaying] fetch error:', error)
    setNowPlaying((data as SetlistEntry) ?? null)
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    if (!eventId) {
      Promise.resolve().then(() => { setNowPlaying(null); setLoading(false) })
      return
    }
    void fetchNowPlaying()
  }, [eventId, fetchNowPlaying])

  useRealtimeChannel({
    channelName: `now-playing-${eventId}`,
    table: 'setlist_entries',
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    enabled: !!eventId,
    onEvent: () => { void fetchNowPlaying() },
  })

  return { nowPlaying, loading }
}
