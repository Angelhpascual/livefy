'use client'

import { useState } from 'react'

interface SuggestionBoxProps {
  sessionId: string
}

export function SuggestionBox({ sessionId }: SuggestionBoxProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, sessionId }),
      })
    } catch {
      // silent fail — show success anyway to not frustrate the user
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-4 mt-2 mb-6 rounded-2xl p-5 text-center" style={{ backgroundColor: '#0d1f0d', border: '1px solid #1DB95430' }}>
        <p className="text-2xl mb-2">🎸</p>
        <p className="text-white font-semibold text-sm">¡Gracias por tu sugerencia!</p>
        <p className="text-xs mt-1" style={{ color: '#1DB954' }}>La tendré en cuenta para el próximo evento</p>
      </div>
    )
  }

  return (
    <div className="mx-4 mt-2 mb-6 rounded-2xl p-5" style={{ backgroundColor: '#141414', border: '1px solid #222' }}>
      <p className="text-white font-bold text-sm mb-1">💡 ¿Echas de menos alguna canción?</p>
      <p className="text-xs mb-4" style={{ color: '#555' }}>Sugiérela para el próximo evento</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la canción *"
          maxLength={100}
          required
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', caretColor: '#1DB954' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#1DB95466')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
        />
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artista (opcional)"
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', caretColor: '#1DB954' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#1DB95466')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 active:scale-[0.98]"
          style={{ backgroundColor: '#1DB954', color: '#000' }}
        >
          {loading ? 'Enviando...' : 'Enviar sugerencia'}
        </button>
      </form>
    </div>
  )
}
