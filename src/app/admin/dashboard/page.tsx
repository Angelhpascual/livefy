'use client'

import Link from 'next/link'
import { useActiveEvent } from '@/features/realtime/useActiveEvent'

const links = [
  {
    href: '/',
    emoji: '🎵',
    label: 'Vista Comensal',
    description: 'Lo que ve la gente al escanear el QR',
    external: true,
  },
  {
    href: '/admin',
    emoji: '🎛',
    label: 'Panel Setlist',
    description: 'Gestiona el setlist en directo',
  },
  {
    href: '/admin/events',
    emoji: '📅',
    label: 'Eventos',
    description: 'Crea, activa o elimina eventos',
  },
  {
    href: '/admin/songs',
    emoji: '🎸',
    label: 'Repertorio',
    description: 'Añade canciones con letra y partitura',
  },
  {
    href: '/admin/stats',
    emoji: '📊',
    label: 'Estadísticas',
    description: 'Historial y análisis de tus actuaciones',
  },
]

export default function DashboardPage() {
  const { event, loading } = useActiveEvent()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-[#1DB954] mb-1 tracking-tight">Livefy</h1>
      <p className="text-gray-500 text-sm mb-2">Panel de control</p>

      {/* Evento activo */}
      <div className="mb-10 h-6">
        {!loading && (
          event ? (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#0d3320] text-[#1DB954] border border-[#1DB954]/30">
              ● Evento activo: {event.name}
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1a1a1a] text-gray-500 border border-[#333]">
              Sin evento activo
            </span>
          )
        )}
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            className="bg-[#1a1a1a] border border-[#333] hover:border-[#1DB954] rounded-2xl p-5 flex items-start gap-4 transition-colors group"
          >
            <span className="text-3xl">{link.emoji}</span>
            <div>
              <p className="text-white font-semibold group-hover:text-[#1DB954] transition-colors">
                {link.label}
              </p>
              <p className="text-gray-500 text-sm mt-0.5">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-gray-700 text-xs mt-10">
        <Link href="/admin/login" className="hover:text-gray-500 transition-colors">cerrar sesión</Link>
      </p>
    </div>
  )
}
