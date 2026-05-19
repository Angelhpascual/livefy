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

function chain(result: unknown) {
  const promise = Promise.resolve(result)
  const value: Record<string, unknown> = {
    select: jest.fn(() => value),
    eq: jest.fn(() => value),
    in: jest.fn(() => value),
    order: jest.fn(() => value),
    limit: jest.fn(() => value),
    insert: jest.fn(() => value),
    update: jest.fn(() => value),
    single: jest.fn(() => promise),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  }
  return value
}

function mockExistingEntryFlow(insertResult: unknown, updateResult?: unknown) {
  mockFrom
    .mockReturnValueOnce(chain({ data: { id: 'event-1' }, error: null }))
    .mockReturnValueOnce(chain({ data: { id: 'entry-1' }, error: null }))
    .mockReturnValueOnce(chain({ data: [{ id: 'entry-1' }, { id: 'entry-2' }], error: null }))
    .mockReturnValueOnce(chain({ count: 0, error: null }))
    .mockReturnValueOnce(chain(insertResult))

  if (updateResult) mockFrom.mockReturnValueOnce(chain(updateResult))
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
    mockExistingEntryFlow({ error: null })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'entry-1', eventId: 'event-1', sessionId: 's1', tier: 'free' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledTimes(5)
  })

  it('with tier priority updates setlist entry with tier and dedication', async () => {
    const updateChain = chain({ error: null })
    mockExistingEntryFlow({ error: null })
    mockFrom.mockReturnValueOnce(updateChain)

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'entry-1', eventId: 'event-1', sessionId: 's1', tier: 'priority', dedication: 'Para Maria' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ tier: 'priority', dedication: 'Para Maria' }))
  })

  it('returns 409 if vote is duplicate', async () => {
    mockExistingEntryFlow({ error: { code: '23505', message: 'unique violation' } })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'entry-1', eventId: 'event-1', sessionId: 's1', tier: 'free' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error).toBe('Already voted')
  })

  it('returns 403 when session reached vote limit for event', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: 'event-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: { id: 'entry-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: [{ id: 'entry-1' }, { id: 'entry-2' }, { id: 'entry-3' }, { id: 'entry-4' }, { id: 'entry-5' }], error: null }))
      .mockReturnValueOnce(chain({ count: 5, error: null }))

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'entry-1', eventId: 'event-1', sessionId: 's1', tier: 'free' }))

    expect(res.status).toBe(403)
  })

  it('handles virtual entry — creates real entry before voting', async () => {
    mockFrom
      .mockReturnValueOnce(chain({ data: { id: 'event-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: { position: 2 }, error: null }))
      .mockReturnValueOnce(chain({ data: { id: 'real-entry-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: [{ id: 'real-entry-1' }], error: null }))
      .mockReturnValueOnce(chain({ count: 0, error: null }))
      .mockReturnValueOnce(chain({ error: null }))

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'virtual-song-1', eventId: 'event-1', sessionId: 's1', tier: 'free' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.ok).toBe(true)
  })

  it('returns 404 if there is no active event', async () => {
    mockFrom.mockReturnValueOnce(chain({ data: null, error: { code: 'PGRST116' } }))

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'virtual-song-1', eventId: 'event-1', sessionId: 's1', tier: 'free' }))

    expect(res.status).toBe(404)
  })

  it('returns 500 on database error', async () => {
    mockExistingEntryFlow({ error: { code: '42000', message: 'DB error' } })

    const { POST } = await import('@/app/api/votes/route')
    const res = await POST(makeRequest({ entryId: 'entry-1', eventId: 'event-1', sessionId: 's1', tier: 'free' }))

    expect(res.status).toBe(500)
  })
})
