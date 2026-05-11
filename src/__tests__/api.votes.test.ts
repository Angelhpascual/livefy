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

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/votes', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('with tier free only inserts vote', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'free' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('with tier priority updates setlist entry with tier and dedication', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    const eqMock = jest.fn().mockResolvedValue({ error: null })
    const updateMock = jest.fn(() => ({ eq: eqMock }))

    mockFrom
      .mockReturnValueOnce({ insert: insertMock })
      .mockReturnValueOnce({ update: updateMock })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'priority', dedication: 'Para Maria' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ tier: 'priority', dedication: 'Para Maria' }))
  })

  it('returns 409 if vote is duplicate', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: { code: '23505', message: 'unique violation' } })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'free' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toBe('Already voted')
  })

  it('handles virtual entry — creates real entry before voting', async () => {
    const eventSingle = jest.fn().mockResolvedValue({ data: { id: 'ev-1' }, error: null })
    const maxSingle = jest.fn().mockResolvedValue({ data: { position: 2 }, error: null })
    const newEntrySingle = jest.fn().mockResolvedValue({ data: { id: 'real-entry-1' }, error: null })
    const insertVoteMock = jest.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: eventSingle })
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), single: maxSingle })
      .mockReturnValueOnce({ insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: newEntrySingle })
      .mockReturnValueOnce({ insert: insertVoteMock })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'virtual-song-1', sessionId: 's1', tier: 'free' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(insertVoteMock).toHaveBeenCalledWith(expect.objectContaining({
      setlist_entry_id: 'real-entry-1',
    }))
  })

  it('returns 404 if virtual entry has no active event', async () => {
    const eventSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockFrom.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: eventSingle })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'virtual-song-1', sessionId: 's1', tier: 'free' }))

    expect(res.status).toBe(404)
  })

  it('returns 500 on database error', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: { code: '42000', message: 'DB error' } })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'free' }))

    expect(res.status).toBe(500)
  })
})
