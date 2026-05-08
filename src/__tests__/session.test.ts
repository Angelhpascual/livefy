describe('getSessionId', () => {
  const SESSION_KEY = 'livefy_session_id'

  beforeEach(() => {
    localStorage.clear()
    jest.resetModules()
  })

  it('generates UUID and persists in localStorage', async () => {
    const { getSessionId } = await import('@/features/realtime/session')
    const id = getSessionId()
    expect(id).toBeTruthy()
    expect(localStorage.getItem(SESSION_KEY)).toBe(id)
  })

  it('returns the same ID on successive calls', async () => {
    const { getSessionId } = await import('@/features/realtime/session')
    const id1 = getSessionId()
    const id2 = getSessionId()
    expect(id1).toBe(id2)
  })

  it('handles localStorage not available without crashing', async () => {
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.getItem = () => { throw new Error('blocked') }
    Storage.prototype.setItem = () => { throw new Error('blocked') }

    const { getSessionId } = await import('@/features/realtime/session')
    expect(() => getSessionId()).not.toThrow()
    const id = getSessionId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)

    Storage.prototype.getItem = originalGetItem
    Storage.prototype.setItem = originalSetItem
  })
})
