'use client'

import { useState, useEffect } from 'react'
import type { SetlistEntry } from '@/types'
import { VotingModal } from './VotingModal'

interface SongVoteCardProps {
  entry: SetlistEntry
  sessionId: string
  hasVoted: boolean
  canVote: boolean
  bizumNumber: string | null
  onVote: (entryId: string, tier: import('@/types').Tier, dedication?: string) => void
}

function AlbumThumb({ artworkUrl, title, artist }: { artworkUrl: string | null; title: string; artist: string }) {
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null)
  const [errorUrl, setErrorUrl] = useState<string | null>(null)

  useEffect(() => {
    if (artworkUrl) return
    const params = new URLSearchParams({ artist, title })
    fetch(`/api/artist-image?${params}`)
      .then(r => r.json())
      .then((d: { url: string | null }) => { if (d.url) setFetchedUrl(d.url) })
      .catch(() => {})
  }, [artworkUrl, title, artist])

  const displayUrl = artworkUrl ?? fetchedUrl
  const hasError = displayUrl !== null && displayUrl === errorUrl

  if (displayUrl && !hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayUrl}
        alt={title}
        className="rounded-md object-cover shrink-0"
        style={{ width: 48, height: 48 }}
        onError={() => setErrorUrl(displayUrl)}
      />
    )
  }

  const colors = ['#1DB954', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444']
  const bg = colors[title.charCodeAt(0) % colors.length]
  return (
    <div
      className="rounded-md shrink-0 flex items-center justify-center font-black text-white"
      style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${bg}cc, ${bg}44)`, fontSize: 18 }}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  )
}

export function SongVoteCard({ entry, sessionId: _sessionId, hasVoted, canVote, bizumNumber, onVote }: SongVoteCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const song = entry.song
  const title = song?.title ?? '—'
  const artist = song?.artist ?? '—'
  const artworkUrl = song?.artwork_url ?? null
  const isPlaying = entry.status === 'playing'
  const isPlayed = entry.status === 'played'

  function handleTap() {
    if (hasVoted || isPlayed || !canVote) return
    setModalOpen(true)
  }

  function handleConfirm(tier: import('@/types').Tier, dedication?: string) {
    setModalOpen(false)
    onVote(entry.id, tier, dedication)
  }

  return (
    <>
      <div
        onClick={handleTap}
        className="flex items-center gap-3 px-4 py-2.5 active:bg-white/5 transition-colors select-none"
        style={{
          borderLeft: isPlaying ? '3px solid #1DB954' : '3px solid transparent',
          backgroundColor: isPlaying ? '#1DB95408' : 'transparent',
          opacity: isPlayed ? 0.4 : (!canVote && !hasVoted) ? 0.55 : 1,
          cursor: (!isPlayed && canVote && !hasVoted) ? 'pointer' : 'default',
        }}
      >
        {/* Thumbnail */}
        <AlbumThumb artworkUrl={artworkUrl} title={title} artist={artist} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-tight truncate"
            style={{ textDecoration: isPlayed ? 'line-through' : 'none', textDecorationColor: '#444' }}>
            {title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs truncate" style={{ color: '#888' }}>{artist}</p>
            {entry.tier === 'priority' && !isPlayed && (
              <span className="text-xs shrink-0" style={{ color: '#f59e0b' }}>⚡</span>
            )}
            {entry.tier === 'next' && !isPlayed && (
              <span className="text-xs shrink-0" style={{ color: '#3b82f6' }}>🎯</span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="shrink-0 flex items-center gap-2">
          {entry.votes > 0 && (
            <span className="text-xs tabular-nums" style={{ color: hasVoted ? '#1DB954' : '#555' }}>
              {hasVoted ? '♥' : '♡'} {entry.votes}
            </span>
          )}

          {!isPlayed && (
            <button
              onClick={(e) => { e.stopPropagation(); handleTap() }}
              disabled={hasVoted || (!canVote && !hasVoted)}
              className="rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                width: 28, height: 28,
                backgroundColor: hasVoted ? 'transparent' : canVote ? '#1DB954' : 'transparent',
                border: hasVoted ? '1.5px solid #1DB954' : canVote ? 'none' : '1.5px solid #333',
                color: hasVoted ? '#1DB954' : canVote ? '#000' : '#333',
                fontSize: 13,
              }}
              aria-label={hasVoted ? 'Votada' : canVote ? `Votar por ${title}` : 'Sin votos'}
            >
              {hasVoted ? '♥' : '+'}
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <VotingModal
          entry={entry}
          bizumNumber={bizumNumber}
          onConfirm={handleConfirm}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
