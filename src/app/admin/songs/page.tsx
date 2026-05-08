'use client'

import { useState, useMemo } from 'react'
import { Song } from '@/types'
import { useSongs } from '@/features/songs/useSongs'
import { SongCard } from '@/features/songs/SongCard'
import { SongForm } from '@/features/songs/SongForm'

export default function AdminSongsPage() {
  const { songs, loading, refetch } = useSongs()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return songs
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q)
    )
  }, [songs, search])

  function openNew() {
    setEditingSong(undefined)
    setModalOpen(true)
  }

  function openEdit(song: Song) {
    setEditingSong(song)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingSong(undefined)
  }

  function handleSuccess() {
    closeModal()
    refetch()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Repertorio
            {!loading && (
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}>
                {songs.length}
              </span>
            )}
          </h1>
          <button
            onClick={openNew}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
          >
            + Nueva canción
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título o artista..."
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-[#1DB954] transition-colors duration-200 mb-6"
        />

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {songs.length === 0 ? (
              <>
                <p className="text-gray-400 text-lg">No tienes canciones aún.</p>
                <p className="text-gray-600 text-sm mt-2">
                  Pulsa &quot;Nueva canción&quot; para añadir la primera.
                </p>
              </>
            ) : (
              <p className="text-gray-400 text-lg">
                No se encontraron canciones con &quot;{search}&quot;.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onEdit={openEdit}
                onDeleted={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-bold">
                {editingSong ? 'Editar canción' : 'Nueva canción'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <SongForm song={editingSong} onSuccess={handleSuccess} />
          </div>
        </div>
      )}
    </div>
  )
}
