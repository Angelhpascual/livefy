'use client'

import { useState } from 'react'

interface TipJarProps {
  bizumNumber: string | null
}

const CONCEPT = 'Propina Livefy'

function buildBizumUrl(phone: string, concept: string): string {
  const clean = phone.replace(/\s/g, '')
  return `bizum://send?phone=${clean}&concept=${encodeURIComponent(concept)}`
}

function TipModal({
  bizumNumber,
  onClose,
}: {
  bizumNumber: string
  onClose: () => void
}) {
  const bizumUrl = buildBizumUrl(bizumNumber, CONCEPT)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: '#141414' }}
      >
        <div className="w-10 h-1 rounded-full mx-auto" style={{ backgroundColor: '#333' }} />

        <div className="text-center">
          <div className="text-5xl mb-3">🎸</div>
          <h2 className="text-white font-bold text-xl">Deja una propina</h2>
          <p className="text-sm mt-1" style={{ color: '#888' }}>
            Si te está gustando la música, invítame a algo
          </p>
        </div>

        {/* Info */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: '#1a1a1a', border: '1.5px solid #333' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#888' }}>Bizum</span>
            <span className="font-mono font-bold text-white text-base">{bizumNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#888' }}>Concepto</span>
            <span className="font-mono font-bold text-sm" style={{ color: '#1DB954' }}>{CONCEPT}</span>
          </div>
          <p className="text-xs" style={{ color: '#555' }}>Cantidad libre, lo que quieras</p>
        </div>

        {/* Abrir Bizum directamente */}
        <a
          href={bizumUrl}
          onClick={onClose}
          className="w-full rounded-2xl py-4 font-bold text-sm text-center active:scale-[0.98] transition-transform block"
          style={{ backgroundColor: '#1DB954', color: '#000' }}
        >
          Abrir Bizum 🚀
        </a>

        <button
          onClick={onClose}
          className="w-full rounded-2xl py-3 font-semibold text-sm active:scale-[0.98] transition-transform"
          style={{ backgroundColor: 'transparent', color: '#555', border: '1px solid #333' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

export function TipJar({ bizumNumber }: TipJarProps) {
  const [open, setOpen] = useState(false)

  if (!bizumNumber) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full font-bold text-sm shadow-2xl active:scale-95 transition-transform"
        style={{ backgroundColor: '#1DB954', color: '#000' }}
      >
        <span className="text-base">🎸</span>
        <span>Propina</span>
      </button>

      {open && <TipModal bizumNumber={bizumNumber} onClose={() => setOpen(false)} />}
    </>
  )
}

export function TipJarBanner({ bizumNumber }: TipJarProps) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!bizumNumber || dismissed) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-4 mb-4 w-[calc(100%-2rem)] rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
        style={{ background: 'linear-gradient(135deg, #1a2e1a, #0d1f0d)', border: '1px solid #1DB95450' }}
      >
        <span className="text-2xl shrink-0">🎸</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">¿Te está gustando la música?</p>
          <p className="text-xs mt-0.5" style={{ color: '#1DB954' }}>Déjame una propina por Bizum</p>
        </div>
        <span className="text-xs font-bold shrink-0 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#1DB954', color: '#000' }}>
          ♥ Propina
        </span>
      </button>

      {open && (
        <TipModal
          bizumNumber={bizumNumber}
          onClose={() => { setOpen(false); setDismissed(true) }}
        />
      )}
    </>
  )
}
