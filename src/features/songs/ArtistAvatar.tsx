'use client'

import { useState, useEffect } from 'react'

interface ArtistAvatarProps {
  artist: string
  title?: string
  artworkUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

function getColor(name: string): string {
  const colors = [
    '#1DB954', '#e91e63', '#9c27b0', '#3f51b5',
    '#03a9f4', '#ff5722', '#ff9800', '#607d8b',
    '#8bc34a', '#f44336', '#00bcd4', '#673ab7',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const sizes = {
  sm: { container: 'w-10 h-10', text: 'text-xs' },
  md: { container: 'w-full aspect-square', text: 'text-2xl' },
  lg: { container: 'w-20 h-20', text: 'text-xl' },
}

export function ArtistAvatar({ artist, title, artworkUrl, size = 'md' }: ArtistAvatarProps) {
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null)
  const [errorUrl, setErrorUrl] = useState<string | null>(null)
  const { container, text } = sizes[size]

  useEffect(() => {
    if (artworkUrl) return
    const params = new URLSearchParams({ artist })
    if (title) params.set('title', title)
    fetch(`/api/artist-image?${params}`)
      .then((r) => r.json())
      .then((d: { url: string | null }) => { if (d.url) setFetchedUrl(d.url) })
      .catch(() => {})
  }, [artist, title, artworkUrl])

  const imgUrl = artworkUrl ?? fetchedUrl
  const imgError = imgUrl !== null && imgUrl === errorUrl

  if (!imgUrl || imgError) {
    return (
      <div
        className={`${container} rounded-xl flex items-center justify-center font-bold text-black select-none`}
        style={{ backgroundColor: getColor(artist) }}
      >
        <span className={text}>{getInitials(artist)}</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgUrl}
      alt={artist}
      className={`${container} rounded-xl object-cover`}
      onError={() => setErrorUrl(imgUrl)}
    />
  )
}
