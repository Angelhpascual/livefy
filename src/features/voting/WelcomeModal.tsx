'use client'

import { Logo } from '@/components/Logo'
import { MAX_VOTES } from './useVoting'

interface WelcomeModalProps {
  eventName: string
  onDismiss: () => void
}

export function WelcomeModal({ eventName, onDismiss }: WelcomeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
        style={{ backgroundColor: '#141414', border: '1px solid #1DB95440' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Logo size={56} showText={false} />
        <div>
          <h1 className="font-display text-2xl font-black text-white">Bienvenido a</h1>
          <h2 className="font-display text-2xl font-black" style={{ color: '#1DB954' }}>{eventName}</h2>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <p className="text-4xl font-black text-white">{MAX_VOTES}</p>
            <p className="text-sm mt-1" style={{ color: '#888' }}>votos para repartir</p>
          </div>
          <p className="text-sm" style={{ color: '#666' }}>
            Vota las canciones que quieres escuchar. Las más votadas subirán en la lista.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
          style={{ backgroundColor: '#1DB954', color: '#000' }}
        >
          ¡Empezar a votar!
        </button>
      </div>
    </div>
  )
}
