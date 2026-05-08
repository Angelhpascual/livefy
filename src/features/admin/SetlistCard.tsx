'use client'

import type { SetlistEntry } from '@/types'

interface Props {
  entry: SetlistEntry
  onAction: (id: string, body: Record<string, unknown>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const TIER_LABELS: Record<string, string> = {
  free: 'free',
  priority: '⚡ Prioridad',
  next: '🎯 Siguiente',
}

export function SetlistCard({ entry, onAction, onDelete }: Props) {
  const isPlaying = entry.status === 'playing'
  const hasBizumPending = entry.tier !== 'free' && !entry.bizum_confirmed

  return (
    <div
      className="rounded-xl p-4 flex gap-3 items-start transition-all duration-300"
      style={{
        backgroundColor: isPlaying ? '#1f2d1f' : '#1a1a1a',
        border: isPlaying ? '2px solid #1DB954' : '2px solid transparent',
        boxShadow: isPlaying ? '0 0 12px rgba(29,185,84,0.3)' : 'none',
      }}
    >
      {/* Position */}
      <span
        className="text-2xl font-bold w-8 shrink-0 text-center mt-0.5"
        style={{ color: '#888' }}
      >
        {entry.position}
      </span>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-white truncate">{entry.song?.title ?? '—'}</span>
          <span style={{ color: '#888' }} className="text-sm truncate">
            {entry.song?.artist}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-2">
          {/* Votes */}
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#0d3320', color: '#1DB954' }}
          >
            {entry.votes} votos
          </span>

          {/* Tier */}
          {entry.tier !== 'free' && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#2a2000', color: '#f5a623' }}
            >
              {TIER_LABELS[entry.tier]}
            </span>
          )}

          {/* Bizum pending */}
          {hasBizumPending && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse"
              style={{ backgroundColor: '#3a1a00', color: '#fb923c' }}
            >
              💰 Bizum pendiente
            </span>
          )}
        </div>

        {/* Dedication */}
        {entry.dedication && (
          <p className="text-sm italic mb-2" style={{ color: '#888' }}>
            &ldquo;{entry.dedication}&rdquo;
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-1">
          {entry.status === 'pending' && (
            <button
              onClick={() => onAction(entry.id, { status: 'playing' })}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-black transition-opacity active:opacity-70"
              style={{ backgroundColor: '#1DB954' }}
            >
              ▶ Tocar
            </button>
          )}

          {entry.status === 'playing' && (
            <button
              onClick={() => onAction(entry.id, { status: 'played' })}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-black transition-opacity active:opacity-70"
              style={{ backgroundColor: '#1DB954' }}
            >
              ✓ Tocada
            </button>
          )}

          {hasBizumPending && (
            <button
              onClick={() => onAction(entry.id, { bizum_confirmed: true })}
              className="px-3 py-2 rounded-lg text-sm font-semibold transition-opacity active:opacity-70"
              style={{ backgroundColor: '#3a1a00', color: '#fb923c', border: '1px solid #f97316' }}
            >
              💰 Confirmar Bizum
            </button>
          )}

          <button
            onClick={() => onDelete(entry.id)}
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-opacity active:opacity-70"
            style={{ backgroundColor: '#2a0a0a', color: '#ef4444', border: '1px solid #7f1d1d' }}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}
