'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useActiveEvent } from '@/features/realtime/useActiveEvent'
import { useNowPlaying } from '@/features/realtime/useNowPlaying'
import { useRepertoire } from '@/features/realtime/useRepertoire'
import { getSessionId } from '@/features/realtime/session'
import { NowPlayingBanner, SongVoteCard, useVoting } from '@/features/voting'
import { WelcomeModal } from '@/features/voting/WelcomeModal'
import { NextUpSection } from '@/features/voting/NextUpSection'
import { TopRequestedSection } from '@/features/voting/TopRequestedSection'
import { TipJar } from '@/features/voting/TipJar'
import { SuggestionBox } from '@/features/voting/SuggestionBox'
import { useSetlistSort } from '@/features/voting/useSetlistSort'
import { MAX_VOTES } from '@/features/voting/useVoting'
import { Logo } from '@/components/Logo'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { ArtistFooter } from '@/components/ArtistFooter'
import type { Tier } from '@/types'

const ARTIST_INSTAGRAM = 'angelfrostik'

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function SetlistSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -300px 0; }
          100% { background-position: 300px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>
      <div className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #111' }}>
            <div className="shimmer rounded-lg shrink-0" style={{ width: 48, height: 48 }} />
            <div className="flex-1 flex flex-col gap-2">
              <div className="shimmer rounded-md" style={{ height: 12, width: '60%' }} />
              <div className="shimmer rounded-md" style={{ height: 10, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// No active event screen
// ---------------------------------------------------------------------------
function NoEventScreen() {
  return (
    <>
      <style>{`
        @keyframes idle-eq {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
        }
        .idle-bar-1 { animation: idle-eq 1.1s ease-in-out infinite; animation-delay: 0s; }
        .idle-bar-2 { animation: idle-eq 1.1s ease-in-out infinite; animation-delay: 0.18s; }
        .idle-bar-3 { animation: idle-eq 1.1s ease-in-out infinite; animation-delay: 0.36s; }
        .idle-bar-4 { animation: idle-eq 1.1s ease-in-out infinite; animation-delay: 0.54s; }
        .idle-bar-5 { animation: idle-eq 1.1s ease-in-out infinite; animation-delay: 0.72s; }
      `}</style>
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-8" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-center space-y-3">
          <h1 className="flex justify-center"><Logo size={48} showText={true} /></h1>
          <p className="text-base font-medium" style={{ color: '#888' }}>No hay actuación activa</p>
          <p className="text-sm" style={{ color: '#444' }}>Vuelve cuando el músico haya comenzado su sesión.</p>
        </div>
        <div className="flex items-end gap-1.5" style={{ height: 40 }}>
          {['idle-bar-1', 'idle-bar-2', 'idle-bar-3', 'idle-bar-4', 'idle-bar-5'].map((cls) => (
            <div key={cls} className={`${cls} rounded-sm origin-bottom`} style={{ width: 6, height: 40, backgroundColor: '#1DB95466' }} />
          ))}
        </div>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [sessionId, setSessionId] = useState('')
  const [search, setSearch] = useState('')
  const [playedExpanded, setPlayedExpanded] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => { setSessionId(getSessionId()) }, [])

  const { event, loading: eventLoading } = useActiveEvent()
  const { entries, loading: setlistLoading, optimisticVote } = useRepertoire(event?.id ?? '')
  const { nowPlaying } = useNowPlaying(event?.id ?? '')
  const { vote, hasVoted, voting, votesUsed, canVote } = useVoting(sessionId, event?.id ?? '')

  const isOnline = useNetworkStatus()
  const welcomeShown = useRef(false)
  const WELCOME_KEY = 'livefy_welcome_shown'
  const sorted = useSetlistSort(entries)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(e => e.song?.title.toLowerCase().includes(q) || e.song?.artist.toLowerCase().includes(q))
  }, [sorted, search])

  const activeEntries = useMemo(() => filtered.filter(e => e.status !== 'played'), [filtered])
  const playedEntries = useMemo(() => filtered.filter(e => e.status === 'played'), [filtered])
  const isLoading = eventLoading || (!!event && setlistLoading)

  // Welcome modal — once per event per browser session
  useEffect(() => {
    if (!event || isLoading || welcomeShown.current) return
    welcomeShown.current = true
    try {
      const key = `${WELCOME_KEY}_${event.id}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {}
    setShowWelcome(true)
  }, [event, isLoading])

  // Vote limit toasts
  const prevVotesUsed = useRef<number | null>(null)
  useEffect(() => {
    if (prevVotesUsed.current === null) { prevVotesUsed.current = votesUsed; return }
    if (votesUsed === prevVotesUsed.current) return
    prevVotesUsed.current = votesUsed
    if (votesUsed === MAX_VOTES - 1) {
      toast('⚠️ Te queda 1 voto', { description: 'Úsalo con la canción que más quieras escuchar', duration: 3500 })
    } else if (votesUsed === MAX_VOTES) {
      toast('No te quedan votos', { description: 'Puedes pedir con dedicatoria por 1€', duration: 4000 })
    }
  }, [votesUsed])

  async function handleVote(entryId: string, songId: string, tier: Tier, dedication?: string) {
    const result = await vote(entryId, songId, tier, dedication)
    if (result.ok) {
      optimisticVote(songId)
      if (tier === 'free') {
        toast('¡Voto registrado! ♥', { duration: 2000 })
      } else {
        toast('✉ Dedicatoria enviada', { description: 'El músico la verá en cuanto confirme el Bizum', duration: 3500 })
      }
    } else if (result.limitReached) {
      toast('Sin votos disponibles', { description: 'Puedes pedir con dedicatoria por 1€', duration: 3000 })
    }
  }

  // — Loading —
  if (isLoading) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="sticky top-0 z-40 px-4 py-3" style={{ backgroundColor: '#0a0a0aee', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1a1a1a' }}>
          <Logo size={28} showText={true} />
        </div>
        <div className="max-w-lg mx-auto pt-4"><SetlistSkeleton /></div>
      </main>
    )
  }

  if (!event) return <NoEventScreen />

  return (
    <>
      {showWelcome && <WelcomeModal eventName={event.name} onDismiss={() => setShowWelcome(false)} />}

      <main className="min-h-screen pb-16" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Header */}
        <div
          className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-2"
          style={{ backgroundColor: '#0a0a0aee', backdropFilter: 'blur(10px)', borderBottom: '1px solid #1a1a1a' }}
        >
            <Logo size={26} showText={true} className="shrink-0" />
          <p className="flex-1 text-center text-sm font-semibold truncate" style={{ color: '#ccc' }}>{event.name}</p>
          {!isOnline && (
            <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-warning text-black">Sin red</span>
          )}
        </div>

        <NowPlayingBanner nowPlaying={nowPlaying} />

        <div className="max-w-lg mx-auto">
          <NextUpSection activeEntries={activeEntries} nowPlayingId={nowPlaying?.id} />
          <TopRequestedSection activeEntries={activeEntries} />

          {activeEntries.some(e => e.votes > 0) && (
            <div className="mx-4 mt-5 mb-1" style={{ height: 1, backgroundColor: '#1a1a1a' }} />
          )}

          {/* Section header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="text-base font-bold text-white">Elige qué quieres escuchar</h2>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: canVote ? '#1DB95420' : '#ff444420',
                color: canVote ? '#1DB954' : '#ff6b6b',
                border: `1px solid ${canVote ? '#1DB95440' : '#ff444440'}`,
              }}
            >
              {canVote ? `${MAX_VOTES - votesUsed} votos restantes` : 'Sin votos'}
            </span>
          </div>

          {/* Search */}
          <div className="relative px-4 mb-2">
            <label htmlFor="song-search" className="sr-only">Buscar canción o artista</label>
            <span className="absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#555' }} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              id="song-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar canción o artista..."
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none"
              style={{ backgroundColor: '#1a1a1a', border: 'none', caretColor: '#1DB954' }}
            />
          </div>

          {/* Song list */}
          {activeEntries.length === 0 ? (
            <p className="text-center text-sm py-12" style={{ color: '#444' }}>
              {search ? 'No hay canciones que coincidan.' : 'El repertorio está vacío.'}
            </p>
          ) : (
            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: '55vh' }}>
              {activeEntries.map((entry) => (
                <SongVoteCard
                  key={entry.id}
                  entry={entry}
                  sessionId={sessionId}
                  hasVoted={hasVoted(entry.song_id)}
                  canVote={canVote}
                  bizumNumber={event.bizum_number}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}

          {voting && <p className="text-center text-xs mt-3" style={{ color: '#888' }}>Enviando voto...</p>}

          {/* Suggestions */}
          <div className="mt-6 mx-4 mb-2" style={{ height: 1, backgroundColor: '#1a1a1a' }} />
          <SuggestionBox sessionId={sessionId} />

          {/* Played songs */}
          {playedEntries.length > 0 && (
            <div className="mt-2 px-4">
              <button
                onClick={() => setPlayedExpanded(v => !v)}
                className="w-full flex items-center justify-between py-3 text-sm font-semibold active:opacity-70 transition-opacity"
                style={{ color: '#444' }}
              >
                <span>Ya tocadas ({playedEntries.length})</span>
                <span style={{ fontSize: 10 }}>{playedExpanded ? '▲' : '▼'}</span>
              </button>
              {playedExpanded && (
                <div className="flex flex-col" style={{ opacity: 0.5 }}>
                  {playedEntries.map((entry) => (
                    <SongVoteCard
                      key={entry.id}
                      entry={entry}
                      sessionId={sessionId}
                      hasVoted={hasVoted(entry.song_id)}
                      canVote={false}
                      bizumNumber={event.bizum_number}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <TipJar bizumNumber={event.bizum_number} variant="banner" />
          <ArtistFooter instagramHandle={ARTIST_INSTAGRAM} />
        </div>

        <TipJar bizumNumber={event.bizum_number} variant="floating" />
      </main>
    </>
  )
}
