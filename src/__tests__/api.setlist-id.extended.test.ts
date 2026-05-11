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
  return new NextRequest(`http://localhost/api/admin/setlist/${method === 'DELETE' ? 'se-1' : 'se-1'}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('PATCH /api/admin/setlist/[id] — extended', () => {
  beforeEach(() => { jest.resetModules(); mockFrom.mockReset() })

  it('returns 500 on database error', async () => {
    const patchSingleMock = jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: patchSingleMock,
    })

    const { PATCH } = await import('@/app/api/admin/setlist/[id]/route')
    const res = await PATCH(makeRequest('PATCH', { status: 'played' }), mockParams('se-1'))
    expect(res.status).toBe(500)
  })

  it('with status played does not reset other entries', async () => {
    const patchSingleMock = jest.fn().mockResolvedValue({ data: { id: 'se-1', status: 'played' }, error: null })

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: patchSingleMock,
    })

    const { PATCH } = await import('@/app/api/admin/setlist/[id]/route')
    const res = await PATCH(makeRequest('PATCH', { status: 'played' }), mockParams('se-1'))
    expect(res.status).toBe(200)
    // Only one from() call — no reset of other entries
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('confirms bizum correctly', async () => {
    const patchSingleMock = jest.fn().mockResolvedValue({ data: { id: 'se-1', bizum_confirmed: true }, error: null })

    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: patchSingleMock,
    })

    const { PATCH } = await import('@/app/api/admin/setlist/[id]/route')
    const res = await PATCH(makeRequest('PATCH', { bizum_confirmed: true }), mockParams('se-1'))
    const json = await res.json() as { bizum_confirmed: boolean }
    expect(res.status).toBe(200)
    expect(json.bizum_confirmed).toBe(true)
  })
})

describe('DELETE /api/admin/setlist/[id] — extended', () => {
  beforeEach(() => { jest.resetModules(); mockFrom.mockReset() })

  it('returns 500 on database error', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: { message: 'DB error' } })
    mockFrom.mockReturnValue({ delete: jest.fn(() => ({ eq: eqMock })) })

    const { DELETE } = await import('@/app/api/admin/setlist/[id]/route')
    const res = await DELETE(makeRequest('DELETE'), mockParams('se-1'))
    expect(res.status).toBe(500)
  })
})
