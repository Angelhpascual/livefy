'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type TopSong = {
  title: string
  artist: string
  votes: number
  eventCount: number
}

type EventStat = {
  id: string
  name: string
  date: string
  totalVotes: number
  totalDedications: number
  topSong: { title: string; artist: string; votes: number } | null
  songsPlayed: number
}

type StatsData = {
  events: EventStat[]
  allTime: {
    totalEvents: number
    totalVotes: number
    totalDedications: number
    topSongs: TopSong[]
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: TopSong }[] }) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0].payload
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm shadow-xl"
      style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
    >
      <p className="font-semibold">{data.title}</p>
      <p style={{ color: '#888' }}>{data.artist}</p>
      <p className="mt-1" style={{ color: '#1DB954' }}>{payload[0].value} votos</p>
    </div>
  )
}

function StatCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-display text-3xl font-bold text-white">{value}</span>
      <span className="text-xs" style={{ color: '#888' }}>{label}</span>
    </div>
  )
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json() as Promise<StatsData & { error?: string }>)
      .then((d) => {
        if ('error' in d && d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  const hasData = data && data.allTime.totalEvents > 0

  const chartData = (data?.allTime.topSongs ?? []).slice(0, 8).map((s) => ({
    ...s,
    name: `${s.title} — ${s.artist}`,
  }))

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-4 flex items-center gap-4 border-b"
        style={{ backgroundColor: '#0a0a0a', borderColor: '#1a1a1a' }}
      >
        <Link
          href="/admin"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-lg transition-colors"
          style={{ backgroundColor: '#1a1a1a', color: '#888', border: '1px solid #333' }}
        >
          ←
        </Link>
        <h1 className="font-display text-xl font-bold" style={{ color: '#1DB954' }}>
          Estadísticas
        </h1>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="max-w-lg mx-auto px-4 pt-12 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasData && (
        <div className="flex flex-col items-center justify-center pt-24 px-6 text-center gap-4">
          <span className="text-6xl">📊</span>
          <h2 className="font-display text-2xl font-bold text-white">Aún no hay datos</h2>
          <p className="text-sm max-w-xs" style={{ color: '#888' }}>
            Tus estadísticas aparecerán aquí después de tu primera actuación
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && hasData && data && (
        <main className="max-w-2xl mx-auto px-4 pt-6 space-y-8">

          {/* Resumen global */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              Resumen global
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard emoji="🎤" value={data.allTime.totalEvents} label="Total eventos" />
              <StatCard emoji="♥" value={data.allTime.totalVotes} label="Total votos" />
              <StatCard emoji="✉" value={data.allTime.totalDedications} label="Dedicatorias/propinas" />
              <StatCard
                emoji="🎵"
                value={data.allTime.topSongs[0]?.title ?? '—'}
                label="Canción más pedida de siempre"
              />
            </div>
          </section>

          {/* Top canciones */}
          {chartData.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#888' }}>
                Top canciones de todos los tiempos
              </h2>
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              >
                <ResponsiveContainer width="100%" height={chartData.length * 44 + 16}>
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: '#888', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{ fill: '#ccc', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill="#1DB954" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Historial de eventos */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              Historial de eventos
            </h2>
            <div className="flex flex-col gap-3">
              {data.events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-white font-semibold">{ev.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                        {new Date(ev.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 flex-wrap mb-3">
                    <span className="text-sm" style={{ color: '#888' }}>
                      <span className="text-white font-semibold">{ev.totalVotes}</span> votos
                    </span>
                    <span className="text-sm" style={{ color: '#888' }}>
                      <span className="text-white font-semibold">{ev.totalDedications}</span> dedicatorias
                    </span>
                    <span className="text-sm" style={{ color: '#888' }}>
                      <span className="text-white font-semibold">{ev.songsPlayed}</span> tocadas
                    </span>
                  </div>

                  {ev.topSong && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs" style={{ color: '#888' }}>Más pedida:</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#0d3320', color: '#1DB954', border: '1px solid #1DB954' }}
                      >
                        {ev.topSong.title} — {ev.topSong.artist}
                      </span>
                      <span className="text-xs" style={{ color: '#555' }}>{ev.topSong.votes} votos</span>
                    </div>
                  )}

                  {!ev.topSong && ev.totalVotes === 0 && (
                    <p className="text-xs" style={{ color: '#555' }}>Sin votos registrados</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  )
}
