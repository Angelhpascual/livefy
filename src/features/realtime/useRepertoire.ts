'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SetlistEntry } from '@/types'

export function useRepertoire(eventId: string): {
  entries: SetlistEntry[]
  loading: boolean
} {
  const [entries, setEntries] = useState<SetlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRepertoire = useCallback(async () => {
    const res = await fetch('/api/repertoire')
    if (res.ok) {
      const data = await res.json() as SetlistEntry[]
      setEntries(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!eventId) {
      Promise.resolve().then(() => { setEntries([]); setLoading(false) })
      return
    }
    void fetchRepertoire()
  }, [eventId, fetchRepertoire])

  // Listen for realtime changes on setlist_entries to refresh votes
  useEffect(() => {
    if (!eventId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`repertoire-${eventId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'setlist_entries',
        filter: `event_id=eq.${eventId}`,
      }, () => { fetchRepertoire() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, fetchRepertoire])

  return { entries, loading }
}
