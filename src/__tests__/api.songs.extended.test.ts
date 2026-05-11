/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}))

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) })

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/songs/song-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/songs/[id]', () => {
  beforeEach(() => { jest.resetModules(); mockFrom.mockReset() })

  it('returns song when found', async () => {
    const song = { id: 'song-1', title: 'Hey Ya!', artist: 'Outkast', image_urls: [], lyrics: null, artwork_url: null, created_at: '' }
    const singleMock = jest.fn().mockResolvedValue({ data: song, error: null })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: singleMock })

    const { GET } = await import('@/app/api/songs/[id]/route')
    const res = await GET(makeRequest('GET'), mockParams('song-1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.title).toBe('Hey Ya!')
  })

  it('returns 500 on database error', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: '42000', message: 'DB error' } })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: singleMock })

    const { GET } = await import('@/app/api/songs/[id]/route')
    const res = await GET(makeRequest('GET'), mockParams('song-1'))

    expect(res.status).toBe(500)
  })
})

describe('GET /api/songs', () => {
  beforeEach(() => { jest.resetModules(); mockFrom.mockReset() })

  it('returns 500 on database error', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (res: (v: unknown) => unknown) => Promise.resolve(res({ data: null, error: { message: 'DB error' } })),
    })

    const { GET } = await import('@/app/api/songs/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('GET /api/admin/events', () => {
  beforeEach(() => { jest.resetModules(); mockFrom.mockReset() })

  it('returns list of events ordered by date', async () => {
    const events = [
      { id: 'ev-1', name: 'Gig 1', date: '2026-05-01', active: false, bizum_number: null, created_at: '' },
      { id: 'ev-2', name: 'Gig 2', date: '2026-05-08', active: true, bizum_number: null, created_at: '' },
    ]
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (res: (v: unknown) => unknown) => Promise.resolve(res({ data: events, error: null })),
    })

    const { GET } = await import('@/app/api/admin/events/route')
    const res = await GET()
    const json = await res.json() as unknown[]

    expect(res.status).toBe(200)
    expect(json).toHaveLength(2)
  })

  it('returns 500 on database error', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (res: (v: unknown) => unknown) => Promise.resolve(res({ data: null, error: { message: 'DB error' } })),
    })

    const { GET } = await import('@/app/api/admin/events/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
