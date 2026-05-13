'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeChannel } from './useRealtimeChannel'
import type { SetlistEntry } from '@/types'

export function useRepertoire(eventId: string): {
  entries: SetlistEntry[]
  loading: boolean
  optimisticVote: (songId: string) => void
} {
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  const fetchRepertoire = useCallback(async () => {
    const res = await fetch('/api/repertoire')
    if (res.ok) {
      const data = await res.json() as SetlistEntry[]
      setEntries(data)
      initialLoadDone.current = true
    }
    setLoading(false)
  }, [])

  const optimisticVote = useCallback((songId: string) => {
    setEntries(prev => prev.map(e =>
      e.song_id === songId ? { ...e, votes: e.votes + 1 } : e
    ))
  }, [])

  // Smart realtime handler: update only the changed entry instead of full refetch
  const handleRealtimeEvent = useCallback(async (payload: { eventType?: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
    if (!initialLoadDone.current) return

    const { eventType, new: newRow, old: oldRow } = payload

    if (eventType === 'DELETE' && oldRow?.id) {
      // Virtual entries are never in DB, just remove from state
      setEntries(prev => prev.filter(e => e.id !== oldRow.id))
      return
    }

    if (eventType === 'UPDATE' && newRow?.id) {
      // Update only the changed fields — avoids full API refetch for vote increments
      setEntries(prev => prev.map(e => {
        if (e.id !== newRow.id) return e
        return {
          ...e,
          votes: typeof newRow.votes === 'number' ? newRow.votes : e.votes,
          status: typeof newRow.status === 'string' ? newRow.status as SetlistEntry['status'] : e.status,
          tier: typeof newRow.tier === 'string' ? newRow.tier as SetlistEntry['tier'] : e.tier,
          bizum_confirmed: typeof newRow.bizum_confirmed === 'boolean' ? newRow.bizum_confirmed : e.bizum_confirmed,
          dedication: newRow.dedication !== undefined ? newRow.dedication as string | null : e.dedication,
        }
      }))
      return
    }

    if (eventType === 'INSERT' && newRow?.id) {
      // New entry — fetch with song join (realtime doesn't include joins)
      const supabase = createClient()
      const { data } = await supabase
        .from('setlist_entries')
        .select('*, song:songs(*)')
        .eq('id', newRow.id as string)
        .single()

      if (data) {
        setEntries(prev => {
          // Replace virtual entry if it exists
          const songId = (newRow.song_id as string) ?? ''
          const withoutVirtual = prev.filter(e => e.id !== `virtual-${songId}`)
          const exists = withoutVirtual.some(e => e.id === (data as SetlistEntry).id)
          if (exists) return withoutVirtual
          return [...withoutVirtual, data as SetlistEntry]
        })
      }
      return
    }

    // Fallback: full refetch for unknown events
    void fetchRepertoire()
  }, [fetchRepertoire])

  useEffect(() => {
    if (!eventId) {
      Promise.resolve().then(() => { setEntries([]); setLoading(false) })
      return
    }
    void fetchRepertoire()
  }, [eventId, fetchRepertoire])

  useRealtimeChannel({
    channelName: `repertoire-${eventId}`,
    table: 'setlist_entries',
    filter: eventId ? `event_id=eq.${eventId}` : undefined,
    enabled: !!eventId,
    onEvent: handleRealtimeEvent as Parameters<typeof useRealtimeChannel>[0]['onEvent'],
  })

  return { entries, loading, optimisticVote }
}
