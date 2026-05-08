'use client'

import { useState, useEffect } from 'react'

interface TableSelectScreenProps {
  onSelect: (tableNumber: number) => void
}

const TABLE_STORAGE_KEY = 'livefy_table'
const TABLE_COUNT = 12

export function TableSelectScreen({ onSelect }: TableSelectScreenProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if already saved
    try {
      const saved = localStorage.getItem(TABLE_STORAGE_KEY)
      if (saved) {
        const num = parseInt(saved, 10)
        if (!isNaN(num) && num >= 1 && num <= TABLE_COUNT) {
          onSelect(num)
          return
        }
      }
    } catch {
      // ignore
    }
    // Trigger fade in
    requestAnimationFrame(() => setVisible(true))
  }, [onSelect])

  function handleContinue() {
    if (selected === null) return
    try {
      localStorage.setItem(TABLE_STORAGE_KEY, String(selected))
    } catch {
      // ignore
    }
    onSelect(selected)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10 transition-opacity duration-500"
      style={{
        backgroundColor: '#0a0a0a',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1
            className="font-display text-5xl font-black tracking-tight"
            style={{ color: '#1DB954' }}
          >
            Livefy
          </h1>
          <p className="text-base font-medium" style={{ color: '#888' }}>
            ¿En qué mesa estás?
          </p>
        </div>

        {/* Grid of tables */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((num) => {
            const isSelected = selected === num
            return (
              <button
                key={num}
                onClick={() => setSelected(num)}
                className="aspect-square rounded-2xl flex items-center justify-center text-2xl font-black active:scale-95 transition-transform"
                style={{
                  backgroundColor: isSelected ? '#1DB95420' : '#1a1a1a',
                  border: `2px solid ${isSelected ? '#1DB954' : '#333'}`,
                  color: isSelected ? '#1DB954' : '#fff',
                }}
                aria-label={`Mesa ${num}`}
                aria-pressed={isSelected}
              >
                {num}
              </button>
            )
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={selected === null}
          className="w-full py-4 rounded-2xl font-bold text-base transition-opacity active:scale-[0.98]"
          style={{
            backgroundColor: selected !== null ? '#1DB954' : '#1DB95440',
            color: selected !== null ? '#000' : '#00000066',
            cursor: selected !== null ? 'pointer' : 'not-allowed',
          }}
          aria-disabled={selected === null}
        >
          Continuar
        </button>
      </div>
    </main>
  )
}
