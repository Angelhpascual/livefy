'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { useActiveEvent } from '@/features/realtime/useActiveEvent'
import { useSetlist } from '@/features/realtime/useSetlist'
import { SetlistCard } from '@/features/admin/SetlistCard'
import { LyricsPanel } from '@/features/admin/LyricsPanel'
import { AddToSetlistModal } from '@/features/admin/AddToSetlistModal'
import { CreateEventForm } from '@/features/admin/CreateEventForm'
import { apiFetch } from '@/lib/api'

export default function AdminPage() {
  const { event, loading: eventLoading } = useActiveEvent()
  const { entries, loading: setlistLoading } = useSetlist(event?.id ?? '')
  const [showAddModal, setShowAddModal] = useState(false)

  const pendingEntries = entries.filter((e) => e.status === 'pending')
  const playingEntry = entries.find((e) => e.status === 'playing') ?? null
  const playedEntries = entries.filter((e) => e.status === 'played')
  const pendingBizum = entries.filter((e) => e.tier !== 'free' && !e.bizum_confirmed).length

  async function handleAction(id: string, body: Record<string, unknown>) {
    try {
      await apiFetch(`/api/admin/setlist/${id}`, { method: 'PATCH', body })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/admin/setlist/${id}`, { method: 'DELETE' })
      toast('Eliminada del setlist')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#0a0a0a' }}>
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
          <Link href="/admin/events" className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}>
            📅 Eventos
          </Link>
          <Link href="/admin/songs" className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}>
            🎵 Repertorio
          </Link>
          <Link href="/admin/stats" className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}>
            📊 Stats
          </Link>
          <Link href="/admin/suggestions" className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}>
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
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-4 rounded-xl font-bold text-black text-lg mb-6 transition-opacity active:opacity-70"
            style={{ backgroundColor: '#1DB954' }}
          >
            ＋ Añadir canción
          </button>

          {playingEntry && (
            <section className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1DB954' }}>
                Tocando ahora
              </h2>
              <SetlistCard entry={playingEntry} onAction={handleAction} onDelete={handleDelete} />
            </section>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
                Pendientes <span style={{ color: '#555' }}>({pendingEntries.length})</span>
              </h2>
              {setlistLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : pendingEntries.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#444' }}>Sin canciones pendientes</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingEntries.map((entry) => (
                    <SetlistCard key={entry.id} entry={entry} onAction={handleAction} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1DB954' }}>
                Tocadas <span style={{ color: '#555' }}>({playedEntries.length})</span>
              </h2>
              {playedEntries.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: '#444' }}>Aún no has tocado nada</p>
              ) : (
                <div className="flex flex-col gap-2 opacity-70">
                  {playedEntries.map((entry) => (
                    <SetlistCard key={entry.id} entry={entry} onAction={handleAction} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {playingEntry && <LyricsPanel entry={playingEntry} />}

      {showAddModal && (
        <AddToSetlistModal
          currentEntries={entries}
          onClose={() => setShowAddModal(false)}
          onAdded={() => toast('Canción añadida al setlist')}
        />
      )}
    </div>
  )
}
