/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

const mockFrom = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({ from: mockFrom })),
}))

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/suggestions', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('returns 400 when title is missing', async () => {
    const { POST } = await import('@/app/api/suggestions/route')
    const res = await POST(makeRequest({ sessionId: 'session-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when sessionId is missing', async () => {
    const { POST } = await import('@/app/api/suggestions/route')
    const res = await POST(makeRequest({ title: 'Bohemian Rhapsody' }))
    expect(res.status).toBe(400)
  })

  it('creates suggestion with active event id', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'event-1' }, error: null }),
      })
      .mockReturnValueOnce({ insert: insertMock })

    const { POST } = await import('@/app/api/suggestions/route')
    const res = await POST(makeRequest({ title: 'Bohemian Rhapsody', artist: 'Queen', sessionId: 'session-1' }))
    const json = await res.json() as { ok: boolean }

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      session_id: 'session-1',
      event_id: 'event-1',
    }))
  })

  it('creates suggestion without event if none active', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      })
      .mockReturnValueOnce({ insert: insertMock })

    const { POST } = await import('@/app/api/suggestions/route')
    const res = await POST(makeRequest({ title: 'Wonderwall', sessionId: 'session-1' }))

    expect(res.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ event_id: null }))
  })

  it('trims whitespace from title and artist', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })
      .mockReturnValueOnce({ insert: insertMock })

    const { POST } = await import('@/app/api/suggestions/route')
    await POST(makeRequest({ title: '  Creep  ', artist: '  Radiohead  ', sessionId: 's1' }))

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Creep',
      artist: 'Radiohead',
    }))
  })
})
