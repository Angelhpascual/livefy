describe('getSessionId — extended', () => {
  const SESSION_KEY = 'livefy_session_id'

  beforeEach(() => {
    localStorage.clear()
    jest.resetModules()
  })

  it('uses manual UUID fallback when crypto.randomUUID is not available', async () => {
    const originalRandomUUID = crypto.randomUUID
    // @ts-expect-error — intentionally removing for test
    delete crypto.randomUUID

    const { getSessionId } = await import('@/features/realtime/session')
    const id = getSessionId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

    crypto.randomUUID = originalRandomUUID
  })

  it('returns generated UUID when localStorage throws on getItem', async () => {
    const originalGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('blocked') }

    const { getSessionId } = await import('@/features/realtime/session')
    const id = getSessionId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)

    Storage.prototype.getItem = originalGetItem
  })

  it('generates a new UUID on each call when localStorage always throws', async () => {
    Storage.prototype.getItem = () => { throw new Error('blocked') }
    Storage.prototype.setItem = () => { throw new Error('blocked') }

    const { getSessionId } = await import('@/features/realtime/session')
    const id1 = getSessionId()
    const id2 = getSessionId()
    // Both are valid UUIDs but may differ since localStorage is unavailable
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
    expect(typeof id2).toBe('string')

    Storage.prototype.getItem = Object.getPrototypeOf(localStorage).getItem
    Storage.prototype.setItem = Object.getPrototypeOf(localStorage).setItem
  })
})
