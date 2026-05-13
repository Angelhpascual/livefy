'use client'

import type { SetlistEntry } from '@/types'

interface TopRequestedSectionProps {
  activeEntries: SetlistEntry[]
}

export function TopRequestedSection({ activeEntries }: TopRequestedSectionProps) {
  const top = activeEntries
    .filter(e => e.status === 'pending' && e.votes > 0)
    .slice(0, 5)

  if (top.length < 2) return null

  const maxVotes = top[0].votes

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: '#1DB954', fontSize: 11 }}>🔥</span>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Lo más pedido</p>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#111', border: '1px solid #1a1a1a' }}>
        {top.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-2.5 px-3 py-2"
            style={{ borderBottom: i < top.length - 1 ? '1px solid #1a1a1a' : 'none' }}
          >
            <span className="text-xs tabular-nums w-3 shrink-0 text-right" style={{ color: i === 0 ? '#1DB954' : '#444' }}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white truncate" style={{ fontSize: 11, fontWeight: 600 }}>
                {entry.song?.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 2, backgroundColor: '#222' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(entry.votes / maxVotes) * 100}%`,
                      backgroundColor: i === 0 ? '#1DB954' : '#1DB95440',
                    }}
                  />
                </div>
                <span style={{ color: '#1DB954', fontSize: 10, fontWeight: 700 }}>{entry.votes}</span>
              </div>
            </div>
            {entry.tier === 'priority' && <span style={{ fontSize: 10 }}>⚡</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
