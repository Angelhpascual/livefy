'use client'

import { useState, FormEvent, useRef, ChangeEvent } from 'react'
import { Song } from '@/types'

interface SongFormProps {
  song?: Song
  onSuccess: () => void
}

interface ImageItem {
  url: string
  uploading?: boolean
}

export function SongForm({ song, onSuccess }: SongFormProps) {
  const [title, setTitle] = useState(song?.title ?? '')
  const [artist, setArtist] = useState(song?.artist ?? '')
  const [lyrics, setLyrics] = useState(song?.lyrics ?? '')
  const [images, setImages] = useState<ImageItem[]>(
    (song?.image_urls ?? []).map((url) => ({ url }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = Boolean(song)

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/songs/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Error uploading image')
    }
    const data = await res.json()
    return data.url as string
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const available = 2 - images.filter((img) => !img.uploading).length
    const toUpload = files.slice(0, available)

    if (toUpload.length === 0) {
      setError('Ya tienes el máximo de 2 imágenes.')
      return
    }

    // Add placeholders
    const placeholders: ImageItem[] = toUpload.map(() => ({ url: '', uploading: true }))
    setImages((prev) => [...prev, ...placeholders])

    const uploadedUrls: (string | null)[] = await Promise.all(
      toUpload.map(async (file) => {
        try {
          return await uploadFile(file)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error subiendo imagen')
          return null
        }
      })
    )

    setImages((prev) => {
      const withoutPlaceholders = prev.filter((img) => !img.uploading)
      const newItems: ImageItem[] = uploadedUrls
        .filter((url): url is string => url !== null)
        .map((url) => ({ url }))
      return [...withoutPlaceholders, ...newItems]
    })

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/songs/${song!.id}` : '/api/songs'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artist,
          lyrics: lyrics || null,
          image_urls: images.map((img) => img.url),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error saving song')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-[#1DB954] transition-colors duration-200'

  const canAddMore = images.length < 2
  const isUploading = images.some((img) => img.uploading)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Título <span className="text-[#1DB954]">*</span>
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la canción"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Artista <span className="text-[#1DB954]">*</span>
        </label>
        <input
          type="text"
          required
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Nombre del artista"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Letra <span className="text-gray-600">(opcional — para cuando te sabes los acordes de memoria)</span>
        </label>
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder={"Verso 1:\nAquí va la letra...\n\nEstribillo:\n..."}
          rows={8}
          className={`${inputClass} font-mono text-sm resize-y`}
        />
      </div>

      {/* Image upload zone */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Imágenes de partitura{' '}
          <span className="text-gray-600">(máx. 2)</span>
        </label>

        {/* Thumbnails */}
        {images.length > 0 && (
          <div className="flex gap-2 mb-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#333] bg-[#1a1a1a] flex items-center justify-center"
              >
                {img.uploading ? (
                  <svg
                    className="animate-spin w-6 h-6 text-[#1DB954]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Partitura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-0.5 right-0.5 bg-black/70 rounded-full w-5 h-5 flex items-center justify-center text-white hover:bg-black transition-colors"
                      aria-label="Eliminar imagen"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-[#1DB954] bg-[#1a1a1a] rounded-lg px-4 py-6 text-center text-gray-400 hover:text-white hover:bg-[#222] transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-2 text-[#1DB954]"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-sm">
              Sube hasta {2 - images.length} imagen{2 - images.length !== 1 ? 'es' : ''} de la partitura
            </span>
            <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WebP · máx. 5MB</p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || isUploading}
        className="w-full bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors duration-200"
      >
        {loading
          ? 'Guardando...'
          : isUploading
          ? 'Subiendo imágenes...'
          : isEditing
          ? 'Actualizar canción'
          : 'Crear canción'}
      </button>
    </form>
  )
}
