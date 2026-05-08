import { renderHook, act } from '@testing-library/react'
import { useVoting } from '@/features/voting/useVoting'

const VOTES_KEY = 'livefy_votes_event-1'

describe('useVoting', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
    global.fetch = jest.fn()
  })

  it('hasVoted returns false for non-voted entry', () => {
    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    expect(result.current.hasVoted('entry-1')).toBe(false)
  })

  it('vote() calls /api/votes with correct parameters', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    await act(async () => {
      await result.current.vote('entry-1', 'free', 'Para Juan')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/votes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ entryId: 'entry-1', sessionId: 'session-1', tier: 'free', dedication: 'Para Juan' }),
      })
    )
  })

  it('vote() persists in localStorage after success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    await act(async () => {
      await result.current.vote('entry-1', 'free')
    })

    const stored = JSON.parse(localStorage.getItem(VOTES_KEY) ?? '[]') as string[]
    expect(stored).toContain('entry-1')
  })

  it('hasVoted returns true after voting', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    await act(async () => {
      await result.current.vote('entry-1', 'free')
    })

    expect(result.current.hasVoted('entry-1')).toBe(true)
  })
})
