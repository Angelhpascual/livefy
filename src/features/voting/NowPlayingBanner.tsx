'use client'

import type { SetlistEntry } from '@/types'
import { AlbumImage } from '@/components/AlbumImage'

interface NowPlayingBannerProps {
  nowPlaying: SetlistEntry | null
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
          <AlbumImage artworkUrl={artwork_url} artist={artist} title={title} size={60} rounded="lg" />

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate leading-tight">{title}</p>
            <p className="text-xs truncate mt-0.5 leading-tight" style={{ color: '#888' }}>{artist}</p>
            <div className="flex items-end gap-0.5 mt-2" style={{ height: 12 }}>
              <div className="eq-bar-1 rounded-sm origin-bottom" style={{ width: 3, height: 12, backgroundColor: '#1DB954' }} />
              <div className="eq-bar-2 rounded-sm origin-bottom" style={{ width: 3, height: 12, backgroundColor: '#1DB954' }} />
              <div className="eq-bar-3 rounded-sm origin-bottom" style={{ width: 3, height: 12, backgroundColor: '#1DB954' }} />
            </div>
          </div>

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
