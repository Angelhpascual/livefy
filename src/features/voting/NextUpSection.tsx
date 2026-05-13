'use client'

import type { SetlistEntry, Song } from '@/types'

interface NextUpSectionProps {
  activeEntries: SetlistEntry[]
  nowPlayingId?: string
}

function NextCover({ song }: { song: Song }) {
  const colors = ['#1DB954', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
  const bg = colors[song.title.charCodeAt(0) % colors.length]
  if (song.artwork_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={song.artwork_url} alt={song.title} className="rounded-lg object-cover shrink-0" style={{ width: 44, height: 44 }} />
  }
  return (
    <div className="rounded-lg shrink-0 flex items-center justify-center font-bold text-white text-sm" style={{ width: 44, height: 44, background: `linear-gradient(135deg,${bg}cc,${bg}44)` }}>
      {song.title.charAt(0)}
    </div>
  )
}

export function NextUpSection({ activeEntries, nowPlayingId }: NextUpSectionProps) {
  const next = activeEntries.find(
    e => e.status === 'pending' && e.id !== nowPlayingId && (e.tier === 'priority' || e.votes > 0)
  )
  if (!next?.song) return null

  return (
    <div className="px-4 pt-4">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#888' }}>▶ A continuación</p>
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
}
