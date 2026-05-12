'use client'

import { useState, FormEvent } from 'react'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { useActiveEvent } from '@/features/realtime/useActiveEvent'
import { useSetlist } from '@/features/realtime/useSetlist'
import { SetlistCard } from '@/features/admin/SetlistCard'
import { LyricsPanel } from '@/features/admin/LyricsPanel'
import { AddToSetlistModal } from '@/features/admin/AddToSetlistModal'
import type { Event } from '@/types'

// Toast type
type Toast = { id: number; message: string; type: 'success' | 'error' }

let toastCounter = 0

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  function addToast(message: string, type: Toast['type'] = 'success') {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  return { toasts, addToast }
}

function CreateEventForm({ onCreated }: { onCreated: (event: Event) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [bizumNumber, setBizumNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, bizum_number: bizumNumber || undefined }),
      })
      const created = await res.json() as Event & { error?: string }
      if (!res.ok) throw new Error(created.error ?? 'Error')
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
      >
        <h2 className="text-white text-lg font-bold mb-4">Crear nuevo evento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: '#888' }}>
              Nombre del evento *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viernes en La Bodega"
              className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-600 focus:outline-none transition-colors"
              style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1DB954')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#888' }}>
              Fecha *
            </label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border text-white focus:outline-none transition-colors"
              style={{ backgroundColor: '#0a0a0a', borderColor: '#333', colorScheme: 'dark' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1DB954')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#888' }}>
              Número Bizum (opcional)
            </label>
            <input
              value={bizumNumber}
              onChange={(e) => setBizumNumber(e.target.value)}
              placeholder="666 000 000"
              className="w-full px-4 py-3 rounded-lg border text-white placeholder-gray-600 focus:outline-none transition-colors"
              style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#1DB954')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#333')}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-black transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#1DB954' }}
          >
            {loading ? 'Creando...' : 'Crear y activar evento'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { event, loading: eventLoading } = useActiveEvent()
  const { entries, loading: setlistLoading } = useSetlist(event?.id ?? '')
  const [showAddModal, setShowAddModal] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const { toasts, addToast } = useToasts()

  const pendingEntries = entries.filter((e) => e.status === 'pending')
  const playingEntry = entries.find((e) => e.status === 'playing') ?? null
  const playedEntries = entries.filter((e) => e.status === 'played')
  const pendingBizum = entries.filter((e) => e.tier !== 'free' && !e.bizum_confirmed).length

  async function handleAction(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/admin/setlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Error')
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/setlist/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      addToast('Eliminada del setlist')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error', 'error')
    }
  }

  // Show LyricsPanel when something is playing
  const lyricsVisible = !!playingEntry

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
            style={{
              backgroundColor: t.type === 'error' ? '#7f1d1d' : '#0d3320',
              color: t.type === 'error' ? '#fca5a5' : '#1DB954',
              border: `1px solid ${t.type === 'error' ? '#ef4444' : '#1DB954'}`,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between border-b"
        style={{ backgroundColor: '#0a0a0a', borderColor: '#1a1a1a' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Logo size={26} showText={true} />
            {pendingBizum > 0 && (
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full animate-pulse"
                style={{ backgroundColor: '#f97316', color: '#000' }}
              >
                💰 {pendingBizum}
              </span>
            )}
          </div>
          {event && (
            <p className="text-xs mt-0.5" style={{ color: '#888' }}>
              {event.name} · {new Date(event.date).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/events"
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}
          >
            📅 Eventos
          </Link>
          <Link
            href="/admin/songs"
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}
          >
            🎵 Repertorio
          </Link>
          <Link
            href="/admin/stats"
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}
          >
            📊 Stats
          </Link>
          <Link
            href="/admin/suggestions"
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}
          >
            💡 Sugerencias
          </Link>
        </div>
      </header>

      {/* Content */}
      {eventLoading ? (
        <div className="flex justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !event ? (
        <CreateEventForm onCreated={() => window.location.reload()} />
      ) : (
        <main className="max-w-2xl mx-auto px-4 pt-6">
          {/* Add song button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 rounded-xl font-bold text-black text-lg mb-6 transition-opacity active:opacity-70"
            style={{ backgroundColor: '#1DB954' }}
          >
            ＋ Añadir canción
          </button>

          {/* Now playing */}
          {playingEntry && (
            <section className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1DB954' }}>
                Tocando ahora
              </h2>
              <SetlistCard
                entry={playingEntry}
                onAction={handleAction}
                onDelete={handleDelete}
              />
            </section>
          )}

          {/* Pendientes + Tocadas en dos columnas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Pendientes */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
                Pendientes <span style={{ color: '#555' }}>({pendingEntries.length})</span>
              </h2>
              {setlistLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingEntries.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#444' }}>
                  Sin canciones pendientes
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingEntries.map((entry) => (
                    <SetlistCard
                      key={entry.id}
                      entry={entry}
                      onAction={handleAction}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Tocadas */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1DB954' }}>
                Tocadas <span style={{ color: '#555' }}>({playedEntries.length})</span>
              </h2>
              {playedEntries.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#444' }}>
                  Aún no has tocado nada
                </p>
              ) : (
                <div className="flex flex-col gap-2 opacity-70">
                  {playedEntries.map((entry) => (
                    <SetlistCard
                      key={entry.id}
                      entry={entry}
                      onAction={handleAction}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* History placeholder — kept for future use */}
          {false && playedEntries.length > 0 && (
            <section>
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full flex items-center justify-between py-2 mb-3 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color: '#555' }}
              >
                <span>Historial ({playedEntries.length})</span>
                <span>{historyOpen ? '▲' : '▼'}</span>
              </button>
              {historyOpen && (
                <div className="flex flex-col gap-3 opacity-60">
                  {playedEntries.map((entry) => (
                    <SetlistCard
                      key={entry.id}
                      entry={entry}
                      onAction={handleAction}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {/* Lyrics panel */}
      {lyricsVisible && <LyricsPanel entry={playingEntry} />}

      {/* Add to setlist modal */}
      {showAddModal && (
        <AddToSetlistModal
          currentEntries={entries}
          onClose={() => setShowAddModal(false)}
          onAdded={() => addToast('Canción añadida al setlist')}
        />
      )}
    </div>
  )
}
