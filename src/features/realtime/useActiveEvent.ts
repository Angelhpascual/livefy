'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeChannel } from './useRealtimeChannel'
import type { Event } from '@/types'

export function useActiveEvent(): { event: Event | null; loading: boolean } {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchActiveEvent = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[useActiveEvent] fetch error:', error)
    }
    setEvent((data as Event) ?? null)
    setLoading(false)
  }, [])

  useEffect(() => { void fetchActiveEvent() }, [fetchActiveEvent])

  useRealtimeChannel({
    channelName: 'active-event',
    table: 'events',
    onEvent: () => { void fetchActiveEvent() },
  })

  return { event, loading }
}
