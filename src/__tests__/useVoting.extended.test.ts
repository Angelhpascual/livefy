import { renderHook, act } from '@testing-library/react'
import { useVoting, MAX_VOTES } from '@/features/voting/useVoting'

const VOTES_KEY = (eventId: string) => `livefy_votes_${eventId}`

describe('useVoting — extended', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.resetAllMocks()
    global.fetch = jest.fn()
  })

  it('canVote is false when votes reach MAX_VOTES', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 201, json: async () => ({}) })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    for (let i = 0; i < MAX_VOTES; i++) {
      await act(async () => { await result.current.vote(`entry-${i}`, 'free') })
    }

    expect(result.current.canVote).toBe(false)
    expect(result.current.votesUsed).toBe(MAX_VOTES)
  })

  it('free vote is blocked when limit reached', async () => {
    // Pre-fill votes in localStorage
    const votes = Array.from({ length: MAX_VOTES }, (_, i) => `entry-${i}`)
    localStorage.setItem(VOTES_KEY('event-1'), JSON.stringify(votes))

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))

    await act(async () => {}) // wait for effect

    const res = await act(async () => result.current.vote('entry-new', 'free'))
    expect(res.limitReached).toBe(true)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('resets votes when eventId changes', async () => {
    localStorage.setItem(VOTES_KEY('event-1'), JSON.stringify(['entry-1', 'entry-2']))

    const { result, rerender } = renderHook(
      ({ eventId }) => useVoting('session-1', eventId),
      { initialProps: { eventId: 'event-1' } }
    )

    await act(async () => {})
    expect(result.current.votesUsed).toBe(2)

    rerender({ eventId: 'event-2' })
    await act(async () => {})
    expect(result.current.votesUsed).toBe(0)
  })

  it('returns conflict:true on 409 and marks as voted', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 409, json: async () => ({}) })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    const res = await act(async () => result.current.vote('entry-1', 'free'))

    expect(res.conflict).toBe(true)
    expect(result.current.hasVoted('entry-1')).toBe(true)
  })

  it('returns ok:false on network error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network'))

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    const res = await act(async () => result.current.vote('entry-1', 'free'))

    expect(res.ok).toBe(false)
    expect(result.current.hasVoted('entry-1')).toBe(false)
  })

  it('loads existing votes from localStorage on mount', async () => {
    localStorage.setItem(VOTES_KEY('event-1'), JSON.stringify(['entry-a', 'entry-b']))

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    await act(async () => {})

    expect(result.current.hasVoted('entry-a')).toBe(true)
    expect(result.current.hasVoted('entry-b')).toBe(true)
    expect(result.current.votesUsed).toBe(2)
  })
})
