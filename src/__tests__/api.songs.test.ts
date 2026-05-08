/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// --- Supabase mock ---
const mockSingle = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()
const mockNeq = jest.fn()

function buildChain(finalResult: unknown) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'single']
  methods.forEach((m) => {
    chain[m] = jest.fn(() => chain)
  })
  // Override single to return actual data
  chain['single'] = jest.fn(() => Promise.resolve(finalResult))
  // Default awaitable
  const promise = Promise.resolve(finalResult)
  Object.assign(chain, promise)
  chain['then'] = (res: unknown, rej: unknown) => promise.then(res as never, rej as never)
  chain['catch'] = (fn: unknown) => promise.catch(fn as never)
  return chain
}

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}))

// Helpers to build request
function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/songs', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeRequestWithId(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/songs/song-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/songs', () => {
  it('returns array of songs', async () => {
    const songs = [
      { id: '1', title: 'Song A', artist: 'Artist A', image_urls: [], lyrics: null, created_at: '' },
    ]
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      then: (res: (v: unknown) => unknown) => Promise.resolve(res({ data: songs, error: null })),
    })

    const { GET } = await import('@/app/api/songs/route')
    const res = await GET()
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual(songs)
  })
})

describe('POST /api/songs', () => {
  it('creates song correctly', async () => {
    const song = { id: '2', title: 'New Song', artist: 'Artist B', image_urls: [], lyrics: null, created_at: '' }
    const singleMock = jest.fn().mockResolvedValue({ data: song, error: null })
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: singleMock,
    })

    const { POST } = await import('@/app/api/songs/route')
    const req = makeRequest('POST', { title: 'New Song', artist: 'Artist B' })
    const res = await POST(req)
    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json).toEqual(song)
  })

  it('returns 400 when title is missing', async () => {
    const { POST } = await import('@/app/api/songs/route')
    const req = makeRequest('POST', { artist: 'Artist B' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when artist is missing', async () => {
    const { POST } = await import('@/app/api/songs/route')
    const req = makeRequest('POST', { title: 'New Song' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/songs/[id]', () => {
  it('returns 404 if song does not exist', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: singleMock,
    })

    const { GET } = await import('@/app/api/songs/[id]/route')
    const req = makeRequestWithId('GET')
    const res = await GET(req, mockParams('song-1'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/songs/[id]', () => {
  it('updates song including lyrics and image_urls', async () => {
    const updated = {
      id: 'song-1',
      title: 'Updated',
      artist: 'Artist X',
      image_urls: ['https://img.com/a.webp'],
      lyrics: 'Some lyrics',
      created_at: '',
    }
    const singleMock = jest.fn().mockResolvedValue({ data: updated, error: null })
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: singleMock,
    })

    const { PUT } = await import('@/app/api/songs/[id]/route')
    const req = makeRequestWithId('PUT', { title: 'Updated', artist: 'Artist X', image_urls: ['https://img.com/a.webp'], lyrics: 'Some lyrics' })
    const res = await PUT(req, mockParams('song-1'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.lyrics).toBe('Some lyrics')
    expect(json.image_urls).toEqual(['https://img.com/a.webp'])
  })
})

describe('DELETE /api/songs/[id]', () => {
  it('deletes song correctly', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      eq: eqMock,
    })

    const { DELETE } = await import('@/app/api/songs/[id]/route')
    const req = makeRequestWithId('DELETE')
    const res = await DELETE(req, mockParams('song-1'))
    expect(res.status).toBe(204)
  })
})
