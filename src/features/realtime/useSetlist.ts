'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SetlistEntry } from '@/types'

export function useSetlist(eventId: string): {
  entries: SetlistEntry[]
  loading: boolean
} {
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) {
      Promise.resolve().then(() => { setEntries([]); setLoading(false) })
      return
    }

    const supabase = createClient()
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function fetchEntries() {
      const { data, error } = await supabase
        .from('setlist_entries')
        .select('*, song:songs(*)')
        .eq('event_id', eventId)
        .order('position', { ascending: true })

      if (error) {
        console.error('[useSetlist] fetch error:', error)
      }

      setEntries((data as SetlistEntry[]) ?? [])
      setLoading(false)
    }

    function subscribe() {
      channel = supabase
        .channel(`setlist-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'setlist_entries',
            filter: `event_id=eq.${eventId}`,
          },
          async (payload) => {
            const newRow = payload.new as SetlistEntry
            // Fetch with song join since realtime doesn't include joined data
            const { data } = await supabase
              .from('setlist_entries')
              .select('*, song:songs(*)')
              .eq('id', newRow.id)
              .single()

            if (data) {
              setEntries((prev) => {
                const exists = prev.some((e) => e.id === (data as SetlistEntry).id)
                if (exists) return prev
                return [...prev, data as SetlistEntry].sort((a, b) => a.position - b.position)
              })
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'setlist_entries',
            filter: `event_id=eq.${eventId}`,
          },
          async (payload) => {
            const updatedRow = payload.new as SetlistEntry
            const { data } = await supabase
              .from('setlist_entries')
              .select('*, song:songs(*)')
              .eq('id', updatedRow.id)
              .single()

            if (data) {
              setEntries((prev) => {
                const updated = prev.map((e) =>
                  e.id === updatedRow.id ? (data as SetlistEntry) : e
                )
                return updated.sort((a, b) => a.position - b.position)
              })
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
            const deletedRow = payload.old as Pick<SetlistEntry, 'id'>
            setEntries((prev) => prev.filter((e) => e.id !== deletedRow.id))
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[useSetlist] channel error, retrying in 5s...')
            retryTimeout = setTimeout(() => {
              if (channel) supabase.removeChannel(channel)
              subscribe()
            }, 5000)
          }
        })
    }

    fetchEntries()
    subscribe()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (channel) supabase.removeChannel(channel)
    }
  }, [eventId])

  return { entries, loading }
}
