'use client'

import { Song } from '@/types'
import { ScoreViewer } from './ScoreViewer'

interface LyricsModalProps {
  song: Song
  onClose: () => void
}

export function LyricsModal({ song, onClose }: LyricsModalProps) {
  return <ScoreViewer song={song} onClose={onClose} />
}
