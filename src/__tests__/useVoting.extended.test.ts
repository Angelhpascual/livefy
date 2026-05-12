import { renderHook, act } from '@testing-library/react'
import { useVoting, MAX_VOTES } from '@/features/voting/useVoting'

const VOTES_KEY = (eventId: string) => `livefy_votes_${eventId}`
const VERSION_KEY = (eventId: string) => `livefy_votes_version_${eventId}`
const CURRENT_VERSION = 'v4'

function seedVotes(eventId: string, songIds: string[]) {
  localStorage.setItem(VOTES_KEY(eventId), JSON.stringify(songIds))
  localStorage.setItem(VERSION_KEY(eventId), CURRENT_VERSION)
}

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
      await act(async () => { await result.current.vote(`entry-${i}`, `song-${i}`, 'free') })
    }

    expect(result.current.canVote).toBe(false)
    expect(result.current.votesUsed).toBe(MAX_VOTES)
  })

  it('free vote is blocked when limit reached', async () => {
    const songIds = Array.from({ length: MAX_VOTES }, (_, i) => `song-${i}`)
    seedVotes('event-1', songIds)

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    await act(async () => {})

    const res = await act(async () => result.current.vote('entry-new', 'song-new', 'free'))
    expect(res.limitReached).toBe(true)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('resets votes when eventId changes', async () => {
    seedVotes('event-1', ['song-1', 'song-2'])

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

  it('resets votes when version key is missing (old data)', async () => {
    localStorage.setItem(VOTES_KEY('event-1'), JSON.stringify(['song-1', 'song-2', 'song-3']))
    // No version key — simulates old data

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    await act(async () => {})

    expect(result.current.votesUsed).toBe(0)
  })

  it('returns conflict:true on 409 and marks song as voted', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 409, json: async () => ({}) })

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    const res = await act(async () => result.current.vote('entry-1', 'song-1', 'free'))

    expect(res.conflict).toBe(true)
    expect(result.current.hasVoted('song-1')).toBe(true)
  })

  it('returns ok:false on network error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network'))

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    const res = await act(async () => result.current.vote('entry-1', 'song-1', 'free'))

    expect(res.ok).toBe(false)
    expect(result.current.hasVoted('song-1')).toBe(false)
  })

  it('loads existing song_ids from localStorage on mount', async () => {
    seedVotes('event-1', ['song-a', 'song-b'])

    const { result } = renderHook(() => useVoting('session-1', 'event-1'))
    await act(async () => {})

    expect(result.current.hasVoted('song-a')).toBe(true)
    expect(result.current.hasVoted('song-b')).toBe(true)
    expect(result.current.votesUsed).toBe(2)
  })
})
