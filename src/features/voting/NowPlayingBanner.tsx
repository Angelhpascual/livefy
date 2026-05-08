'use client'

import { useState, useEffect } from 'react'
import type { SetlistEntry } from '@/types'

interface NowPlayingBannerProps {
  nowPlaying: SetlistEntry | null
}

function AlbumArt({ artworkUrl, title, artist }: { artworkUrl: string | null; title: string; artist: string }) {
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
        className="rounded-lg object-cover shrink-0"
        style={{ width: 60, height: 60 }}
        onError={() => setErrorUrl(displayUrl)}
      />
    )
  }

  const colors = ['#1DB954', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
  const bg = colors[title.charCodeAt(0) % colors.length]
  return (
    <div
      className="rounded-lg shrink-0 flex items-center justify-center text-lg font-black"
      style={{ width: 60, height: 60, background: `linear-gradient(135deg, ${bg}aa, ${bg}44)`, color: '#fff' }}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  )
}

export function NowPlayingBanner({ nowPlaying }: NowPlayingBannerProps) {
  if (!nowPlaying || !nowPlaying.song) return null

  const { title, artist, artwork_url } = nowPlaying.song

  return (
    <>
      <style>{`
        @keyframes eq-bar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .eq-bar-1 { animation: eq-bar 0.8s ease-in-out infinite; animation-delay: 0s; }
        .eq-bar-2 { animation: eq-bar 0.8s ease-in-out infinite; animation-delay: 0.2s; }
        .eq-bar-3 { animation: eq-bar 0.8s ease-in-out infinite; animation-delay: 0.4s; }
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .live-pulse { animation: live-pulse 1.4s ease-in-out infinite; }
        @keyframes banner-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .banner-in { animation: banner-in 0.4s ease-out both; }
      `}</style>

      <div
        className="banner-in w-full"
        style={{
          background: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)',
          borderBottom: '1px solid #1DB95430',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          {/* Album art */}
          <AlbumArt artworkUrl={artwork_url} title={title} artist={artist} />

          {/* Song info + EQ bars */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate leading-tight">{title}</p>
            <p className="text-xs truncate mt-0.5 leading-tight" style={{ color: '#888' }}>
              {artist}
            </p>
            {/* Equalizer bars */}
            <div className="flex items-end gap-0.5 mt-2" style={{ height: 12 }}>
              <div
                className="eq-bar-1 rounded-sm origin-bottom"
                style={{ width: 3, height: 12, backgroundColor: '#1DB954' }}
              />
              <div
                className="eq-bar-2 rounded-sm origin-bottom"
                style={{ width: 3, height: 12, backgroundColor: '#1DB954' }}
              />
              <div
                className="eq-bar-3 rounded-sm origin-bottom"
                style={{ width: 3, height: 12, backgroundColor: '#1DB954' }}
              />
            </div>
          </div>

          {/* EN DIRECTO badge */}
          <div
            className="live-pulse shrink-0 px-2 py-1 rounded-md text-xs font-black tracking-wider"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            EN DIRECTO
          </div>
        </div>
      </div>
    </>
  )
}
