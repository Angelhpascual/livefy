/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}))

function makeRequest(url: string, method: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/admin/setlist', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('returns 404 if no active event', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: singleMock,
    })

    const { GET } = await import('@/app/api/admin/setlist/route')
    const res = await GET()
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/setlist', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('adds song with incremental position', async () => {
    const entry = { id: 'se-1', song_id: 'song-1', position: 2, status: 'pending', tier: 'free', votes: 0, event_id: 'ev-1', dedication: null, bizum_confirmed: false, requester_session: null, created_at: '' }

    // First call: get active event
    const eventSingleMock = jest.fn().mockResolvedValue({ data: { id: 'ev-1' }, error: null })
    // Second call: get max position
    const maxSingleMock = jest.fn().mockResolvedValue({ data: { position: 1 }, error: null })
    // Third call: insert
    const insertSingleMock = jest.fn().mockResolvedValue({ data: entry, error: null })

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: eventSingleMock,
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: maxSingleMock,
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: insertSingleMock,
      })

    const { POST } = await import('@/app/api/admin/setlist/route')
    const req = makeRequest('http://localhost/api/admin/setlist', 'POST', { songId: 'song-1' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.position).toBe(2)
  })
})

describe('PATCH /api/admin/setlist/[id]', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('with status playing sets other entries to pending', async () => {
    const updatedEntry = { id: 'se-1', status: 'playing', event_id: 'ev-1' }

    // First: get entry event_id
    const getSingleMock = jest.fn().mockResolvedValue({ data: { event_id: 'ev-1' }, error: null })
    // Second: update other entries to pending
    const neqMock = jest.fn().mockResolvedValue({ error: null })
    const eqStatusMock = jest.fn(() => ({ neq: neqMock }))
    const eqEventMock = jest.fn(() => ({ eq: eqStatusMock }))
    const updatePendingMock = jest.fn(() => ({ eq: eqEventMock }))
    // Third: update target entry
    const patchSingleMock = jest.fn().mockResolvedValue({ data: updatedEntry, error: null })

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: getSingleMock,
      })
      .mockReturnValueOnce({ update: updatePendingMock })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: patchSingleMock,
      })

    const { PATCH } = await import('@/app/api/admin/setlist/[id]/route')
    const req = makeRequest('http://localhost/api/admin/setlist/se-1', 'PATCH', { status: 'playing' })
    const res = await PATCH(req, mockParams('se-1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe('playing')
    expect(updatePendingMock).toHaveBeenCalledWith({ status: 'pending' })
  })
})

describe('DELETE /api/admin/setlist/[id]', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('deletes setlist entry', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      delete: jest.fn(() => ({ eq: eqMock })),
    })

    const { DELETE } = await import('@/app/api/admin/setlist/[id]/route')
    const req = makeRequest('http://localhost/api/admin/setlist/se-1', 'DELETE')
    const res = await DELETE(req, mockParams('se-1'))
    expect(res.status).toBe(200)
  })
})
