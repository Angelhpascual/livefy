'use client'

import { useMemo, useRef } from 'react'
import type { SetlistEntry } from '@/types'

function shuffleOnce(ids: string[]): Map<string, number> {
  const shuffled = [...ids].sort(() => Math.random() - 0.5)
  return new Map(shuffled.map((id, i) => [id, i]))
}

export function useSetlistSort(entries: SetlistEntry[]): SetlistEntry[] {
  const shuffleOrderRef = useRef<Map<string, number>>(new Map())

  return useMemo(() => {
    if (!entries.length) return []

    // Add new zero-vote entries to shuffle map without disturbing existing ones
    const noVoteIds = entries
      .filter(e => e.status === 'pending' && e.votes === 0)
      .map(e => e.id)

    const newIds = noVoteIds.filter(id => !shuffleOrderRef.current.has(id))
    if (newIds.length > 0) {
      const offset = shuffleOrderRef.current.size
      const newShuffled = [...newIds].sort(() => Math.random() - 0.5)
      newShuffled.forEach((id, i) => shuffleOrderRef.current.set(id, offset + i))
    }

    const playing = entries.filter(e => e.status === 'playing')
    const priority = entries
      .filter(e => e.status === 'pending' && e.tier === 'priority')
      .sort((a, b) => b.votes - a.votes)
    const withVotes = entries
      .filter(e => e.status === 'pending' && e.tier !== 'priority' && e.votes > 0)
      .sort((a, b) => b.votes - a.votes)
    const noVotes = entries
      .filter(e => e.status === 'pending' && e.tier !== 'priority' && e.votes === 0)
      .sort((a, b) => (shuffleOrderRef.current.get(a.id) ?? 0) - (shuffleOrderRef.current.get(b.id) ?? 0))
    const played = entries.filter(e => e.status === 'played')

    return [...playing, ...priority, ...withVotes, ...noVotes, ...played]
  }, [entries])
}
