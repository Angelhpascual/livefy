'use client'

import { useState } from 'react'
import type { SetlistEntry, Tier } from '@/types'

interface VotingModalProps {
  entry: SetlistEntry
  bizumNumber: string | null
  onConfirm: (tier: Tier, dedication?: string) => void
  onClose: () => void
}

export function VotingModal({ entry, bizumNumber, onConfirm, onClose }: VotingModalProps) {
  const [withDedication, setWithDedication] = useState(false)
  const [dedication, setDedication] = useState('')
  const [showBizum, setShowBizum] = useState(false)

  const song = entry.song
  const title = song?.title ?? 'Canción'
  const artist = song?.artist ?? ''

  function handleFreeVote() {
    onConfirm('free', undefined)
  }

  function handleDedicationVote() {
    if (!withDedication) {
      setWithDedication(true)
      return
    }
    setShowBizum(true)
  }

  function handleConfirmDedication() {
    onConfirm('priority', dedication.trim() || undefined)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voting-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 flex flex-col gap-4"
        style={{ backgroundColor: '#141414' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: '#333' }} />

        {/* Song info */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p id="voting-modal-title" className="text-white font-bold text-base leading-tight truncate">{title}</p>
            <p className="text-sm truncate" style={{ color: '#888' }}>{artist}</p>
          </div>
          <button onClick={onClose} className="text-2xl shrink-0" style={{ color: '#555' }} aria-label="Cerrar">×</button>
        </div>

        {!showBizum ? (
          <>
            {/* Option 1: Free vote */}
            <button
              onClick={handleFreeVote}
              className="w-full rounded-2xl py-4 flex items-center justify-between px-4 active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#1DB954' }}
            >
              <div className="text-left">
                <p className="text-black font-bold text-sm">Votar gratis</p>
                <p className="text-black/60 text-xs">Sube en el ranking según votos</p>
              </div>
              <span className="text-black text-xl">♥</span>
            </button>

            {/* Option 2: Vote + dedication */}
            {!withDedication ? (
              <button
                onClick={handleDedicationVote}
                className="w-full rounded-2xl py-4 flex items-center justify-between px-4 active:scale-[0.98] transition-transform"
                style={{ backgroundColor: '#1a1a1a', border: '1.5px solid #333' }}
              >
                <div className="text-left">
                  <p className="text-white font-bold text-sm">Votar con dedicatoria</p>
                  <p className="text-xs" style={{ color: '#888' }}>1€ por Bizum · Con mensaje especial</p>
                </div>
                <span className="text-lg" style={{ color: '#f59e0b' }}>✉</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  aria-label="Dedicatoria"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="Escribe tu dedicatoria..."
                  rows={2}
                  maxLength={120}
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1.5px solid #1DB954' }}
                />
                <button
                  onClick={handleDedicationVote}
                  disabled={!dedication.trim()}
                  className="w-full rounded-2xl py-4 flex items-center justify-between px-4 active:scale-[0.98] transition-transform disabled:opacity-40"
                  style={{ backgroundColor: '#f59e0b' }}
                >
                  <div className="text-left">
                    <p className="text-black font-bold text-sm">Continuar con Bizum</p>
                    <p className="text-black/60 text-xs">1€ · {bizumNumber ?? 'Ver número'}</p>
                  </div>
                  <span className="text-black font-bold">→</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* Bizum instructions */
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ backgroundColor: '#1a1a1a', border: '1.5px solid #f59e0b30' }}>
              <p className="text-white font-bold text-sm">Envía 1€ por Bizum</p>
              {bizumNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#888' }}>Número</span>
                  <span className="font-mono font-bold text-white text-sm">{bizumNumber}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#888' }}>Concepto</span>
                <span className="font-mono font-bold text-sm" style={{ color: '#f59e0b' }}>
                  LIVEFY-{title.slice(0, 4).toUpperCase()}
                </span>
              </div>
              {dedication && (
                <div className="mt-1 pt-2" style={{ borderTop: '1px solid #333' }}>
                  <p className="text-xs italic" style={{ color: '#888' }}>&quot;{dedication}&quot;</p>
                </div>
              )}
            </div>
            <p className="text-xs text-center" style={{ color: '#555' }}>
              Haz el Bizum y pulsa confirmar. El músico lo verificará.
            </p>
            <button
              onClick={handleConfirmDedication}
              className="w-full rounded-2xl py-4 font-bold text-sm text-black active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#f59e0b' }}
            >
              He hecho el Bizum ✓
            </button>
            <button onClick={() => setShowBizum(false)} className="text-xs text-center" style={{ color: '#555' }}>
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
