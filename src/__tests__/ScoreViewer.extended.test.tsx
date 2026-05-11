import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScoreViewer } from '@/features/songs/ScoreViewer'
import type { Song } from '@/types'

const baseSong: Song = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  image_urls: [],
  lyrics: null,
  artwork_url: null,
  created_at: '',
}

describe('ScoreViewer — extended', () => {
  it('switches to lyrics tab when Letra button is clicked', () => {
    const song: Song = { ...baseSong, image_urls: ['https://example.com/score.webp'], lyrics: 'Do Re Mi' }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    // Initially on image tab — tabs are visible
    expect(screen.getByText('Letra')).toBeInTheDocument()
    expect(screen.getByText('Partitura')).toBeInTheDocument()

    // Switch to lyrics tab
    fireEvent.click(screen.getByText('Letra'))
    expect(screen.getByText('Do Re Mi')).toBeInTheDocument()
  })

  it('switches back to image tab from lyrics tab', () => {
    const song: Song = { ...baseSong, image_urls: ['https://example.com/score.webp'], lyrics: 'Do Re Mi' }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    fireEvent.click(screen.getByText('Letra'))
    expect(screen.getByText('Do Re Mi')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Partitura'))
    expect(screen.queryByText('Do Re Mi')).not.toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('does not show tabs when only images (no lyrics)', () => {
    const song: Song = { ...baseSong, image_urls: ['https://example.com/score.webp'] }
    render(<ScoreViewer song={song} onClose={() => {}} />)
    expect(screen.queryByText('Letra')).not.toBeInTheDocument()
    expect(screen.queryByText('Partitura')).not.toBeInTheDocument()
  })

  it('navigates to previous page on ArrowLeft', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/score1.webp', 'https://example.com/score2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('navigates with PageDown and PageUp', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/s1.webp', 'https://example.com/s2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    fireEvent.keyDown(document, { key: 'PageDown' })
    expect(screen.getByText('2 / 2')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'PageUp' })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('does not go below page 0 on ArrowLeft at start', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/s1.webp', 'https://example.com/s2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('does not go beyond last page on ArrowRight at end', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/s1.webp', 'https://example.com/s2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    fireEvent.keyDown(document, { key: 'ArrowRight' })
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('handles touch swipe left to go next', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/s1.webp', 'https://example.com/s2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    fireEvent.touchStart(dialog, { touches: [{ clientX: 300 }] })
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 200 }] }) // swipe left = next

    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('handles touch swipe right to go prev', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/s1.webp', 'https://example.com/s2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)

    // Go to page 2 first
    fireEvent.keyDown(document, { key: 'ArrowRight' })

    const dialog = screen.getByRole('dialog')
    fireEvent.touchStart(dialog, { touches: [{ clientX: 200 }] })
    fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 300 }] }) // swipe right = prev

    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('restores body overflow on unmount', () => {
    const song: Song = { ...baseSong, lyrics: 'La la la' }
    const { unmount } = render(<ScoreViewer song={song} onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
