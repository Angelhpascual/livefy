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

  it('with tier free only inserts vote', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { POST } = await import('@/app/api/votes/route')
    const req = makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'free' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    // Should only call from once (insert vote), not update setlist_entry
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
    const req = makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'priority', dedication: 'Para Maria' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledTimes(2)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ tier: 'priority', dedication: 'Para Maria' }))
  })

  it('returns 409 if vote is duplicate', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: { code: '23505', message: 'unique violation' } })
    mockFrom.mockReturnValue({ insert: insertMock })

    const { POST } = await import('@/app/api/votes/route')
    const req = makeRequest({ entryId: 'e1', sessionId: 's1', tier: 'free' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toBe('Already voted')
  })
})
