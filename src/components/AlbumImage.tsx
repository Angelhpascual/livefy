'use client'

import { useState, useEffect } from 'react'

interface AlbumImageProps {
  artworkUrl?: string | null
  artist: string
  title?: string
  size?: number | 'full' // 'full' = w-full aspect-square
  rounded?: 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const FALLBACK_COLORS = [
  '#1DB954', '#3b82f6', '#f59e0b', '#ec4899',
  '#8b5cf6', '#06b6d4', '#ef4444', '#9c27b0',
  '#03a9f4', '#ff5722', '#ff9800', '#607d8b',
]

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

function getInitials(artist: string): string {
  return artist.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const ROUNDED: Record<string, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
}

export function AlbumImage({
  artworkUrl,
  artist,
  title,
  size = 48,
  rounded = 'lg',
  className = '',
}: AlbumImageProps) {
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null)
  const [errorUrl, setErrorUrl] = useState<string | null>(null)

  useEffect(() => {
    if (artworkUrl) return
    const params = new URLSearchParams({ artist })
    if (title) params.set('title', title)
    fetch(`/api/artist-image?${params}`)
      .then(r => r.json())
      .then((d: { url: string | null }) => { if (d.url) setFetchedUrl(d.url) })
      .catch(() => {})
  }, [artworkUrl, artist, title])

  const displayUrl = artworkUrl ?? fetchedUrl
  const hasError = displayUrl !== null && displayUrl === errorUrl
  const roundedClass = ROUNDED[rounded] ?? 'rounded-lg'
  const isFull = size === 'full'
  const sizeStyle = isFull ? {} : { width: size, height: size }
  const sizeClass = isFull ? 'w-full aspect-square' : 'shrink-0'

  if (displayUrl && !hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={displayUrl}
        alt={title ?? artist}
        className={`object-cover ${sizeClass} ${roundedClass} ${className}`}
        style={sizeStyle}
        onError={() => setErrorUrl(displayUrl)}
      />
    )
  }

  const bg = getColor(artist)
  const fontSize = isFull ? undefined : Math.round((size as number) * 0.35)

  return (
    <div
      className={`flex items-center justify-center font-bold text-black select-none ${sizeClass} ${roundedClass} ${className}`}
      style={{ ...sizeStyle, backgroundColor: bg, fontSize }}
    >
      {getInitials(artist)}
    </div>
  )
}
