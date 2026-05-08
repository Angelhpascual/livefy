'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types'

export function useActiveEvent(): { event: Event | null; loading: boolean } {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function fetchActiveEvent() {
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
    }

    function subscribe() {
      channel = supabase
        .channel('active-event')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          (payload) => {
            const row = payload.new as Event | undefined
            const old = payload.old as Partial<Event> | undefined

            if (payload.eventType === 'INSERT' && row?.active) {
              setEvent(row)
            } else if (payload.eventType === 'UPDATE') {
              if (row?.active) {
                setEvent(row)
              } else if (!row?.active && old?.id) {
                // The previously active event was deactivated
                setEvent((prev) => (prev?.id === old.id ? null : prev))
              }
            } else if (payload.eventType === 'DELETE' && old?.id) {
              setEvent((prev) => (prev?.id === old.id ? null : prev))
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[useActiveEvent] channel error, retrying in 5s...')
            retryTimeout = setTimeout(() => {
              if (channel) {
                supabase.removeChannel(channel)
              }
              subscribe()
            }, 5000)
          }
        })
    }

    fetchActiveEvent()
    subscribe()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return { event, loading }
}
