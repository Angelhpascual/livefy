'use client'

import { useState } from 'react'
import type { SetlistEntry } from '@/types'
import { ScoreViewer } from '@/features/songs/ScoreViewer'

interface Props {
  entry: SetlistEntry | null
}

export function LyricsPanel({ entry }: Props) {
  const [minimized, setMinimized] = useState(false)

  // Pill flotante cuando está minimizado — siempre visible si hay canción tocando
  if (entry?.song && minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl font-semibold text-black shadow-lg"
        style={{ backgroundColor: '#1DB954' }}
      >
        🎵 Ver letra — {entry.song.title}
      </button>
    )
  }

  if (!entry?.song) return null

  const { song } = entry
  const hasContent = (song.image_urls ?? []).length > 0 || song.lyrics

  if (!hasContent) {
    return (
      <button
        onClick={() => {}}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl font-semibold text-black shadow-lg opacity-40 cursor-default"
        style={{ backgroundColor: '#1DB954' }}
      >
        🎵 {song.title} — sin partitura
      </button>
    )
  }

  return (
    <ScoreViewer
      song={song}
      onClose={() => setMinimized(true)}
    />
  )
}
