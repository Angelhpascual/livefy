'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useActiveEvent } from '@/features/realtime/useActiveEvent'
import { useNowPlaying } from '@/features/realtime/useNowPlaying'
import { useRepertoire } from '@/features/realtime/useRepertoire'
import { getSessionId } from '@/features/realtime/session'
import {
  NowPlayingBanner,
  SongVoteCard,
  useVoting,
} from '@/features/voting'
import type { Song } from '@/types'

function NextCover({ song }: { song: Song }) {
  const [url, setUrl] = useState<string | null>(song.artwork_url)
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (song.artwork_url) { setUrl(song.artwork_url); return }
    fetch(`/api/artist-image?artist=${encodeURIComponent(song.artist)}&title=${encodeURIComponent(song.title)}`)
      .then(r => r.json()).then((d: { url: string | null }) => { if (d.url) setUrl(d.url) }).catch(() => {})
  }, [song])
  const colors = ['#1DB954','#3b82f6','#f59e0b','#ec4899','#8b5cf6']
  const bg = colors[song.title.charCodeAt(0) % colors.length]
  if (url && !err) return <img src={url} alt={song.title} onError={() => setErr(true)} className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44 }} />
  return <div className="rounded-lg shrink-0 flex items-center justify-center font-bold text-white text-sm" style={{ width: 44, height: 44, background: `linear-gradient(135deg,${bg}cc,${bg}44)` }}>{song.title.charAt(0)}</div>
}
import { TipJar, TipJarBanner } from '@/features/voting/TipJar'
import { MAX_VOTES } from '@/features/voting/useVoting'
import { Logo } from '@/components/Logo'
import { SuggestionBox } from '@/features/voting/SuggestionBox'

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
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid #111' }}
          >
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
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 gap-8"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="text-center space-y-3">
          <h1 className="flex justify-center">
            <Logo size={48} showText={true} />
          </h1>
          <p className="text-base font-medium" style={{ color: '#888' }}>
            No hay actuación activa
          </p>
          <p className="text-sm" style={{ color: '#444' }}>
            Vuelve cuando el músico haya comenzado su sesión.
          </p>
        </div>

        {/* Idle equalizer */}
        <div className="flex items-end gap-1.5" style={{ height: 40 }}>
          {['idle-bar-1', 'idle-bar-2', 'idle-bar-3', 'idle-bar-4', 'idle-bar-5'].map((cls) => (
            <div
              key={cls}
              className={`${cls} rounded-sm origin-bottom`}
              style={{ width: 6, height: 40, backgroundColor: '#1DB95466' }}
            />
          ))}
        </div>
      </main>
    </>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function shuffleOnce(ids: string[]): Map<string, number> {
  const shuffled = [...ids].sort(() => Math.random() - 0.5)
  return new Map(shuffled.map((id, i) => [id, i]))
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [sessionId, setSessionId] = useState('')
  const [search, setSearch] = useState('')
  const [playedExpanded, setPlayedExpanded] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    setSessionId(getSessionId())
  }, [])

  const { event, loading: eventLoading } = useActiveEvent()
  const { entries, loading: setlistLoading } = useRepertoire(event?.id ?? '')
  const { nowPlaying } = useNowPlaying(event?.id ?? '')
  const { vote, hasVoted, voting, votesUsed, canVote } = useVoting(sessionId, event?.id ?? '')

  const welcomeShown = useRef(false)
  const WELCOME_KEY = 'livefy_welcome_shown'
  const shuffleOrderRef = useRef<Map<string, number>>(new Map())

  const sorted = useMemo(() => {
    if (!entries.length) return []

    const noVoteIds = entries
      .filter((e) => e.status === 'pending' && e.votes === 0)
      .map((e) => e.id)

    const newIds = noVoteIds.filter((id) => !shuffleOrderRef.current.has(id))
    if (newIds.length > 0) {
      const offset = shuffleOrderRef.current.size
      const newShuffled = [...newIds].sort(() => Math.random() - 0.5)
      newShuffled.forEach((id, i) => shuffleOrderRef.current.set(id, offset + i))
    }

    const playing = entries.filter((e) => e.status === 'playing')
    const withVotes = entries
      .filter((e) => e.status === 'pending' && e.votes > 0)
      .sort((a, b) => b.votes - a.votes)
    const noVotes = entries
      .filter((e) => e.status === 'pending' && e.votes === 0)
      .sort((a, b) => (shuffleOrderRef.current.get(a.id) ?? 0) - (shuffleOrderRef.current.get(b.id) ?? 0))
    const played = entries.filter((e) => e.status === 'played')

    return [...playing, ...withVotes, ...noVotes, ...played]
  }, [entries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (e) =>
        e.song?.title.toLowerCase().includes(q) ||
        e.song?.artist.toLowerCase().includes(q)
    )
  }, [sorted, search])

  const activeEntries = useMemo(
    () => filtered.filter((e) => e.status !== 'played'),
    [filtered]
  )
  const playedEntries = useMemo(
    () => filtered.filter((e) => e.status === 'played'),
    [filtered]
  )

  const isLoading = eventLoading || (!!event && setlistLoading)

  // Bienvenida cuando carga el evento — solo una vez por sesión de navegador
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

  // Aviso cuando queda 1 voto
  const prevVotesUsed = useRef<number | null>(null)
  useEffect(() => {
    if (prevVotesUsed.current === null) { prevVotesUsed.current = votesUsed; return }
    if (votesUsed === prevVotesUsed.current) return
    prevVotesUsed.current = votesUsed
    if (votesUsed === MAX_VOTES - 1) {
      toast('⚠️ Te queda 1 voto', {
        description: 'Úsalo con la canción que más quieras escuchar',
        duration: 3500,
      })
    } else if (votesUsed === MAX_VOTES) {
      toast('No te quedan votos', {
        description: 'Puedes pedir una canción con dedicatoria por 1€',
        duration: 4000,
      })
    }
  }, [votesUsed])

  async function handleVote(
    entryId: string,
    tier: import('@/types').Tier,
    dedication?: string
  ) {
    const result = await vote(entryId, tier, dedication)
    if (result.ok) {
      if (tier === 'free') {
        toast('¡Voto registrado! ♥', { duration: 2000 })
      } else {
        toast('✉ Dedicatoria enviada', {
          description: 'El músico la verá en cuanto confirme el Bizum',
          duration: 3500,
        })
      }
    } else if (result.limitReached) {
      toast('Sin votos disponibles', {
        description: 'Puedes pedir con dedicatoria por 1€',
        duration: 3000,
      })
    }
  }

  // — Loading —
  if (isLoading) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div
          className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: '#0a0a0aee', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1a1a1a' }}
        >
          <Logo size={28} showText={true} />
        </div>
        <div className="max-w-lg mx-auto pt-4">
          <SetlistSkeleton />
        </div>
      </main>
    )
  }

  // — No active event —
  if (!event) {
    return <NoEventScreen />
  }

  // — Main setlist view —
  return (
    <>
    {showWelcome && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
        onClick={() => setShowWelcome(false)}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
          style={{ backgroundColor: '#141414', border: '1px solid #1DB95440' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Logo size={56} showText={false} />
          <div>
            <h1 className="font-display text-2xl font-black text-white">Bienvenido a</h1>
            <h2 className="font-display text-2xl font-black" style={{ color: '#1DB954' }}>{event.name}</h2>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <p className="text-4xl font-black text-white">{MAX_VOTES}</p>
              <p className="text-sm mt-1" style={{ color: '#888' }}>votos para repartir</p>
            </div>
            <p className="text-sm" style={{ color: '#666' }}>
              Vota las canciones que quieres escuchar. Las más votadas subirán en la lista.
            </p>
          </div>
          <button
            onClick={() => setShowWelcome(false)}
            className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
            style={{ backgroundColor: '#1DB954', color: '#000' }}
          >
            ¡Empezar a votar!
          </button>
        </div>
      </div>
    )}

    <main className="min-h-screen pb-16" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-2"
        style={{
          backgroundColor: '#0a0a0aee',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #1a1a1a',
        }}
      >
        <Logo size={26} showText={true} className="shrink-0" />
        <p
          className="flex-1 text-center text-sm font-semibold truncate"
          style={{ color: '#ccc' }}
        >
          {event.name}
        </p>
      </div>

      {/* Now playing */}
      <NowPlayingBanner nowPlaying={nowPlaying} />

      <div className="max-w-lg mx-auto">

        {/* A continuación */}
        {(() => {
          const next = activeEntries.find(e => e.status === 'pending' && e.votes > 0 && e.id !== nowPlaying?.id)
          if (!next || !next.song) return null
          return (
            <div className="px-4 pt-4">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#888' }}>
                ▶ A continuación
              </p>
              <div
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #1DB95430' }}
              >
                <NextCover song={next.song} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{next.song.title}</p>
                  <p className="text-xs truncate" style={{ color: '#888' }}>{next.song.artist}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span style={{ color: '#1DB954', fontSize: 13 }}>♥</span>
                  <span className="font-bold text-sm tabular-nums" style={{ color: '#1DB954' }}>{next.votes}</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Top más pedidas */}
        {(() => {
          const top = activeEntries
            .filter(e => e.status === 'pending' && e.votes > 0)
            .slice(0, 5)
          if (top.length < 2) return null
          const maxVotes = top[0].votes
          return (
            <div className="px-4 pt-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
                🔥 Lo más pedido
              </p>
              <div className="flex flex-col gap-2">
                {top.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold tabular-nums w-4 text-right shrink-0" style={{ color: '#555' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-white text-xs font-medium truncate">{entry.song?.title}</p>
                        <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: '#1DB954' }}>{entry.votes}</span>
                      </div>
                      <div className="w-full rounded-full overflow-hidden" style={{ height: 3, backgroundColor: '#1a1a1a' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(entry.votes / maxVotes) * 100}%`,
                            backgroundColor: i === 0 ? '#1DB954' : '#1DB95466',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Separador */}
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
          <span
            className="absolute left-7 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: '#555' }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar canción o artista..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:ring-1"
            style={{
              backgroundColor: '#1a1a1a',
              border: 'none',
              caretColor: '#1DB954',
            }}
          />
        </div>

        {/* Active songs */}
        {activeEntries.length === 0 && !search ? (
          <p className="text-center text-sm py-12" style={{ color: '#444' }}>
            El repertorio está vacío.
          </p>
        ) : activeEntries.length === 0 && search ? (
          <p className="text-center text-sm py-12" style={{ color: '#444' }}>
            No hay canciones que coincidan.
          </p>
        ) : (
          <div className="flex flex-col">
            {activeEntries.map((entry) => (
              <SongVoteCard
                key={entry.id}
                entry={entry}
                sessionId={sessionId}
                hasVoted={hasVoted(entry.id)}
                canVote={canVote}
                bizumNumber={event.bizum_number}
                onVote={handleVote}
              />
            ))}
          </div>
        )}

        {/* TipJar banner */}
        <TipJarBanner bizumNumber={event.bizum_number} />

        {/* Played songs collapsible */}
        {playedEntries.length > 0 && (
          <div className="mt-6 px-4">
            <button
              onClick={() => setPlayedExpanded((v) => !v)}
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
                    hasVoted={hasVoted(entry.id)}
                    canVote={false}
                    bizumNumber={event.bizum_number}
                    onVote={handleVote}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {voting && (
          <p className="text-center text-xs mt-4" style={{ color: '#888' }}>
            Enviando voto...
          </p>
        )}

        {/* Sugerencias */}
        <div className="mt-8 mx-4 mb-2" style={{ height: 1, backgroundColor: '#1a1a1a' }} />
        <SuggestionBox sessionId={sessionId} />
      </div>

      <TipJar bizumNumber={event.bizum_number} />
    </main>
    </>
  )
}
