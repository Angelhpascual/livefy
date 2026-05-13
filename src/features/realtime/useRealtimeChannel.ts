'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface RealtimeChannelOptions {
  channelName: string
  table: string
  filter?: string
  event?: ChangeEvent
  enabled?: boolean
  onEvent: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
}

export function useRealtimeChannel({
  channelName,
  table,
  filter,
  event = '*',
  enabled = true,
  onEvent,
}: RealtimeChannelOptions) {
  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    function subscribe() {
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event, schema: 'public', table, filter },
          onEvent
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn(`[${channelName}] channel error, retrying in 5s...`)
            retryTimeout = setTimeout(() => {
              if (channel) supabase.removeChannel(channel)
              subscribe()
            }, 5000)
          }
        })
    }

    subscribe()

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout)
      if (channel) supabase.removeChannel(channel)
    }
  }, [channelName, table, filter, event, enabled, onEvent])
}
