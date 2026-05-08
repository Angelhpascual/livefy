'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SetlistEntry } from '@/types'

export function useNowPlaying(eventId: string): {
  nowPlaying: SetlistEntry | null
  loading: boolean
} {
  const [nowPlaying, setNowPlaying] = useState<SetlistEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) {
      Promise.resolve().then(() => { setNowPlaying(null); setLoading(false) })
      return
    }

    const supabase = createClient()
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function fetchNowPlaying() {
      const { data, error } = await supabase
        .from('setlist_entries')
        .select('*, song:songs(*)')
        .eq('event_id', eventId)
        .eq('status', 'playing')
        .maybeSingle()

      if (error) {
        console.error('[useNowPlaying] fetch error:', error)
      }

      setNowPlaying((data as SetlistEntry) ?? null)
      setLoading(false)
    }

    function subscribe() {
      channel = supabase
        .channel(`now-playing-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'setlist_entries',
            filter: `event_id=eq.${eventId}`,
          },
          async (payload) => {
            const updated = payload.new as SetlistEntry

            if (updated.status === 'playing') {
              // Fetch with join to get song data
              const { data } = await supabase
                .from('setlist_entries')
                .select('*, song:songs(*)')
                .eq('id', updated.id)
                .single()

              if (data) setNowPlaying(data as SetlistEntry)
            } else {
              // If the previously playing entry changed status, clear if it was ours
              setNowPlaying((prev) =>
                prev?.id === updated.id ? null : prev
              )
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'setlist_entries',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            const deleted = payload.old as Pick<SetlistEntry, 'id'>
            setNowPlaying((prev) => (prev?.id === deleted.id ? null : prev))
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[useNowPlaying] channel error, retrying in 5s...')
            retryTimeout = setTimeout(() => {
              if (channel) supabase.removeChannel(channel)
              subscribe()
            }, 5000)
          }
        })
    }

    fetchNowPlaying()
    subscribe()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (channel) supabase.removeChannel(channel)
    }
  }, [eventId])

  return { nowPlaying, loading }
}
