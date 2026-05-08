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

describe('POST /api/admin/events', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('deactivates existing events and creates new active event', async () => {
    const newEvent = { id: 'ev-2', name: 'Gig', date: '2026-06-01', active: true, bizum_number: null, created_at: '' }
    const eqUpdateMock = jest.fn().mockResolvedValue({ error: null })
    const updateMock = jest.fn(() => ({ eq: eqUpdateMock }))
    const singleMock = jest.fn().mockResolvedValue({ data: newEvent, error: null })

    mockFrom
      .mockReturnValueOnce({ update: updateMock })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: singleMock,
      })

    const { POST } = await import('@/app/api/admin/events/route')
    const req = makeRequest('http://localhost/api/admin/events', 'POST', { name: 'Gig', date: '2026-06-01' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.active).toBe(true)
    expect(updateMock).toHaveBeenCalledWith({ active: false })
  })
})

describe('PATCH /api/admin/events/[id]', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('with active:true deactivates other events first', async () => {
    const updatedEvent = { id: 'ev-1', name: 'Gig', date: '2026-06-01', active: true, bizum_number: null, created_at: '' }
    const neqMock = jest.fn().mockResolvedValue({ error: null })
    const eqDeactivateMock = jest.fn(() => ({ neq: neqMock }))
    const updateDeactivateMock = jest.fn(() => ({ eq: eqDeactivateMock }))
    const singleMock = jest.fn().mockResolvedValue({ data: updatedEvent, error: null })

    mockFrom
      .mockReturnValueOnce({ update: updateDeactivateMock })
      .mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: singleMock,
      })

    const { PATCH } = await import('@/app/api/admin/events/[id]/route')
    const req = makeRequest('http://localhost/api/admin/events/ev-1', 'PATCH', { active: true })
    const res = await PATCH(req, mockParams('ev-1'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.active).toBe(true)
    expect(updateDeactivateMock).toHaveBeenCalledWith({ active: false })
  })
})

describe('DELETE /api/admin/events/[id]', () => {
  beforeEach(() => {
    jest.resetModules()
    mockFrom.mockReset()
  })

  it('deletes event', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({
      delete: jest.fn(() => ({ eq: eqMock })),
    })

    const { DELETE } = await import('@/app/api/admin/events/[id]/route')
    const req = makeRequest('http://localhost/api/admin/events/ev-1', 'DELETE')
    const res = await DELETE(req, mockParams('ev-1'))
    expect(res.status).toBe(204)
  })
})
