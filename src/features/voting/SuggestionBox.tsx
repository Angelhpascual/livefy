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
      // silent fail
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-4 mt-2 mb-6 rounded-2xl p-5 text-center bg-accent-bg border border-accent-dim">
        <p className="text-2xl mb-2">🎸</p>
        <p className="text-white font-semibold text-sm">¡Gracias por tu sugerencia!</p>
        <p className="text-xs mt-1 text-accent">La tendré en cuenta para el próximo evento</p>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none bg-surface border border-border focus:border-accent-dim transition-colors caretColor-accent"

  return (
    <div className="mx-4 mt-2 mb-6 rounded-2xl p-5 bg-surface-overlay border border-border-subtle">
      <p className="text-white font-bold text-sm mb-1">💡 ¿Echas de menos alguna canción?</p>
      <p className="text-xs mb-4 text-faint">Sugiérela para el próximo evento</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre de la canción *"
          maxLength={100}
          required
          className={inputClass}
        />
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artista (opcional)"
          maxLength={100}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40 active:scale-[0.98] bg-accent text-black"
        >
          {loading ? 'Enviando...' : 'Enviar sugerencia'}
        </button>
      </form>
    </div>
  )
}
