'use client'

import { useMemo } from 'react'
import type { SetlistEntry } from '@/types'

function stableHash(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash
}

export function useSetlistSort(entries: SetlistEntry[]): SetlistEntry[] {
  return useMemo(() => {
    if (!entries.length) return []

    const playing = entries.filter(e => e.status === 'playing')
    const priority = entries
      .filter(e => e.status === 'pending' && e.tier === 'priority')
      .sort((a, b) => b.votes - a.votes)
    const withVotes = entries
      .filter(e => e.status === 'pending' && e.tier !== 'priority' && e.votes > 0)
      .sort((a, b) => b.votes - a.votes)
    const noVotes = entries
      .filter(e => e.status === 'pending' && e.tier !== 'priority' && e.votes === 0)
      .sort((a, b) => stableHash(a.id) - stableHash(b.id))
    const played = entries.filter(e => e.status === 'played')

    return [...playing, ...priority, ...withVotes, ...noVotes, ...played]
  }, [entries])
}
