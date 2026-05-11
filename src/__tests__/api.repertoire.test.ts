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

describe('GET /api/repertoire', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('returns empty array when no active event', async () => {
    mockFrom.mockReturnValue(buildChain({ data: null, error: { code: 'PGRST116' } }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    const json = await res.json() as unknown[]
    expect(res.status).toBe(200)
    expect(json).toEqual([])
  })

  it('returns virtual entries for songs with no setlist entry', async () => {
    const songs = [
      { id: 'song-1', title: 'Song A', artist: 'Artist A', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
    ]

    mockFrom
      .mockReturnValueOnce(buildChain({ data: { id: 'event-1' }, error: null }))
      .mockReturnValueOnce(buildChain({ data: songs, error: null }))
      .mockReturnValueOnce(buildChain({ data: [], error: null }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    const json = await res.json() as { id: string; votes: number; status: string }[]

    expect(res.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].id).toBe('virtual-song-1')
    expect(json[0].votes).toBe(0)
    expect(json[0].status).toBe('pending')
  })

  it('merges real entries with songs', async () => {
    const songs = [
      { id: 'song-1', title: 'Song A', artist: 'Artist A', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
    ]
    const entries = [
      { id: 'entry-1', song_id: 'song-1', event_id: 'event-1', votes: 5, status: 'pending', tier: 'free', position: 1, dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' },
    ]

    mockFrom
      .mockReturnValueOnce(buildChain({ data: { id: 'event-1' }, error: null }))
      .mockReturnValueOnce(buildChain({ data: songs, error: null }))
      .mockReturnValueOnce(buildChain({ data: entries, error: null }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    const json = await res.json() as { id: string; votes: number }[]

    expect(res.status).toBe(200)
    expect(json[0].id).toBe('entry-1')
    expect(json[0].votes).toBe(5)
  })

  it('sorts real entries with votes before virtual entries', async () => {
    const songs = [
      { id: 'song-1', title: 'B Song', artist: 'Artist B', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
      { id: 'song-2', title: 'A Song', artist: 'Artist A', image_urls: [], lyrics: null, artwork_url: null, created_at: '' },
    ]
    const entries = [
      { id: 'entry-1', song_id: 'song-1', event_id: 'event-1', votes: 3, status: 'pending', tier: 'free', position: 1, dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' },
    ]

    mockFrom
      .mockReturnValueOnce(buildChain({ data: { id: 'event-1' }, error: null }))
      .mockReturnValueOnce(buildChain({ data: songs, error: null }))
      .mockReturnValueOnce(buildChain({ data: entries, error: null }))

    const { GET } = await import('@/app/api/repertoire/route')
    const res = await GET()
    const json = await res.json() as { id: string }[]

    expect(json[0].id).toBe('entry-1')       // real entry with votes first
    expect(json[1].id).toBe('virtual-song-2') // virtual entry second
  })
})
