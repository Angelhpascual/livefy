'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Tier } from '@/types'

export const MAX_VOTES = 5

function votesKey(eventId: string) {
  return `livefy_votes_${eventId}`
}

// v4: switched to song_id tracking to fix virtual→real entry ID mismatch
const VOTES_VERSION = 'v4'
const VOTES_VERSION_KEY = (eventId: string) => `livefy_votes_version_${eventId}`

function songIdFromEntryId(entryId: string): string {
  // virtual entries have id "virtual-{song_id}", real entries carry song_id separately
  return entryId.startsWith('virtual-') ? entryId.replace('virtual-', '') : entryId
}

function loadVotes(eventId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const storedVersion = localStorage.getItem(VOTES_VERSION_KEY(eventId))
    if (storedVersion !== VOTES_VERSION) {
      localStorage.removeItem(votesKey(eventId))
      localStorage.setItem(VOTES_VERSION_KEY(eventId), VOTES_VERSION)
      return new Set()
    }
    const raw = localStorage.getItem(votesKey(eventId))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function persistVotes(eventId: string, votes: Set<string>): void {
  try {
    localStorage.setItem(votesKey(eventId), JSON.stringify(Array.from(votes)))
  } catch {}
}

export function useVoting(sessionId: string, eventId: string) {
  const [votedSongIds, setVotedSongIds] = useState<Set<string>>(new Set())
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const votes = eventId ? loadVotes(eventId) : new Set<string>()
    Promise.resolve().then(() => setVotedSongIds(votes))
  }, [eventId])

  // hasVoted accepts either an entryId or a songId — always resolves to songId
  const hasVoted = useCallback(
    (entryId: string): boolean => {
      const songId = songIdFromEntryId(entryId)
      return votedSongIds.has(songId) || votedSongIds.has(entryId)
    },
    [votedSongIds]
  )

  const votesUsed = votedSongIds.size
  const canVote = votesUsed < MAX_VOTES

  const vote = useCallback(
    async (entryId: string, songId: string, tier: Tier, dedication?: string): Promise<{ ok: boolean; conflict: boolean; limitReached: boolean }> => {
      if (!sessionId || !eventId) return { ok: false, conflict: false, limitReached: false }

      const trackId = songId || songIdFromEntryId(entryId)

      if (votedSongIds.has(trackId) && tier === 'free') return { ok: false, conflict: false, limitReached: false }
      if (votedSongIds.size >= MAX_VOTES && tier === 'free') return { ok: false, conflict: false, limitReached: true }

      setVoting(true)
      try {
        const res = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId, sessionId, tier, dedication }),
        })

        if (res.status === 409) {
          setVotedSongIds((prev) => { const n = new Set(prev); n.add(trackId); persistVotes(eventId, n); return n })
          return { ok: false, conflict: true, limitReached: false }
        }

        if (!res.ok) return { ok: false, conflict: false, limitReached: false }

        setVotedSongIds((prev) => { const n = new Set(prev); n.add(trackId); persistVotes(eventId, n); return n })
        return { ok: true, conflict: false, limitReached: false }
      } catch {
        return { ok: false, conflict: false, limitReached: false }
      } finally {
        setVoting(false)
      }
    },
    [sessionId, eventId, votedSongIds]
  )

  return { vote, hasVoted, voting, votesUsed, canVote }
}
