'use client'

import { useState } from 'react'
import { Song } from '@/types'
import { LyricsModal } from './LyricsModal'
import { ArtistAvatar } from './ArtistAvatar'

interface SongCardProps {
  song: Song
  onEdit: (song: Song) => void
  onDeleted: () => void
}

export function SongCard({ song, onEdit, onDeleted }: SongCardProps) {
  const [showLyrics, setShowLyrics] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${song.title}"?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/songs/${song.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting')
      onDeleted()
    } catch {
      alert('Error al eliminar la canción')
    } finally {
      setDeleting(false)
    }
  }

  const hasContent = (song.image_urls?.length > 0) || Boolean(song.lyrics)

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col hover:bg-[#222] transition-colors duration-200 group relative">

        {/* Artist image / avatar */}
        <div className="w-full aspect-square relative">
          <ArtistAvatar artist={song.artist} title={song.title} artworkUrl={song.artwork_url} size="md" />

          {/* Badges top-left */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {(song.image_urls ?? []).length > 0 && (
              <span className="bg-black/60 backdrop-blur-sm text-[#1DB954] text-xs font-semibold px-2 py-0.5 rounded-full">
                {song.image_urls.length}p
              </span>
            )}
            {song.lyrics && (
              <span className="bg-black/60 backdrop-blur-sm text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                A
              </span>
            )}
          </div>

          {/* Menu button top-right */}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="bg-black/60 backdrop-blur-sm text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ···
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 bg-[#2a2a2a] border border-[#444] rounded-xl overflow-hidden shadow-xl z-10 min-w-[140px]"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {hasContent && (
                  <button
                    onClick={() => { setShowLyrics(true); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#333] transition-colors"
                  >
                    {song.image_urls?.length > 0 && song.lyrics ? 'Ver letra / partitura' : song.image_urls?.length > 0 ? 'Ver partitura' : 'Ver letra'}
                  </button>
                )}
                <button
                  onClick={() => { onEdit(song); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#333] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => { handleDelete(); setMenuOpen(false) }}
                  disabled={deleting}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#333] transition-colors disabled:opacity-40"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div
          className="p-3 flex-1 cursor-pointer"
          onClick={() => hasContent && setShowLyrics(true)}
        >
          <p className="text-white font-semibold text-sm leading-tight truncate">{song.title}</p>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{song.artist}</p>
        </div>
      </div>

      {showLyrics && (
        <LyricsModal song={song} onClose={() => setShowLyrics(false)} />
      )}
    </>
  )
}
