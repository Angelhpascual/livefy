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
  created_at: '',
}

describe('ScoreViewer', () => {
  it('renders image when image_urls exist', () => {
    const song: Song = { ...baseSong, image_urls: ['https://example.com/score.webp'] }
    render(<ScoreViewer song={song} onClose={() => {}} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/score.webp')
  })

  it('renders lyrics when only lyrics exist', () => {
    const song: Song = { ...baseSong, lyrics: 'Do Re Mi' }
    render(<ScoreViewer song={song} onClose={() => {}} />)
    expect(screen.getByText('Do Re Mi')).toBeInTheDocument()
  })

  it('shows tabs when song has both images and lyrics', () => {
    const song: Song = { ...baseSong, image_urls: ['https://example.com/score.webp'], lyrics: 'Do Re Mi' }
    render(<ScoreViewer song={song} onClose={() => {}} />)
    expect(screen.getByText('Letra')).toBeInTheDocument()
    expect(screen.getByText('Partitura')).toBeInTheDocument()
  })

  it('calls onClose on Escape key', () => {
    const onClose = jest.fn()
    const song: Song = { ...baseSong, lyrics: 'Do Re Mi' }
    render(<ScoreViewer song={song} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('navigates to next page on ArrowRight', () => {
    const song: Song = {
      ...baseSong,
      image_urls: ['https://example.com/score1.webp', 'https://example.com/score2.webp'],
    }
    render(<ScoreViewer song={song} onClose={() => {}} />)
    // Initially showing page 1
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('does not render if neither images nor lyrics', () => {
    const song: Song = { ...baseSong }
    const { container } = render(<ScoreViewer song={song} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })
})
