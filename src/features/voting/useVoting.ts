'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Tier } from '@/types'

export const MAX_VOTES = 5

function votesKey(eventId: string) {
  return `livefy_votes_${eventId}`
}

const VOTES_VERSION = 'v2' // bump when MAX_VOTES changes
const VOTES_VERSION_KEY = (eventId: string) => `livefy_votes_version_${eventId}`

function loadVotes(eventId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    // If stored with an old version, reset votes so users get the new limit
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
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    const votes = eventId ? loadVotes(eventId) : new Set<string>()
    Promise.resolve().then(() => setVotedIds(votes))
  }, [eventId])

  const hasVoted = useCallback(
    (entryId: string): boolean => votedIds.has(entryId),
    [votedIds]
  )

  const votesUsed = votedIds.size
  const canVote = votesUsed < MAX_VOTES

  const vote = useCallback(
    async (entryId: string, tier: Tier, dedication?: string): Promise<{ ok: boolean; conflict: boolean; limitReached: boolean }> => {
      if (!sessionId || !eventId) return { ok: false, conflict: false, limitReached: false }
      if (votedIds.size >= MAX_VOTES && tier === 'free') return { ok: false, conflict: false, limitReached: true }

      setVoting(true)
      try {
        const res = await fetch('/api/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId, sessionId, tier, dedication }),
        })

        if (res.status === 409) {
          setVotedIds((prev) => { const n = new Set(prev); n.add(entryId); persistVotes(eventId, n); return n })
          return { ok: false, conflict: true, limitReached: false }
        }

        if (!res.ok) return { ok: false, conflict: false, limitReached: false }

        setVotedIds((prev) => { const n = new Set(prev); n.add(entryId); persistVotes(eventId, n); return n })
        return { ok: true, conflict: false, limitReached: false }
      } catch {
        return { ok: false, conflict: false, limitReached: false }
      } finally {
        setVoting(false)
      }
    },
    [sessionId, eventId, votedIds]
  )

  return { vote, hasVoted, voting, votesUsed, canVote }
}
