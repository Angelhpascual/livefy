'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Song, SetlistEntry } from '@/types'

interface Props {
  currentEntries: SetlistEntry[]
  onClose: () => void
  onAdded: () => void
}

export function AddToSetlistModal({ currentEntries, onClose, onAdded }: Props) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [error, setError] = useState('')

  const existingIds = useMemo(
    () => new Set(currentEntries.map((e) => e.song_id)),
    [currentEntries]
  )

  useEffect(() => {
    fetch('/api/songs')
      .then((r) => r.json())
      .then((data: Song[]) => {
        setSongs(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Error cargando canciones')
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return songs.filter(
      (s) =>
        !existingIds.has(s.id) &&
        (q === '' || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    )
  }, [songs, search, existingIds])

  async function handleAdd(songId: string) {
    setAdding(songId)
    setError('')
    try {
      const res = await fetch('/api/admin/setlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error')
      }
      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col max-h-[85vh]"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-white text-lg font-bold">Añadir al setlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar canción..."
            autoFocus
            className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-600 focus:outline-none transition-colors"
            style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#1DB954')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
          />
        </div>

        {error && (
          <p className="px-5 pb-2 text-sm text-red-400 shrink-0">{error}</p>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10" style={{ color: '#888' }}>
              {songs.filter((s) => !existingIds.has(s.id)).length === 0
                ? 'Todas las canciones ya están en el setlist'
                : 'Sin resultados'}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleAdd(song.id)}
                  disabled={adding === song.id}
                  className="flex items-center justify-between w-full text-left px-4 py-3 rounded-xl transition-colors active:opacity-70 disabled:opacity-50"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}
                >
                  <div>
                    <p className="text-white font-medium">{song.title}</p>
                    <p className="text-sm" style={{ color: '#888' }}>{song.artist}</p>
                  </div>
                  {adding === song.id ? (
                    <div className="w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span style={{ color: '#1DB954' }} className="text-xl font-bold">+</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
