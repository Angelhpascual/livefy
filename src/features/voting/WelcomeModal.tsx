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
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/85 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center bg-surface-overlay border border-accent-dim"
        onClick={(e) => e.stopPropagation()}
      >
        <Logo size={56} showText={false} />
        <div>
          <h1 className="font-display text-2xl font-black text-white">Bienvenido a</h1>
          <h2 className="font-display text-2xl font-black text-accent">{eventName}</h2>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <div className="rounded-2xl px-5 py-4 bg-surface border border-border">
            <p className="text-4xl font-black text-white">{MAX_VOTES}</p>
            <p className="text-sm mt-1 text-muted">votos para repartir</p>
          </div>
          <p className="text-sm text-subtle">
            Vota las canciones que quieres escuchar. Las más votadas subirán en la lista.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-transform bg-accent text-black"
        >
          ¡Empezar a votar!
        </button>
      </div>
    </div>
  )
}
