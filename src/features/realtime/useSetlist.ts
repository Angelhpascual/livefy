'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeChannel } from './useRealtimeChannel'
import type { SetlistEntry } from '@/types'

export function useSetlist(eventId: string): {
  entries: SetlistEntry[]
  loading: boolean
} {
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!eventId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('setlist_entries')
      .select('*, song:songs(*)')
      .eq('event_id', eventId)
      .order('position', { ascending: true })

    if (error) console.error('[useSetlist] fetch error:', error)
    setEntries((data as SetlistEntry[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    if (!eventId) {
      Promise.resolve().then(() => { setEntries([]); setLoading(false) })
      return
    }
    void fetchEntries()
  }, [eventId, fetchEntries])

  useRealtimeChannel({
    channelName: `setlist-${eventId}`,
    table: 'setlist_entries',
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    enabled: !!eventId,
    onEvent: () => { void fetchEntries() },
  })

  return { entries, loading }
}
