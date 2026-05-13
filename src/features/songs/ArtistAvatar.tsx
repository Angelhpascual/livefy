'use client'

import { AlbumImage } from '@/components/AlbumImage'

interface ArtistAvatarProps {
  artist: string
  title?: string
  artworkUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = { sm: 40, md: 'full' as const, lg: 80 }

export function ArtistAvatar({ artist, title, artworkUrl, size = 'md' }: ArtistAvatarProps) {
  return (
    <AlbumImage
      artworkUrl={artworkUrl}
      artist={artist}
      title={title}
      size={SIZE_MAP[size]}
      rounded="xl"
    />
  )
}
