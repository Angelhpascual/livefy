import { renderHook, act } from '@testing-library/react'
import { useVoting } from '@/features/voting/useVoting'

const VOTES_KEY = 'livefy_votes_event-1'
const VERSION_KEY = 'livefy_votes_version_event-1'

describe('useVoting', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
    global.fetch = jest.fn()
  })

  it('hasVoted returns false for non-voted song', () => {
    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    expect(result.current.hasVoted('song-1')).toBe(false)
  })

  it('vote() calls /api/votes with correct parameters', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true, status: 201, json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    await act(async () => {
      await result.current.vote('entry-1', 'song-1', 'free', 'Para Juan')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/votes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ entryId: 'entry-1', eventId: 'event-1', sessionId: 'session-1', tier: 'free', dedication: 'Para Juan' }),
      })
    )
  })

  it('vote() persists song_id in localStorage after success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true, status: 201, json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    await act(async () => { await result.current.vote('entry-1', 'song-1', 'free') })

    const stored = JSON.parse(localStorage.getItem(VOTES_KEY) ?? '[]') as string[]
    expect(stored).toContain('song-1')
  })

  it('hasVoted returns true after voting by song_id', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true, status: 201, json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    await act(async () => { await result.current.vote('entry-1', 'song-1', 'free') })

    expect(result.current.hasVoted('song-1')).toBe(true)
  })

  it('hasVoted returns true for virtual entry after voting', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true, status: 201, json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    // Vote using virtual entry ID — song_id extracted from it
    await act(async () => { await result.current.vote('virtual-song-1', 'song-1', 'free') })

    // Both virtual and real entry should show as voted
    expect(result.current.hasVoted('song-1')).toBe(true)
    expect(result.current.hasVoted('virtual-song-1')).toBe(true)
  })

  it('cannot vote same song again when entry ID changes from virtual to real', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true, status: 201, json: async () => ({ ok: true }),
    })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    // First vote: virtual entry
    await act(async () => { await result.current.vote('virtual-song-1', 'song-1', 'free') })
    expect(result.current.hasVoted('song-1')).toBe(true)

    // Second attempt: real entry (same song, different ID after realtime update)
    const res = await act(async () => result.current.vote('real-entry-uuid', 'song-1', 'free'))

    // Should be blocked without even calling the API
    expect(res.limitReached).toBe(false)
    expect(res.ok).toBe(false)
    // fetch called only once (the first vote)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
