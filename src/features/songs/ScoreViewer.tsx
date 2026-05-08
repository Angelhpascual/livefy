'use client'

import { useEffect, useRef, useState } from 'react'
import { Song } from '@/types'

interface ScoreViewerProps {
  song: Song
  onClose: () => void
}

export function ScoreViewer({ song, onClose }: ScoreViewerProps) {
  const [page, setPage] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const images = song.image_urls ?? []
  const total = images.length

  const next = () => setPage((p) => Math.min(p + 1, total - 1))
  const prev = () => setPage((p) => Math.max(p - 1, 0))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        next()
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        prev()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, total])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  const hasImages = total > 0
  const hasLyrics = Boolean(song.lyrics)

  if (!hasImages && !hasLyrics) return null

  const closeButton = (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-10 text-white/70 hover:text-white bg-black/50 rounded-full p-2 transition-colors"
      aria-label="Cerrar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )

  // Lyrics-only view
  if (!hasImages && hasLyrics) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col" role="dialog" aria-modal="true">
        {closeButton}
        <div className="flex-1 overflow-y-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[#1DB954] text-2xl font-bold mb-1 text-center">{song.title}</h2>
            <p className="text-gray-400 text-sm mb-8 text-center">{song.artist}</p>
            <pre className="font-mono text-base text-white whitespace-pre-wrap leading-relaxed columns-2 gap-12">
              {song.lyrics}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  // Image view (with optional lyrics tab if both exist)
  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {closeButton}

      {/* Tab switcher if both exist */}
      {hasImages && hasLyrics && (
        <div className="flex gap-1 absolute top-4 left-4 z-10 bg-black/50 rounded-full p-1">
          <button
            onClick={() => setPage(-1)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${page === -1 ? 'bg-[#1DB954] text-black font-semibold' : 'text-white/70'}`}
          >
            Letra
          </button>
          <button
            onClick={() => setPage(0)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${page >= 0 ? 'bg-[#1DB954] text-black font-semibold' : 'text-white/70'}`}
          >
            Partitura
          </button>
        </div>
      )}

      {/* Lyrics tab */}
      {page === -1 && hasLyrics && (
        <div className="flex-1 overflow-y-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[#1DB954] text-2xl font-bold mb-1 text-center">{song.title}</h2>
            <p className="text-gray-400 text-sm mb-8 text-center">{song.artist}</p>
            <pre className="font-mono text-base text-white whitespace-pre-wrap leading-relaxed columns-2 gap-12">
              {song.lyrics}
            </pre>
          </div>
        </div>
      )}

      {/* Image tab */}
      {page >= 0 && (
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[page]}
            alt={`Partitura ${page + 1} de ${total}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>
      )}

      {/* Page nav (only if multiple images and on image tab) */}
      {total > 1 && page >= 0 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <button onClick={prev} disabled={page === 0} className="text-white/70 hover:text-white disabled:opacity-30 bg-black/50 rounded-full p-2 transition-colors" aria-label="Página anterior">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            {page + 1} / {total}
          </span>
          <button onClick={next} disabled={page === total - 1} className="text-white/70 hover:text-white disabled:opacity-30 bg-black/50 rounded-full p-2 transition-colors" aria-label="Página siguiente">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
