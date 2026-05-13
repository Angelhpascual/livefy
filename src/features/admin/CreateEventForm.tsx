'use client'

import { useState, FormEvent } from 'react'
import type { Event } from '@/types'

interface CreateEventFormProps {
  onCreated: (event: Event) => void
}

export function CreateEventForm({ onCreated }: CreateEventFormProps) {
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

  const inputClass = "w-full px-4 py-3 rounded-lg border text-white placeholder-gray-600 focus:outline-none transition-colors"
  const inputStyle = { backgroundColor: '#0a0a0a', borderColor: '#333' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#1DB954')
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#333')

  return (
    <div className="max-w-md mx-auto mt-8 px-4">
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
        <h2 className="text-white text-lg font-bold mb-4">Crear nuevo evento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: '#888' }}>Nombre del evento *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viernes en La Bodega"
              className={inputClass}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#888' }}>Fecha *</label>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#888' }}>Número Bizum (opcional)</label>
            <input
              value={bizumNumber}
              onChange={(e) => setBizumNumber(e.target.value)}
              placeholder="666 000 000"
              className={inputClass}
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
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
