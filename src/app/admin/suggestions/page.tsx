'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Suggestion = {
  id: string
  title: string
  artist: string | null
  created_at: string
  event: { name: string; date: string } | null
}

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchSuggestions() {
    const res = await fetch('/api/admin/suggestions')
    const data = await res.json() as Suggestion[]
    setSuggestions(data)
    setLoading(false)
  }

  useEffect(() => { void fetchSuggestions() }, [])

  async function handleDelete(id: string) {
    await fetch('/api/admin/suggestions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 px-4 py-4 flex items-center gap-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <Link href="/admin" className="text-gray-500 hover:text-white transition-colors text-sm">← Admin</Link>
        <h1 className="text-xl font-bold text-[#1DB954]">Sugerencias</h1>
        <span className="text-sm ml-auto" style={{ color: '#555' }}>{suggestions.length} sugerencias</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-20">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center pt-20">
            <p className="text-4xl mb-4">💡</p>
            <p className="text-gray-500">Aún no hay sugerencias</p>
            <p className="text-gray-600 text-sm mt-1">Aparecerán aquí cuando los clientes sugieran canciones</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-4 flex items-center justify-between gap-4"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              >
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{s.title}</p>
                  {s.artist && <p className="text-sm truncate" style={{ color: '#888' }}>{s.artist}</p>}
                  <p className="text-xs mt-1" style={{ color: '#444' }}>
                    {s.event ? `${s.event.name} · ` : ''}
                    {new Date(s.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[#333] text-gray-500 hover:text-red-400 hover:border-red-400 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
