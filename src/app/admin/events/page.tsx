'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import type { Event } from '@/types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [bizumNumber, setBizumNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchEvents() {
    const res = await fetch('/api/admin/events')
    const data = await res.json() as Event[]
    setEvents(data)
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, bizum_number: bizumNumber || undefined }),
      })
      const data = await res.json() as Event & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setName('')
      setBizumNumber('')
      setDate(new Date().toISOString().slice(0, 10))
      setShowForm(false)
      await fetchEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(id: string) {
    await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    })
    await fetchEvents()
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    await fetchEvents()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el evento "${name}"? Se eliminarán también todas sus canciones del setlist.`)) return
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    await fetchEvents()
  }

  const inputClass = 'w-full px-4 py-3 rounded-lg border text-white placeholder-gray-600 focus:outline-none bg-[#0a0a0a] border-[#333] focus:border-[#1DB954] transition-colors'

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-4 flex items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Admin
          </Link>
          <h1 className="text-xl font-bold text-[#1DB954]">Eventos</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-black bg-[#1DB954] transition-opacity active:opacity-70"
        >
          ＋ Nuevo evento
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-20">

        {/* Create form */}
        {showForm && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 mb-6">
            <h2 className="text-white font-bold mb-4">Nuevo evento</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Nombre *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Viernes en La Bodega" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Fecha *</label>
                <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Número Bizum (opcional)</label>
                <input value={bizumNumber} onChange={(e) => setBizumNumber(e.target.value)} placeholder="648 725 622" className={inputClass} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg font-semibold text-black bg-[#1DB954] disabled:opacity-60">
                  {saving ? 'Creando...' : 'Crear y activar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-3 rounded-lg text-gray-400 border border-[#333]">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-500 pt-12">No hay eventos creados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between gap-4"
                style={{ border: ev.active ? '1px solid #1DB954' : '1px solid #333' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold truncate">{ev.name}</span>
                    {ev.active && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1DB954] text-black shrink-0">
                        ACTIVO
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {ev.bizum_number && ` · Bizum: ${ev.bizum_number}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!ev.active ? (
                    <button
                      onClick={() => handleActivate(ev.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#1DB954] text-[#1DB954] transition-colors"
                    >
                      Activar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeactivate(ev.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#555] text-gray-400 transition-colors"
                    >
                      Desactivar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(ev.id, ev.name)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#333] text-gray-500 hover:text-red-400 hover:border-red-400 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
