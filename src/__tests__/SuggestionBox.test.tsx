import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SuggestionBox } from '@/features/voting/SuggestionBox'

describe('SuggestionBox', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('renders the form', () => {
    render(<SuggestionBox sessionId="session-1" />)
    expect(screen.getByPlaceholderText('Nombre de la canción *')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Artista (opcional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar sugerencia/i })).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<SuggestionBox sessionId="session-1" />)
    expect(screen.getByRole('button', { name: /enviar sugerencia/i })).toBeDisabled()
  })

  it('enables submit button when title is filled', () => {
    render(<SuggestionBox sessionId="session-1" />)
    fireEvent.change(screen.getByPlaceholderText('Nombre de la canción *'), {
      target: { value: 'Bohemian Rhapsody' },
    })
    expect(screen.getByRole('button', { name: /enviar sugerencia/i })).not.toBeDisabled()
  })

  it('shows success message after submission', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    render(<SuggestionBox sessionId="session-1" />)
    fireEvent.change(screen.getByPlaceholderText('Nombre de la canción *'), {
      target: { value: 'Creep' },
    })
    fireEvent.change(screen.getByPlaceholderText('Artista (opcional)'), {
      target: { value: 'Radiohead' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar sugerencia/i }))

    await waitFor(() => {
      expect(screen.getByText('¡Gracias por tu sugerencia!')).toBeInTheDocument()
    })
  })

  it('calls /api/suggestions with correct data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    render(<SuggestionBox sessionId="session-42" />)
    fireEvent.change(screen.getByPlaceholderText('Nombre de la canción *'), {
      target: { value: 'Wonderwall' },
    })
    fireEvent.change(screen.getByPlaceholderText('Artista (opcional)'), {
      target: { value: 'Oasis' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar sugerencia/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/suggestions', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Wonderwall', artist: 'Oasis', sessionId: 'session-42' }),
      }))
    })
  })

  it('shows an error if fetch fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network'))

    render(<SuggestionBox sessionId="session-1" />)
    fireEvent.change(screen.getByPlaceholderText('Nombre de la canción *'), {
      target: { value: 'Hey Ya' },
    })
    fireEvent.click(screen.getByRole('button', { name: /enviar sugerencia/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No se pudo enviar')
    })
  })
})
