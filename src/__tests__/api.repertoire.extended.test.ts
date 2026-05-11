/**
 * @jest-environment node
 */

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))

function buildChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['select', 'eq', 'order', 'single', 'limit']
  methods.forEach((m) => { chain[m] = jest.fn(() => chain) })
  chain['then'] = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res)
  return chain
}

describe('GET /api/repertoire — extended', () => {
  beforeEach(() => { jest.resetModules(); mockFrom.mockReset() })

  it('returns 500 when songs query fails', async () => {
    mockFrom
      .mockReturnValueOnce(buildChain({ data: { id: 'event-1' }, error: null }))
      .mockReturnValueOnce(buildChain({ data: null, error: { message: 'DB error' } }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('includes played entries at the end', async () => {
    const songs = [
      { id: 'song-1', title: 'A', artist: 'Artist A', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
      { id: 'song-2', title: 'B', artist: 'Artist B', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
    ]
    const entries = [
      { id: 'entry-1', song_id: 'song-1', event_id: 'ev-1', votes: 3, status: 'pending', tier: 'free', position: 1, dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' },
      { id: 'entry-2', song_id: 'song-2', event_id: 'ev-1', votes: 0, status: 'played', tier: 'free', position: 2, dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' },
    ]

    mockFrom
      .mockReturnValueOnce(buildChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(buildChain({ data: songs, error: null }))
      .mockReturnValueOnce(buildChain({ data: entries, error: null }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    const json = await res.json() as { id: string; status: string }[]

    expect(json[0].id).toBe('entry-1')
    expect(json[1].id).toBe('entry-2')
    expect(json[1].status).toBe('played')
  })

  it('sorts multiple real entries by votes descending', async () => {
    const songs = [
      { id: 'song-1', title: 'A', artist: 'A', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
      { id: 'song-2', title: 'B', artist: 'B', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
    ]
    const entries = [
      { id: 'entry-1', song_id: 'song-1', event_id: 'ev-1', votes: 1, status: 'pending', tier: 'free', position: 1, dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' },
      { id: 'entry-2', song_id: 'song-2', event_id: 'ev-1', votes: 5, status: 'pending', tier: 'free', position: 2, dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' },
    ]

    mockFrom
      .mockReturnValueOnce(buildChain({ data: { id: 'ev-1' }, error: null }))
      .mockReturnValueOnce(buildChain({ data: songs, error: null }))
      .mockReturnValueOnce(buildChain({ data: entries, error: null }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    const json = await res.json() as { id: string; votes: number }[]

    expect(json[0].id).toBe('entry-2') // 5 votes first
    expect(json[1].id).toBe('entry-1') // 1 vote second
  })
})
